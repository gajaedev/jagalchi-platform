import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import { apiClient } from '@/api/client';
import { getOwnerProofProfile, renewOwnerProof, type OwnerProofProfile } from '@/api/proof-profile';

import { getProofPublicationCapability } from './CareerWorkspace';
import {
  ProofProfileSettings,
  type ProofProfileSafePreview,
  type ProofProfileSettingsProps,
} from './ProofProfileSettings';

const activeProof: ProofProfileSafePreview = {
  publicProofId: 'public-proof-1',
  title: '결제 화면 접근성 개선',
  summary: null,
  competencyLabel: '프론트엔드 품질',
  contributionSummary: null,
  verifiedAt: '2026-08-20T02:30:00.000Z',
  criteria: { passedCount: 1, totalCount: 1, types: ['MERGED_PR'] },
  publicationState: 'ACTIVE',
  validUntil: '2099-09-24T02:30:00.000Z',
  isPublished: true,
};

const ownerPublication: OwnerProofProfile['proofs'][number] = {
  missionId: 'mission-1',
  publicProofId: activeProof.publicProofId,
  title: activeProof.title,
  summary: activeProof.summary,
  competencyLabel: activeProof.competencyLabel,
  verifiedAt: activeProof.verifiedAt,
  criteria: activeProof.criteria,
  publicationState: 'ACTIVE',
  validUntil: activeProof.validUntil,
  isPublished: true,
};

function renderSettings(
  proof: ProofProfileSafePreview = activeProof,
  overrides: Partial<ProofProfileSettingsProps> = {},
) {
  const callbacks = {
    onSaveProfile: vi.fn(),
    onEnableProfile: vi.fn(),
    onDisableProfile: vi.fn(),
    onSetProofPublished: vi.fn(),
    onRenewProof: vi.fn(),
  };
  const props: ProofProfileSettingsProps = {
    profile: {
      state: 'ENABLED',
      publicId: 'public-profile-1',
      displayName: '김자갈',
      summary: '',
      proofs: [proof],
    },
    ...callbacks,
    isSaving: false,
    isEnabling: false,
    isDisabling: false,
    ...overrides,
  };
  const result = render(<ProofProfileSettings {...props} />);
  return { ...result, callbacks, props };
}

describe('ProofProfileSettings publication lease', () => {
  it('derives first and repeat publication capability from current eligibility and lease', () => {
    expect(getProofPublicationCapability(true, undefined, 1)).toBe('FIRST_PUBLISH');
    expect(
      getProofPublicationCapability(
        true,
        { ...ownerPublication, publicationState: 'UNPUBLISHED', isPublished: false },
        Date.parse('2026-08-25T00:00:00.000Z'),
      ),
    ).toBe('REPUBLISH');
    expect(
      getProofPublicationCapability(
        true,
        { ...ownerPublication, publicationState: 'INVALIDATED', isPublished: false },
        Date.parse('2026-08-25T00:00:00.000Z'),
      ),
    ).toBe('REPUBLISH');
    expect(
      getProofPublicationCapability(true, ownerPublication, Date.parse('2026-08-25T00:00:00.000Z')),
    ).toBeNull();
    expect(
      getProofPublicationCapability(
        true,
        {
          ...ownerPublication,
          publicationState: 'INVALIDATED',
          validUntil: '2020-09-24T02:30:00.000Z',
          isPublished: false,
        },
        Date.parse('2026-08-25T00:00:00.000Z'),
      ),
    ).toBe('RECOVER_INVALIDATED');
    expect(getProofPublicationCapability(false, undefined, 1)).toBeNull();
    expect(
      getProofPublicationCapability(
        false,
        { ...ownerPublication, publicationState: 'INVALIDATED', isPublished: false },
        Date.parse('2026-08-25T00:00:00.000Z'),
      ),
    ).toBeNull();
  });

  it.each([
    ['2099-09-24T02:30:00.000Z', true],
    ['2020-09-24T02:30:00.000Z', false],
  ])('projects ACTIVE validUntil %s to public availability %s', async (validUntil, expected) => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      state: 'ENABLED',
      publicId: 'public-profile-1',
      displayName: '김자갈',
      summary: null,
      proofs: [
        {
          missionId: 'mission-1',
          state: 'ACTIVE',
          validUntil,
          snapshot: {
            schemaVersion: 1,
            publicProofId: 'public-proof-1',
            title: '접근성 개선',
            summary: null,
            competencyLabel: '프론트엔드 품질',
            provider: 'GITHUB',
            verification: { status: 'VERIFIED', verifiedAt: '2026-08-20T02:30:00.000Z' },
            criteria: { passedCount: 1, totalCount: 1, types: ['MERGED_PR'] },
          },
        },
      ],
    });

    const profile = await getOwnerProofProfile();
    expect(profile?.proofs[0]).toMatchObject({
      publicationState: 'ACTIVE',
      validUntil,
      isPublished: expected,
    });
  });

  it('shows a publicly available ACTIVE proof with expiry, renewal, and immediate unpublish', async () => {
    const user = userEvent.setup();
    const { callbacks } = renderSettings();

    expect(screen.getByText(/공개 중/)).toHaveTextContent('2099-09-24');
    await user.click(screen.getByRole('button', { name: '공개 기한 갱신' }));
    await user.click(screen.getByRole('button', { name: '즉시 게시 해제' }));

    expect(callbacks.onRenewProof).toHaveBeenCalledWith('public-proof-1');
    expect(callbacks.onSetProofPublished).toHaveBeenCalledWith('public-proof-1', false);
  });

  it('never presents an elapsed ACTIVE lease as published and offers safe renewal', async () => {
    const user = userEvent.setup();
    const proof = {
      ...activeProof,
      validUntil: '2020-09-24T02:30:00.000Z',
      isPublished: false,
    };
    const { callbacks } = renderSettings(proof);

    expect(screen.getByText(/공개 불가 · 공개 기한 만료/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '즉시 게시 해제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '이 증거 공개' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '검증 상태 확인 후 공개 갱신' }));
    expect(callbacks.onRenewProof).toHaveBeenCalledWith('public-proof-1');
  });

  it('renews an elapsed unpublished lease before exposing publication', async () => {
    const user = userEvent.setup();
    const elapsedProof: ProofProfileSafePreview = {
      ...activeProof,
      publicationState: 'UNPUBLISHED',
      validUntil: '2020-09-24T02:30:00.000Z',
      isPublished: false,
    };
    const { callbacks, rerender, props } = renderSettings(elapsedProof);

    expect(screen.queryByRole('button', { name: '이 증거 공개' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '공개 기한 먼저 갱신' }));
    expect(callbacks.onRenewProof).toHaveBeenCalledWith('public-proof-1');
    expect(callbacks.onSetProofPublished).not.toHaveBeenCalled();
    expect(
      getProofPublicationCapability(
        true,
        {
          ...ownerPublication,
          publicationState: 'UNPUBLISHED',
          validUntil: elapsedProof.validUntil,
        },
        Date.parse('2026-08-25T00:00:00.000Z'),
      ),
    ).toBe('RENEW_IN_SETTINGS');

    rerender(
      <ProofProfileSettings
        {...props}
        profile={{
          ...props.profile,
          proofs: [
            {
              ...elapsedProof,
              validUntil: '2099-09-24T02:30:00.000Z',
            },
          ],
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: '이 증거 공개' }));
    expect(callbacks.onSetProofPublished).toHaveBeenCalledWith('public-proof-1', true);
  });

  it('exposes renewal pending and rejected states and invokes the successful callback', async () => {
    const user = userEvent.setup();
    const onRenewProof = vi.fn().mockRejectedValueOnce(new Error('최신 검증이 필요합니다.'));
    const { rerender, props } = renderSettings(activeProof, { onRenewProof });

    rerender(
      <ProofProfileSettings
        {...props}
        onRenewProof={onRenewProof}
        renewingProofId="public-proof-1"
      />,
    );
    expect(screen.getByRole('button', { name: '공개 기한 갱신' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    rerender(<ProofProfileSettings {...props} onRenewProof={onRenewProof} />);
    await user.click(screen.getByRole('button', { name: '공개 기한 갱신' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('최신 검증이 필요합니다.');
    expect(onRenewProof).toHaveBeenCalledWith('public-proof-1');
  });

  it('does not offer a doomed settings action for an invalidated publication', () => {
    renderSettings({
      ...activeProof,
      publicationState: 'INVALIDATED',
      isPublished: false,
    });
    expect(screen.getByText(/검증 무효화/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '이 증거 공개' })).not.toBeInTheDocument();
  });

  it('rejects the removed EXPIRED owner state', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      state: 'ENABLED',
      publicId: 'public-profile-1',
      displayName: '김자갈',
      summary: null,
      proofs: [
        {
          missionId: 'mission-1',
          state: 'EXPIRED',
          validUntil: '2026-09-24T02:30:00.000Z',
          snapshot: {
            schemaVersion: 1,
            publicProofId: 'public-proof-1',
            title: '접근성 개선',
            summary: null,
            competencyLabel: '프론트엔드 품질',
            provider: 'GITHUB',
            verification: { status: 'VERIFIED', verifiedAt: '2026-08-20T02:30:00.000Z' },
            criteria: { passedCount: 1, totalCount: 1, types: ['MERGED_PR'] },
          },
        },
      ],
    });

    await expect(getOwnerProofProfile()).rejects.toThrow('Invalid proof profile response');
  });

  it('rejects malformed validUntil instead of guessing publication availability', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      state: 'ENABLED',
      publicId: 'public-profile-1',
      displayName: '김자갈',
      summary: null,
      proofs: [
        {
          missionId: 'mission-1',
          state: 'ACTIVE',
          validUntil: 'not-a-timestamp',
          snapshot: {
            schemaVersion: 1,
            publicProofId: 'public-proof-1',
            title: '접근성 개선',
            summary: null,
            competencyLabel: '프론트엔드 품질',
            provider: 'GITHUB',
            verification: { status: 'VERIFIED', verifiedAt: '2026-08-20T02:30:00.000Z' },
            criteria: { passedCount: 1, totalCount: 1, types: ['MERGED_PR'] },
          },
        },
      ],
    });

    await expect(getOwnerProofProfile()).rejects.toThrow('Invalid proof profile response');
  });

  it('renews the exact mission lease with only the caller idempotency key', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ renewed: true });

    await renewOwnerProof('mission/id with spaces', { idempotencyKey: 'renew-command-1' });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/career/proof-profile/renew/mission%2Fid%20with%20spaces',
      { idempotencyKey: 'renew-command-1' },
    );
  });
});
