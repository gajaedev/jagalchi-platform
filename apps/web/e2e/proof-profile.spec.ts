import { expect, test, type Page } from '@playwright/test';

import { loginAsTestUser } from './helpers/auth';

const PUBLIC_ID = 'proof-public-safe-7Kp2mQ';
const DISABLED_ID = 'proof-disabled-3Vc8nL';
const UNKNOWN_ID = 'proof-unknown-9Zt4xR';

const safeProfile = {
  schemaVersion: 1,
  profile: {
    publicId: PUBLIC_ID,
    displayName: '김자갈',
    summary: '검증된 실행으로 성장하는 프론트엔드 개발자입니다.',
  },
  proofs: [
    {
      publicProofId: 'public-proof-A1b2C3',
      title: '결제 화면 접근성 개선',
      summary: '키보드 탐색과 상태 안내를 개선했습니다.',
      competencyLabel: '프론트엔드 품질',
      provider: 'GITHUB',
      verification: { status: 'VERIFIED', verifiedAt: '2026-08-20T02:30:00.000Z' },
      criteria: {
        passedCount: 3,
        totalCount: 3,
        types: ['MERGED_PR', 'NAMED_CHECK', 'HUMAN_CHECK'],
      },
    },
  ],
  updatedAt: '2026-08-20T02:30:00.000Z',
};

const forbiddenValues = [
  'private-owner-id-91',
  'private-job-id-82',
  'private-mission-id-73',
  'private-run-id-64',
  'private-review-id-55',
  'secret-reviewer@example.com',
  'private-installation-46',
  'private/repository',
  'feature/private-branch',
  'src/private/path.ts',
  'private-check-name',
  '0123456789abcdef0123456789abcdef01234567',
];

async function mockPublicProofApi(page: Page) {
  await page.route('**/api/career/proof-profiles/*', async (route) => {
    const publicId = decodeURIComponent(
      new URL(route.request().url()).pathname.split('/').pop() ?? '',
    );
    if (publicId !== PUBLIC_ID) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ statusCode: 404, message: 'Proof profile not found' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      body: JSON.stringify({
        ...safeProfile,
        private: {
          ownerId: forbiddenValues[0],
          jobId: forbiddenValues[1],
          missionId: forbiddenValues[2],
          runId: forbiddenValues[3],
          reviewId: forbiddenValues[4],
          reviewer: forbiddenValues[5],
          installationId: forbiddenValues[6],
          repository: forbiddenValues[7],
          branch: forbiddenValues[8],
          path: forbiddenValues[9],
          check: forbiddenValues[10],
          sha: forbiddenValues[11],
        },
      }),
    });
  });
}

async function unavailableBody(page: Page, publicId: string): Promise<string> {
  await page.goto(`/proof/${publicId}`);
  await expect(page.getByRole('heading', { name: '공개 프로필을 찾을 수 없습니다' })).toBeVisible();
  return page.locator('main').innerText();
}

test.describe('anonymous Proof Profile', () => {
  test.beforeEach(async ({ page }) => {
    await mockPublicProofApi(page);
  });

  test('renders the safe Korean-first view without authentication', async ({ page }) => {
    const response = await page.goto(`/proof/${PUBLIC_ID}`);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/김자갈 — Proof Profile/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex,\s*nofollow/,
    );
    await expect(page.getByRole('heading', { name: '김자갈' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '결제 화면 접근성 개선' })).toBeVisible();
    await expect(page.getByText('프론트엔드 품질')).toBeVisible();
    await expect(page.getByText('3/3 통과')).toBeVisible();
  });

  test('never serializes provider-private fields into HTML', async ({ page }) => {
    const response = await page.goto(`/proof/${PUBLIC_ID}`);
    const html = await response?.text();

    expect(html).toBeTruthy();
    for (const forbiddenValue of forbiddenValues) {
      expect(html).not.toContain(forbiddenValue);
    }
  });

  test('disabled and unknown IDs render the identical unavailable UI', async ({ page }) => {
    const disabled = await unavailableBody(page, DISABLED_ID);
    const unknown = await unavailableBody(page, UNKNOWN_ID);

    expect(disabled).toBe(unknown);
    expect(disabled).not.toContain(DISABLED_ID);
    expect(unknown).not.toContain(UNKNOWN_ID);
  });
});

test.describe('owner Proof Profile controls', () => {
  test('requires authentication and lets the owner save, disable, and unpublish', async ({
    page,
  }) => {
    const anonymousResponse = await page.goto('/career');
    expect(anonymousResponse?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcareer$/);

    await loginAsTestUser(page);

    await page.evaluate(async () => {
      const request = async <T>(path: string, init?: Parameters<typeof fetch>[1]): Promise<T> => {
        const response = await fetch(path, init);
        if (!response.ok) {
          throw new Error(`${init?.method ?? 'GET'} ${path} failed with ${response.status}`);
        }
        return response.json() as Promise<T>;
      };
      const command = (name: string) => `${name}-${crypto.randomUUID()}`;
      const json = (
        body: unknown,
        headers?: Record<string, string>,
      ): Parameters<typeof fetch>[1] => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });

      const setup = await request<{
        installation: { id: string } | null;
      }>('/api/github/setup');
      if (!setup.installation) throw new Error('Connected GitHub installation is required');

      const repositories = await request<Array<{ repositoryId: string }>>(
        '/api/github/repositories',
      );
      const repository = repositories.find((item) => item.repositoryId === '90071992547409931234');
      if (!repository) throw new Error('Connected E2E repository is required');

      const pulls = await request<Array<{ pullNumber: number }>>(
        `/api/github/repositories/${repository.repositoryId}/pulls`,
      );
      const pull = pulls.find((item) => item.pullNumber === 42);
      if (!pull) throw new Error('E2E pull request 42 is required');

      const target = await request<{ id: string }>(
        '/api/career/targets',
        json({
          company: 'E2E Proof Profile',
          role: '프론트엔드 개발자',
          postingUrl: 'https://example.com/jobs/e2e-proof-profile',
          requirements: 'React 제품 구현 역량',
          competencySlugs: ['react'],
        }),
      );
      const mission = await request<{ id: string }>(
        '/api/career/proof-missions',
        json({
          targetId: target.id,
          competencySlug: 'react',
          title: '결제 화면 접근성 개선',
          summary: '키보드 탐색과 상태 안내를 개선했습니다.',
          idempotencyKey: command('create-mission'),
        }),
      );

      await request(`/api/career/proof-missions/${mission.id}/criteria`, {
        ...json({
          criteria: [{ type: 'MERGED_PR', config: {} }],
          idempotencyKey: command('save-criteria'),
        }),
        method: 'PUT',
      });
      await request(
        `/api/career/proof-missions/${mission.id}/bind`,
        json({
          installationId: setup.installation.id,
          githubRepositoryId: repository.repositoryId,
          pullNumber: pull.pullNumber,
          idempotencyKey: command('bind-proof'),
        }),
      );
      await request(
        `/api/career/proof-missions/${mission.id}/refresh`,
        json({ idempotencyKey: command('refresh-proof') }),
      );
      await request(
        `/api/career/proof-missions/${mission.id}/submit`,
        json({ idempotencyKey: command('submit-proof') }),
      );
      await request(
        `/api/career/proof-missions/${mission.id}/review`,
        json(
          {
            decision: 'APPROVED',
            note: 'E2E 비자기 검토 승인',
            idempotencyKey: command('approve-proof'),
          },
          { 'x-mock-user-id': 'reviewer-2' },
        ),
      );
      await request('/api/career/proof-profile', {
        ...json({
          state: 'ENABLED',
          displayName: '김자갈',
          summary: '공개 소개',
          idempotencyKey: command('enable-profile'),
        }),
        method: 'PUT',
      });
    });

    await page.locator('a[href="/career"]:visible').first().click();
    await expect(page.getByRole('heading', { name: 'Proof Profile 공개 설정' })).toBeVisible();
    await expect(page.getByRole('button', { name: '프로필 즉시 끄기' })).toBeVisible();
    await page.getByRole('button', { name: '증명 미션 열기' }).click();
    await page.getByRole('button', { name: 'Proof Profile에 공개', exact: true }).click();
    await expect(page.getByRole('button', { name: '즉시 게시 해제' })).toBeVisible();
    await page.getByLabel('공개 표시 이름').fill('김자갈 개발자');
    await page.getByRole('button', { name: '표시 정보 저장' }).click();
    await page.getByRole('button', { name: '즉시 게시 해제' }).click();
    await expect(page.getByRole('button', { name: '이 증거 공개' })).toBeVisible();
    await page.getByRole('button', { name: '이 증거 공개' }).click();
    await expect(page.getByRole('button', { name: '즉시 게시 해제' })).toBeVisible();
    await page.getByRole('button', { name: '프로필 즉시 끄기' }).click();
    await expect(page.getByRole('button', { name: '공개 프로필 켜기' })).toBeVisible();
  });
});
