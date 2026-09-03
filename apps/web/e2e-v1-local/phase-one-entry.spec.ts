import { expect, test } from '@playwright/test';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the no-MSW local E2E project`);
  return value;
}

const email = required('E2E_TEST_EMAIL');
const password = required('E2E_TEST_PASSWORD');
const userId = required('E2E_SEED_USER_ID');
const projectRunId = required('E2E_SEED_PROJECT_RUN_ID');
const roadmapId = required('E2E_SEED_ROADMAP_ID');

async function expectNoServiceWorker(page: import('@playwright/test').Page) {
  const state = await page.evaluate(async () => ({
    controlled: Boolean(navigator.serviceWorker?.controller),
    registrations: navigator.serviceWorker
      ? (await navigator.serviceWorker.getRegistrations()).length
      : 0,
  }));
  expect(state).toEqual({ controlled: false, registrations: 0 });
}

test('seeded user enters a real project run without MSW', async ({ page }) => {
  await page.goto('/login');
  await expectNoServiceWorker(page);

  await page.getByPlaceholder('이메일 입력').fill(email);
  await page.getByPlaceholder('비밀번호 입력').fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/users/auth/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  const completedLogin = await loginResponse;
  expect(completedLogin.status()).toBe(200);
  expect((await completedLogin.json()).user.id).toBe(userId);
  await expect(page).toHaveURL(/\/$/);

  const runResponse = await page.request.get(`/api/project-runs/${projectRunId}`);
  expect(runResponse.status()).toBe(200);
  expect((await runResponse.json()).id).toBe(projectRunId);

  const roadmapResponse = await page.request.get(`/api/roadmaps/${roadmapId}`);
  expect(roadmapResponse.status()).toBe(200);
  expect((await roadmapResponse.json()).id).toBe(roadmapId);

  const pageResponse = await page.goto(`/projects/${projectRunId}`);
  expect(pageResponse?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { name: `프로젝트 실행 ${projectRunId.slice(0, 8)}` }),
  ).toBeVisible();
  await expectNoServiceWorker(page);
});
