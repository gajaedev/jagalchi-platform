import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const bridge = vi.hoisted(() => ({
  requestNative: vi.fn(),
  hasNativeBridge: vi.fn(() => true),
}));
const api = vi.hoisted(() => ({
  getTicketPurchaseContext: vi.fn(async () => ({
    appleAppAccountToken: '00000000-0000-4000-8000-000000000001',
    googleObfuscatedAccountId: 'a'.repeat(64),
  })),
}));

vi.mock('jotai', async () => {
  const actual = await vi.importActual<typeof import('jotai')>('jotai');
  return { ...actual, useAtomValue: () => 'access-token' };
});
vi.mock('@/api/tickets', () => api);
vi.mock('@/lib/native-bridge', async () => {
  const actual = await vi.importActual<typeof import('@/lib/native-bridge')>('@/lib/native-bridge');
  return { ...actual, ...bridge };
});

import { TICKET_PACKS } from '../ticket-policy';
import { TicketCheckout } from './ticket-checkout';

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketCheckout pack={TICKET_PACKS[0]} />
    </QueryClientProvider>,
  );
}

describe('TicketCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bridge.hasNativeBridge.mockReturnValue(true);
    bridge.requestNative.mockImplementation(async (action: string) => {
      if (action === 'products') {
        return {
          id: 'products-1',
          action,
          ok: true,
          products: [
            {
              productId: TICKET_PACKS[0].storeProductId,
              title: '20 tickets',
              displayPrice: '₩3,900',
            },
          ],
        };
      }
      if (action === 'purchase') {
        return {
          id: 'purchase-1',
          action,
          ok: true,
          state: 'pending',
          productId: TICKET_PACKS[0].storeProductId,
        };
      }
      return { id: 'restore-1', action, ok: true, state: 'restored', items: [] };
    });
  });

  it('uses the store localized price and sends account-bound purchase data', async () => {
    renderCheckout();
    const purchase = await screen.findByRole('button', { name: '₩3,900 결제하기' });
    await waitFor(() => expect(purchase).toBeEnabled());
    fireEvent.click(purchase);

    expect(await screen.findByText(/결제 승인을 기다리고 있어요/)).toBeInTheDocument();
    expect(bridge.requestNative).toHaveBeenCalledWith('purchase', {
      productId: TICKET_PACKS[0].storeProductId,
      accessToken: 'access-token',
      appleAppAccountToken: '00000000-0000-4000-8000-000000000001',
      googleObfuscatedAccountId: 'a'.repeat(64),
    });
  });

  it('treats empty restore as a valid result without minting tickets', async () => {
    renderCheckout();
    fireEvent.click(await screen.findByRole('button', { name: '구매 복원' }));
    expect(await screen.findByText(/복원할 미완료 구매가 없어요/)).toBeInTheDocument();
  });

  it('disables purchase when the approved SKU is unavailable', async () => {
    bridge.requestNative.mockResolvedValueOnce({
      id: 'products-1',
      action: 'products',
      ok: true,
      products: [],
    });
    renderCheckout();
    expect(await screen.findByText('스토어 상품을 불러오지 못했습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /결제하기/ })).toBeDisabled();
  });
});
