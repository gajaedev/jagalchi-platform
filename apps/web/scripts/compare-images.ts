#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Image Comparison Script
 *
 * Compares Figma exports with Storybook screenshots using pixelmatch.
 * Generates diff images and a JSON report.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';

interface ComparisonResult {
  name: string;
  figmaPath: string;
  actualPath: string;
  diffPath: string;
  diffPixels: number;
  diffPercentage: number;
  width: number;
  height: number;
  passed: boolean;
}

interface ComparisonReport {
  timestamp: string;
  total: number;
  passed: number;
  failed: number;
  threshold: number;
  results: ComparisonResult[];
}

interface FigmaVariant {
  name: string;
  nodeId: string;
  storybookName: string;
}

interface FigmaManifestComponent {
  componentName: string;
  frameNodeId: string;
  variants: FigmaVariant[];
}

interface FigmaNodeManifest {
  components: FigmaManifestComponent[];
}

const MANIFEST_PATH = path.join(process.cwd(), 'scripts/figma-node-id-manifest.json');

async function loadManifestTargetNames(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(raw) as FigmaNodeManifest;
    const targetNames = new Set<string>();

    for (const component of manifest.components ?? []) {
      for (const variant of component.variants ?? []) {
        targetNames.add(`${variant.storybookName}.png`);
      }
    }

    return targetNames;
  } catch {
    return new Set<string>();
  }
}

const DIFF_THRESHOLD = 2; // 2% difference allowed

async function loadPNG(filePath: string): Promise<PNG> {
  const buffer = await fs.readFile(filePath);
  return PNG.sync.read(buffer);
}

async function padOrCropImage(
  imagePathOrBuffer: string | Buffer,
  targetWidth: number,
  targetHeight: number,
): Promise<PNG> {
  const sourceBuffer = Buffer.isBuffer(imagePathOrBuffer)
    ? imagePathOrBuffer
    : await fs.readFile(imagePathOrBuffer);
  const source = await sharp(sourceBuffer);
  const metadata = await source.metadata();
  const sourceWidth = metadata.width ?? targetWidth;
  const sourceHeight = metadata.height ?? targetHeight;

  const cropWidth = Math.min(sourceWidth, targetWidth);
  const cropHeight = Math.min(sourceHeight, targetHeight);

  const resizedBuffer = await source
    .extract({ left: 0, top: 0, width: cropWidth, height: cropHeight })
    .extend({
      top: 0,
      left: 0,
      right: Math.max(0, targetWidth - cropWidth),
      bottom: Math.max(0, targetHeight - cropHeight),
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  return PNG.sync.read(resizedBuffer);
}

async function flattenImageToWhite(imagePathOrBuffer: string | Buffer): Promise<PNG> {
  const sourceBuffer = Buffer.isBuffer(imagePathOrBuffer)
    ? imagePathOrBuffer
    : await fs.readFile(imagePathOrBuffer);

  const flattened = await sharp(sourceBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();
  return PNG.sync.read(flattened);
}

async function compareImages(
  figmaPath: string,
  actualPath: string,
  diffPath: string,
): Promise<{ diffPixels: number; width: number; height: number }> {
  let figma = await loadPNG(figmaPath);
  let actual = await loadPNG(actualPath);

  figma = await flattenImageToWhite(figmaPath);
  actual = await flattenImageToWhite(actualPath);

  // Normalize image sizes without distorting by stretching.
  if (figma.width !== actual.width || figma.height !== actual.height) {
    console.log(
      `  ⚠️  Size mismatch: Figma ${figma.width}x${figma.height} vs Actual ${actual.width}x${actual.height}`,
    );
    console.log(`  📐 Normalizing to Figma dimensions for comparison...`);

    figma = await padOrCropImage(await fs.readFile(figmaPath), figma.width, figma.height);
    actual = await padOrCropImage(await fs.readFile(actualPath), figma.width, figma.height);

    console.log(`  ✓ Normalized to ${figma.width}x${figma.height}\n`);
  }

  const { width, height } = figma;
  const diff = new PNG({ width, height });

  // Compare images pixel by pixel
  const diffPixels = pixelmatch(figma.data, actual.data, diff.data, width, height, {
    threshold: 0.1, // Lower = more sensitive to differences
    includeAA: false, // Ignore anti-aliasing differences
  });

  // Save diff image
  await fs.writeFile(diffPath, PNG.sync.write(diff));

  return { diffPixels, width, height };
}

async function main() {
  const figmaDir = path.join(process.cwd(), 'visual-tests/figma');
  const actualDir = path.join(process.cwd(), 'visual-tests/actual');
  const diffDir = path.join(process.cwd(), 'visual-tests/diff');
  const reportPath = path.join(process.cwd(), 'visual-tests/comparison-report.json');

  // Ensure directories exist
  await fs.mkdir(diffDir, { recursive: true });

  console.log('🔍 Comparing Figma exports with Storybook screenshots...\n');

  const figmaManifestTargets = await loadManifestTargetNames();

  // Prefer explicit manifest target files only.
  const allPngFiles = (await fs.readdir(figmaDir)).filter((file) => file.endsWith('.png'));
  const figmaFiles = allPngFiles.filter(
    (file) => figmaManifestTargets.size === 0 || figmaManifestTargets.has(file),
  );

  const skippedOnManifest = allPngFiles.length - figmaFiles.length;
  if (figmaManifestTargets.size > 0 && skippedOnManifest > 0) {
    console.log(`ℹ️  Ignoring ${skippedOnManifest} stale Figma screenshots not in manifest`);
  }

  if (figmaManifestTargets.size > 0 && figmaFiles.length === 0) {
    console.error('❌ figma-node-id-manifest.json did not match any files in visual-tests/figma/');
    process.exit(1);
  }

  if (figmaFiles.length === 0) {
    console.error('❌ No Figma exports found in visual-tests/figma/');
    console.log('\nRun Figma export first:');
    console.log('  pnpm run figma:export');
    process.exit(1);
  }

  const results: ComparisonResult[] = [];

  // Get all actual files for case-insensitive matching
  const actualFiles = await fs.readdir(actualDir);
  const actualFilesMap = new Map(actualFiles.map((f) => [f.toLowerCase(), f]));

  for (const fileName of figmaFiles) {
    const figmaPath = path.join(figmaDir, fileName);

    // Find actual file (case-insensitive)
    const actualFileName = actualFilesMap.get(fileName.toLowerCase());
    if (!actualFileName) {
      console.log(`⚠ Skipped: ${fileName} (no actual screenshot)`);
      continue;
    }

    const actualPath = path.join(actualDir, actualFileName);
    const diffPath = path.join(diffDir, fileName);

    try {
      const { diffPixels, width, height } = await compareImages(figmaPath, actualPath, diffPath);

      const totalPixels = width * height;
      const diffPercentage = (diffPixels / totalPixels) * 100;
      const passed = diffPercentage <= DIFF_THRESHOLD;

      const result: ComparisonResult = {
        name: fileName.replace('.png', ''),
        figmaPath,
        actualPath,
        diffPath,
        diffPixels,
        diffPercentage: Math.round(diffPercentage * 100) / 100,
        width,
        height,
        passed,
      };

      results.push(result);

      const status = passed ? '✓' : '✗';
      const color = passed ? '' : '❌';
      console.log(`${status} ${fileName}: ${result.diffPercentage}% different ${color}`);
    } catch (error) {
      console.error(`✗ Failed to compare ${fileName}:`, error);
    }
  }

  // Generate report
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  const report: ComparisonReport = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    threshold: DIFF_THRESHOLD,
    results,
  };

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📊 Comparison Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Threshold: ${DIFF_THRESHOLD}%`);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  if (failed > 0) {
    console.log('\n❌ Some components differ from Figma designs');
    console.log('   Review diff images in visual-tests/diff/');
    process.exit(1);
  } else {
    console.log('\n✅ All components match Figma designs!');
  }
}

main().catch((error) => {
  console.error('❌ Comparison failed:', error);
  process.exit(1);
});
