import { expect, test } from '@playwright/test';

import { loginAsTestUser } from './helpers/auth';

test.describe('Career Diff private proof vertical', () => {
  test('credits only a fresh approved non-self reviewed mission and invalidates stale proof', async ({
    page,
  }) => {
    const unhandledApiRequests: string[] = [];
    const networkFallthrough: string[] = [];
    await page.route('**/api/**', async (route) => {
      networkFallthrough.push(route.request().url());
      await route.abort('blockedbyclient');
    });
    page.on('console', (message) => {
      if (
        message.type() === 'warning' &&
        message
          .text()
          .includes('[MSW] Warning: intercepted a request without a matching request handler')
      ) {
        unhandledApiRequests.push(message.text());
      }
    });

    await loginAsTestUser(page);
    await page.goto('/career');

    await expect(page.getByRole('heading', { name: /가고 싶은 회사와/ })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel('회사').fill('토스');
    await page.getByLabel('목표 직무').fill('프론트엔드 개발자');
    await page.getByLabel('채용공고 URL').fill('https://example.com/jobs/frontend');
    await page
      .getByLabel('주요 업무와 자격 요건')
      .fill('React와 TypeScript로 제품을 개발하고 테스트와 성능을 개선한 경험이 필요합니다.');
    await page.getByRole('checkbox', { name: /^React\b/ }).check();
    await page.getByRole('checkbox', { name: /^TypeScript\b/ }).check();
    await page.getByRole('checkbox', { name: /^테스트 전략/ }).check();
    await page.getByRole('checkbox', { name: /^웹 성능/ }).check();
    const createTargetResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/career/targets') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Career Diff 만들기' }).click();
    await createTargetResponsePromise;

    await expect(page.getByRole('heading', { name: '목표 직무까지 부족한 증거' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('토스', { exact: true })).toBeVisible();
    await expect(page.getByText('0%', { exact: true })).toBeVisible();

    const reactGap = page.getByRole('article').filter({ hasText: 'React' });
    const createResponsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/career/proof-missions') &&
        response.request().method() === 'POST',
    );
    await reactGap.getByRole('button', { name: '증명 미션 시작' }).click();
    await createResponsePromise;

    const missionPanel = page.getByRole('region', { name: 'React 역량 증명' });
    await expect(missionPanel).toBeVisible();
    await expect(missionPanel.getByText('목표 역량:')).toContainText('React');
    await missionPanel.getByRole('button', { name: '기준 편집' }).click();

    const criteriaEditor = page.getByRole('group', { name: '검증 기준 편집' });
    await criteriaEditor.getByRole('button', { name: '기준 추가' }).click();
    await criteriaEditor.getByLabel('추가할 기준 유형').selectOption('NAMED_CHECK');
    await criteriaEditor.getByRole('button', { name: '기준 추가' }).click();
    await criteriaEditor.getByRole('textbox', { name: '필수 검사 이름' }).fill('unit-test');
    await page.getByRole('button', { name: '기준 저장' }).click();
    await expect(missionPanel.getByText('2개')).toBeVisible();

    await missionPanel.getByRole('button', { name: 'GitHub 연결' }).click();
    const githubPicker = page.getByRole('region', { name: 'GitHub 증거 연결' });
    await expect(githubPicker.getByRole('status')).toContainText(
      'GitHub 개인 계정 ID 90071992547409931234 연결됨',
    );
    await githubPicker.getByLabel('저장소').selectOption('90071992547409931234');
    await githubPicker.getByLabel('PR 번호').fill('42');
    await githubPicker.getByRole('button', { name: '이 PR 연결하기' }).click();

    await expect(missionPanel.getByText('PR 연결됨')).toBeVisible();
    await missionPanel.getByRole('button', { name: '직접 검증' }).click();
    const results = page.getByRole('region', { name: '기준별 검증 결과' });
    await expect(results.getByText('전체 통과')).toBeVisible();
    await expect(results.getByText('PR 병합 완료')).toBeVisible();
    await expect(results.getByText('필수 검사 통과')).toBeVisible();
    await expect(page.getByText('1111111111111111111111111111111111111111')).toHaveCount(0);
    await expect(page.getByText(/head sha|installation id|repository id/i)).toHaveCount(0);

    await expect(missionPanel.getByRole('button', { name: '검토 요청' })).toBeEnabled();
    await missionPanel.getByRole('button', { name: '검토 요청' }).click();
    await expect(missionPanel.getByText('검토 중', { exact: true })).toBeVisible();
    await expect(page.getByText('0%', { exact: true })).toBeVisible();

    await page.getByRole('link', { name: '검토 대기열' }).click();
    await expect(page.getByRole('heading', { name: '증명 미션 검토' })).toBeVisible();
    const proofReview = page.getByRole('article', { name: 'React 역량 증명' });
    await expect(proofReview.getByText('미션 소유자')).toBeVisible();
    await expect(proofReview.getByText('목표 역량 · React')).toBeVisible();
    await expect(
      proofReview.getByRole('region', { name: '제출 당시 고정된 검증 실행' }),
    ).toContainText('통과');
    await expect(proofReview.getByRole('list', { name: '기준별 검증 결과' })).toContainText(
      'PR 병합 완료',
    );
    await expect(proofReview.getByRole('list', { name: '기준별 검증 결과' })).toContainText(
      '필수 검사 통과',
    );
    await expect(
      proofReview.getByText(
        /1111111111111111111111111111111111111111|installation id|repository id/i,
      ),
    ).toHaveCount(0);
    await proofReview.getByRole('button', { name: '보완 요청' }).click();
    await expect(proofReview.getByRole('alert')).toContainText('다음 행동을 알 수 있는 메모');
    await proofReview.getByRole('button', { name: '승인' }).click();
    await expect(page.getByText('대기 중인 증명 미션이 없습니다.')).toBeVisible();

    await page.locator('header a[href="/career"]').click();
    await expect(page.getByRole('heading', { name: '목표 직무까지 부족한 증거' })).toBeVisible();
    await expect(page.getByText('25%', { exact: true })).toBeVisible();
    await expect(page.getByText('React', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/채용 점수|합격 가능성|지원자 순위/)).toHaveCount(0);

    await reactGap.getByRole('button', { name: '증명 미션 열기' }).click();
    const restoredMissionPanel = page.getByRole('region', { name: 'React 역량 증명' });
    await restoredMissionPanel.getByRole('button', { name: 'PR 변경' }).click();
    await githubPicker.getByLabel('PR 번호').fill('43');
    await githubPicker.getByRole('button', { name: '이 PR 연결하기' }).click();
    await expect(page.getByText('0%', { exact: true })).toBeVisible();
    await restoredMissionPanel.getByRole('button', { name: '직접 검증' }).click();
    await expect(results.getByText('전체 불통과')).toBeVisible();
    await expect(restoredMissionPanel.getByRole('button', { name: '검토 요청' })).toBeDisabled();

    await restoredMissionPanel.getByRole('button', { name: 'PR 변경' }).click();
    await githubPicker.getByLabel('PR 번호').fill('44');
    await githubPicker.getByRole('button', { name: '이 PR 연결하기' }).click();
    await restoredMissionPanel.getByRole('button', { name: '직접 검증' }).click();
    await expect(results.getByText('최신 상태 아님')).toBeVisible();
    await expect(restoredMissionPanel.getByRole('button', { name: '검토 요청' })).toBeDisabled();
    await expect(page.getByText('0%', { exact: true })).toBeVisible();
    expect(unhandledApiRequests).toEqual([]);
    expect(networkFallthrough).toEqual([]);
  });
});
