import { test, expect } from '@playwright/test';

import { loginAsTestUser } from './helpers/auth';

// MSW fixture에 있는 로드맵 ID 사용
const TEST_ROADMAP_ID = '11111111-1111-4111-8111-111111111111';

test.describe('Editor E2E', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await loginAsTestUser(page);
    if (testInfo.title === 'node edits are auto-saved and visible in viewer') {
      return;
    }

    await page.goto(`/editor/${TEST_ROADMAP_ID}`);
  });

  test('editor page loads and canvas renders', async ({ page }) => {
    await page.waitForSelector('.react-flow', { timeout: 30000 });
    const canvas = page.locator('.react-flow');
    await expect(canvas).toBeVisible();
  });

  test('node can be added via toolbar', async ({ page }) => {
    await page.waitForSelector('.react-flow', { timeout: 30000 });
    const initialNodes = await page.locator('.react-flow__node').count();
    await page.getByTestId('toolbar-add-node').click();
    await expect(page.locator('.react-flow__node')).toHaveCount(initialNodes + 1);
  });

  test.fixme('node selection shows properties panel', async ({ page }) => {
    await page.waitForSelector('.react-flow', { timeout: 30000 });
    const nodes = page.locator('.react-flow__node');
    const initialCount = await nodes.count();

    // Add a new node
    await page.getByTestId('toolbar-add-node').click();
    await expect(nodes).toHaveCount(initialCount + 1, { timeout: 5000 });

    // Click the last added node via bounding box
    const lastNode = nodes.nth(initialCount);
    await lastNode.waitFor({ state: 'visible', timeout: 5000 });
    const box = await lastNode.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    await expect(page.getByTestId('properties-panel-header')).toBeVisible({ timeout: 10000 });
  });

  test('node edits are auto-saved and visible in viewer', async ({ page }) => {
    await page.goto('/myroadmap');
    await expect(page.getByRole('heading', { name: '내 실행 과제' })).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole('button', { name: '새 과제' }).click();
    await page.getByRole('menuitem', { name: '실행 과제' }).click();
    await page.getByPlaceholder('만들 결과물을 입력하세요').fill('E2E 저장 검증 실행 과제');
    await page.getByRole('button', { name: '확인' }).click();

    await expect(page).toHaveURL(/\/editor\/[0-9a-f-]{36}/, { timeout: 10000 });
    const roadmapId = page.url().match(/\/editor\/([0-9a-f-]{36})/)?.[1];
    expect(roadmapId).toBeTruthy();

    await page.waitForSelector('.react-flow', { timeout: 30000 });
    const nodes = page.locator('.react-flow__node');
    const initialNodeCount = await nodes.count();

    await page.getByTestId('toolbar-add-node').click();
    await expect(nodes).toHaveCount(initialNodeCount + 1, { timeout: 10000 });

    const addedNode = nodes.nth(initialNodeCount);
    await addedNode.waitFor({ state: 'visible', timeout: 10000 });
    const box = await addedNode.boundingBox();
    if (!box) {
      throw new Error('Added node is not clickable');
    }
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    const nameInput = page.getByLabel('단계 이름');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    const persistedEdit = page.waitForResponse(
      async (response) => {
        if (
          response.request().method() !== 'PATCH' ||
          !response.url().includes(`/api/roadmaps/${roadmapId}`)
        ) {
          return false;
        }
        const body = response.request().postDataJSON() as {
          graph?: { nodes?: Array<{ data?: { label?: string; description?: string } }> };
        };
        return Boolean(
          body.graph?.nodes?.some(
            (node) =>
              node.data?.label === '수정된 E2E 노드' &&
              node.data.description === '뷰어 저장 확인용 설명',
          ),
        );
      },
      { timeout: 15000 },
    );
    await nameInput.fill('수정된 E2E 노드');

    const descriptionInput = page.getByLabel('완료 조건');
    await descriptionInput.fill('뷰어 저장 확인용 설명');

    await expect(
      page.locator('.react-flow__node').filter({ hasText: '수정된 E2E 노드' }),
    ).toBeVisible({
      timeout: 10000,
    });

    const saveResponse = await persistedEdit;
    expect(saveResponse.ok()).toBe(true);

    await page.getByRole('button', { name: '뷰어 미리보기' }).click();
    await expect(page).toHaveURL(new RegExp(`/viewer/${roadmapId}$`), { timeout: 10000 });
    await expect(
      page.locator('.react-flow__node').filter({ hasText: '수정된 E2E 노드' }),
    ).toBeVisible({ timeout: 30000 });
  });

  test('share button opens viewer for roadmap', async ({ page }) => {
    await page.waitForSelector('.react-flow', { timeout: 30000 });
    await page.getByRole('button', { name: '뷰어 미리보기' }).click();
    await expect(page).toHaveURL(new RegExp(`/viewer/${TEST_ROADMAP_ID}$`), {
      timeout: 10000,
    });
    await expect(page.locator('header')).toBeVisible({ timeout: 15000 });
  });

  // Ctrl+Z undo는 unit test (use-keyboard-shortcuts.test.ts)에서 커버.
  // headless Chromium에서 React Flow 키보드 이벤트가 동작하지 않아 E2E 제외.
});
