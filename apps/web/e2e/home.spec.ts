import { test, expect } from '@playwright/test';

import { loginAsTestUser } from './helpers/auth';

test.describe('Home E2E', () => {
  test('signed-in home renders truthful onboarding actions', async ({ page }) => {
    await loginAsTestUser(page);
    await expect(page).toHaveURL('http://localhost:3100/');
    await expect(
      page.getByRole('heading', { name: '목표를 정하고 첫 실행 과제를 시작하세요' }),
    ).toBeVisible();

    const careerLink = page.getByRole('link', { name: 'Career 열기' });
    await expect(careerLink).toBeVisible();
    await expect(careerLink).toHaveAttribute('href', '/career');

    const executionLink = page.getByRole('link', { name: '실행 과제 열기' });
    await expect(executionLink).toBeVisible();
    await expect(executionLink).toHaveAttribute('href', '/myroadmap');

    await expect(page.getByText('검토 대기')).toHaveCount(0);
    await expect(page.getByText('이번 달 완료')).toHaveCount(0);
    await expect(page.getByText('2 / 3 완료')).toHaveCount(0);
    await expect(page.getByText(/8개 역량 중 3개가 검증됐습니다/)).toHaveCount(0);
  });
});
