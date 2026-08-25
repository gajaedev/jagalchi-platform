#!/usr/bin/env node
/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
/**
 * Storybook Screenshots Script
 *
 * Captures screenshots of Storybook stories using Playwright.
 * Requires Storybook to be running on http://localhost:6006
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import sharp from 'sharp';

interface ManifestVariant {
  name: string;
  nodeId: string;
  storybookName: string;
}

interface ManifestComponent {
  componentName: string;
  frameNodeId: string;
  variants: ManifestVariant[];
}

interface FigmaNodeManifest {
  timestamp: string;
  fileKey: string;
  components: ManifestComponent[];
}

interface StoryTarget {
  id: string;
  storybookName: string;
}

const STORIES_TITLE_PREFIX = 'figma-targets';
const MANIFEST_PATH = path.join(process.cwd(), 'scripts/figma-node-id-manifest.json');
const FIGMA_EXPORT_DIR = path.join(process.cwd(), 'visual-tests/figma');

const FALLBACK_STORY_IDS: readonly string[] = [
  'features-roadmapeditor-organisms-nodepropertiespanel--default',
  'features-roadmapeditor-organisms-edgepropertiespanel--default',
  'features-roadmapeditor-organisms-sectionpropertiespanel--default',
  'features-roadmapeditor-organisms-textpropertiespanel--default',
  'editor-atoms-toolbarbutton--select',
  'organisms-roadmapaimodal--generate-mode',
] as const;

const CAPTURE_CANDIDATE_SELECTORS = [
  '[data-story-capture-root]',
  '[data-slot="dialog-content"]',
  '[data-slot="sheet-content"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="popover-content"]',
  '[role="dialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[data-radix-portal]',
  '[data-radix-popper-content-wrapper]',
].join(', ');

let manifestCache: FigmaNodeManifest | null = null;

function storyNameToId(name: string): string {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function fileNameFromStoryName(storybookName: string): string {
  return `${storybookName}.png`;
}

function sanitizeForStoryId(storybookName: string): string {
  return `${STORIES_TITLE_PREFIX}--${storyNameToId(storybookName)}`;
}

async function loadManifest(): Promise<FigmaNodeManifest | null> {
  if (manifestCache) {
    return manifestCache;
  }

  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    manifestCache = JSON.parse(raw) as FigmaNodeManifest;
    return manifestCache;
  } catch {
    return null;
  }
}

interface FigmaDimension {
  width: number;
  height: number;
}

const figmaDimensionCache = new Map<string, FigmaDimension | null>();

async function loadFigmaDimension(storybookName: string): Promise<FigmaDimension | null> {
  if (figmaDimensionCache.has(storybookName)) {
    return figmaDimensionCache.get(storybookName) ?? null;
  }

  const figurePath = path.join(FIGMA_EXPORT_DIR, `${storybookName}.png`);
  try {
    const raw = await fs.readFile(figurePath);
    const png = PNG.sync.read(raw);
    const dimension = { width: png.width, height: png.height };
    figmaDimensionCache.set(storybookName, dimension);
    return dimension;
  } catch {
    figmaDimensionCache.set(storybookName, null);
    return null;
  }
}

async function loadStoryTargetsFromManifest(): Promise<StoryTarget[]> {
  const manifest = await loadManifest();

  if (!manifest) {
    return [];
  }

  const targets: StoryTarget[] = manifest.components.flatMap((component) =>
    component.variants.map((variant) => ({
      id: sanitizeForStoryId(variant.storybookName),
      storybookName: variant.storybookName,
    })),
  );

  return targets;
}

interface CaptureCandidate {
  index: number;
  width: number;
  height: number;
}

function chooseClosestCandidate(
  candidates: CaptureCandidate[],
  expected?: FigmaDimension | null,
): number {
  if (candidates.length === 0) {
    return 0;
  }

  if (!expected) {
    return candidates.reduce((best, current) => {
      const bestArea = best.width * best.height;
      const currentArea = current.width * current.height;
      return currentArea < bestArea ? current : best;
    }).index;
  }

  return candidates.reduce((best, current) => {
    const bestDistance =
      Math.abs(best.width - expected.width) + Math.abs(best.height - expected.height);
    const currentDistance =
      Math.abs(current.width - expected.width) + Math.abs(current.height - expected.height);

    if (currentDistance < bestDistance) {
      return current;
    }

    if (currentDistance === bestDistance) {
      const bestArea = best.width * best.height;
      const currentArea = current.width * current.height;
      return currentArea < bestArea ? current : best;
    }

    return best;
  }).index;
}

async function loadStoryIds(): Promise<string[]> {
  const targets = await loadStoryTargetsFromManifest();

  if (targets.length > 0) {
    return targets.map((target) => target.id);
  }

  console.log('⚠️  figma-node-id-manifest.json not found or invalid.');
  console.log('⚠️  Falling back to legacy story IDs.\n');
  return [...FALLBACK_STORY_IDS];
}

function resolveOutputFileName(storyId: string, targets: StoryTarget[]): string {
  const manifestTarget = targets.find((target) => target.id === storyId);

  if (manifestTarget) {
    return fileNameFromStoryName(manifestTarget.storybookName);
  }

  // Fallback when using legacy ids: keep old mapping behavior
  const parts = storyId.split('--');
  const last = parts.at(-1) ?? 'Unknown';

  const componentName = last
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join('');

  return `${componentName}.png`;
}

async function captureStoryScreenshot(
  page: any,
  storyId: string,
  outputPath: string,
  expectedDimension?: FigmaDimension | null,
): Promise<void> {
  const url = `http://localhost:6006/iframe.html?id=${storyId}&viewMode=story`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page
      .waitForSelector(CAPTURE_CANDIDATE_SELECTORS, { timeout: 1200 })
      .catch(() => undefined);

    const captureTargets = page.locator(CAPTURE_CANDIDATE_SELECTORS);
    const captureTargetCount = await captureTargets.count().catch(() => 0);
    const candidates: CaptureCandidate[] = [];

    for (let i = 0; i < captureTargetCount; i += 1) {
      const candidate = captureTargets.nth(i);
      const candidateBox = await candidate.boundingBox().catch(() => null);

      if (!candidateBox || candidateBox.width <= 0 || candidateBox.height <= 0) {
        continue;
      }

      candidates.push({
        index: i,
        width: Math.round(candidateBox.width),
        height: Math.round(candidateBox.height),
      });
    }

    if (candidates.length > 0) {
      const selectedIndex = chooseClosestCandidate(candidates, expectedDimension);
      const selected = captureTargets.nth(selectedIndex);
      const selectedBox = await selected.boundingBox();

      if (!selectedBox || selectedBox.width <= 0 || selectedBox.height <= 0) {
        throw new Error(`Invalid capture target bounds for ${storyId}`);
      }

      await selected.scrollIntoViewIfNeeded().catch(() => undefined);

      let screenshot = await selected.screenshot({
        animations: 'disabled',
        omitBackground: true,
      });
      const screenshotMetadata = await sharp(screenshot).metadata();
      const screenshotWidth = screenshotMetadata.width ?? 1;
      const screenshotHeight = screenshotMetadata.height ?? 1;

      if (expectedDimension) {
        const cropWidth = Math.min(screenshotWidth, expectedDimension.width);
        const cropHeight = Math.min(screenshotHeight, expectedDimension.height);
        const extendRight = Math.max(0, expectedDimension.width - cropWidth);
        const extendBottom = Math.max(0, expectedDimension.height - cropHeight);

        screenshot = await sharp(screenshot)
          .extract({ left: 0, top: 0, width: cropWidth, height: cropHeight })
          .extend({
            top: 0,
            left: 0,
            right: extendRight,
            bottom: extendBottom,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .toBuffer();

        if (screenshot.length === 0) {
          throw new Error(`Failed to generate resized screenshot for ${storyId}`);
        }
      }

      await fs.writeFile(outputPath, screenshot);
      console.log(`✓ Captured: ${path.basename(outputPath)} (capture-root:${selectedIndex})`);
      return;
    }

    const storyRoot = page.locator('#storybook-root');
    const storyHasChild = await storyRoot
      .evaluate((el: Element) =>
        Array.from(el.children).some((child: Element) => child.getClientRects().length > 0),
      )
      .catch(() => false);

    if (storyHasChild) {
      const firstChild = storyRoot.locator(':scope > *').first();
      const childVisible = await firstChild.isVisible().catch(() => false);

      if (childVisible) {
        await firstChild.screenshot({
          path: outputPath,
          animations: 'disabled',
          omitBackground: true,
        });
        console.log(`✓ Captured: ${path.basename(outputPath)}`);
        return;
      }

      await storyRoot.screenshot({
        path: outputPath,
        animations: 'disabled',
        omitBackground: true,
      });
      console.log(`✓ Captured: ${path.basename(outputPath)} (fallback-root)`);
      return;
    }

    await page.screenshot({
      path: outputPath,
      animations: 'disabled',
      omitBackground: true,
    });
    console.log(`✓ Captured: ${path.basename(outputPath)} (fallback-page)`);
  } catch (error) {
    console.error(`✗ Failed: ${storyId}`, error);
    throw error;
  }
}

async function main() {
  const outputDir = path.join(process.cwd(), 'visual-tests/actual');
  const storyIds = await loadStoryIds();
  const targets = await loadStoryTargetsFromManifest();

  await fs.mkdir(outputDir, { recursive: true });

  console.log(`📸 Capturing ${storyIds.length} Storybook targets for Figma compare...`);
  console.log('⚠️  Make sure Storybook is running on http://localhost:6006\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  let captured = 0;
  let failed = 0;

  for (const storyId of storyIds) {
    try {
      const storyTarget = targets.find((target) => target.id === storyId);
      const dimension = storyTarget ? await loadFigmaDimension(storyTarget.storybookName) : null;

      const viewportWidth = dimension ? Math.max(320, dimension.width) : 1536;
      const viewportHeight = dimension ? Math.max(600, dimension.height) : 1024;

      await page.setViewportSize({
        width: viewportWidth,
        height: viewportHeight,
      });

      const outputPath = path.join(outputDir, resolveOutputFileName(storyId, targets));
      await captureStoryScreenshot(page, storyId, outputPath, dimension);
      captured++;
    } catch {
      failed++;
    }
  }

  await browser.close();

  console.log(`\n✅ Captured ${captured} screenshots`);
  if (failed > 0) {
    console.log(`❌ Failed ${failed} screenshots`);
    process.exit(1);
  }
}

async function checkStorybookRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:6006');
    return response.ok;
  } catch {
    return false;
  }
}

checkStorybookRunning().then(async (isRunning) => {
  if (!isRunning) {
    console.error('❌ Storybook is not running on http://localhost:6006');
    console.log('Start Storybook first:');
    console.log('  pnpm storybook');
    process.exit(1);
  }

  await main().catch((error) => {
    console.error('❌ Screenshot capture failed:', error);
    process.exit(1);
  });
});
