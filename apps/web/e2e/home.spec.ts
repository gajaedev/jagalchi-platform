import { test, expect } from '@playwright/test';

import { loginAsTestUser } from './helpers/auth';

test.describe('Home E2E', () => {
  test('signed-in home renders the learning dashboard', async ({ page }) => {
    await loginAsTestUser(page);
    await expect(page).toHaveURL('http://localhost:3100/');
    await expect(page.getByRole('heading', { name: '오늘은 여기서 시작해요' })).toBeVisible();
    await expect(page.getByRole('region', { name: '현재 학습' })).toBeVisible();
  });
});
