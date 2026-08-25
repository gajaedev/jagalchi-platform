import { describe, expect, it } from 'vitest';

import {
  calculatePostPurchaseBalance,
  canAfford,
  formatTicketCount,
  getTicketCost,
  isFailedLedgerEntryRefundable,
  MONTHLY_TICKET_GRANT,
  SIGNUP_TICKET_GRANT,
  TICKET_PACKS,
} from './ticket-policy';

describe('AI ticket policy', () => {
  it('uses the approved free grants, costs, and packs', () => {
    expect(SIGNUP_TICKET_GRANT).toBe(30);
    expect(MONTHLY_TICKET_GRANT).toBe(15);
    expect(getTicketCost('coaching')).toBe(1);
    expect(getTicketCost('deep_search')).toBe(2);
    expect(getTicketCost('roadmap_generation')).toBe(5);
    expect(TICKET_PACKS).toEqual([
      {
        id: 'ticket-20',
        storeProductId: 'com.jagalchi.app.ticket20',
        tickets: 20,
        priceKrw: 3900,
      },
      {
        id: 'ticket-60',
        storeProductId: 'com.jagalchi.app.ticket60',
        tickets: 60,
        priceKrw: 8900,
      },
      {
        id: 'ticket-150',
        storeProductId: 'com.jagalchi.app.ticket150',
        tickets: 150,
        priceKrw: 17900,
      },
    ]);
  });

  it('checks affordability and calculates a purchase without coercion', () => {
    expect(canAfford(5, 'roadmap_generation')).toBe(true);
    expect(canAfford(4, 'roadmap_generation')).toBe(false);
    expect(calculatePostPurchaseBalance(18, 'ticket-60')).toBe(78);
    expect(formatTicketCount(1_234)).toBe('1,234장');
  });

  it('rejects invalid balances and unknown runtime data', () => {
    expect(() => canAfford(-1, 'coaching')).toThrow(RangeError);
    expect(() => formatTicketCount(1.5)).toThrow(RangeError);
    expect(() => getTicketCost('unknown' as Parameters<typeof getTicketCost>[0])).toThrow(
      RangeError,
    );
  });

  it('refunds only failed AI usage entries', () => {
    expect(
      isFailedLedgerEntryRefundable({
        kind: 'usage',
        status: 'failed',
        featureKind: 'deep_search',
      }),
    ).toBe(true);
    expect(
      isFailedLedgerEntryRefundable({
        kind: 'usage',
        status: 'completed',
        featureKind: 'coaching',
      }),
    ).toBe(false);
    expect(
      isFailedLedgerEntryRefundable({
        kind: 'purchase',
        status: 'failed',
      }),
    ).toBe(false);
  });
});
