import type {
  TicketFeatureKind,
  TicketLedgerEntry,
  TicketLedgerEntryKind,
  TicketLedgerEntryStatus,
  TicketPack,
  TicketPackId,
} from './types';

export const SIGNUP_TICKET_GRANT = 30;
export const MONTHLY_TICKET_GRANT = 15;
export const TICKETS_NEVER_EXPIRE = true;

export const TICKET_COSTS = {
  coaching: 1,
  node_explanation: 1,
  resource_recommendation: 1,
  deep_search: 2,
  feedback: 2,
  roadmap_generation: 5,
  document_conversion: 5,
} as const satisfies Readonly<Record<TicketFeatureKind, number>>;

export const TICKET_PACKS = [
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
] as const satisfies readonly TicketPack[];

const LEDGER_ENTRY_KINDS = new Set<TicketLedgerEntryKind>([
  'signup_grant',
  'monthly_grant',
  'purchase',
  'usage',
  'refund',
]);

const LEDGER_ENTRY_STATUSES = new Set<TicketLedgerEntryStatus>([
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export function assertValidTicketBalance(balance: number): void {
  if (!Number.isSafeInteger(balance) || balance < 0) {
    throw new RangeError('Ticket balance must be a non-negative safe integer.');
  }
}

export function getTicketCost(featureKind: TicketFeatureKind): number {
  if (!Object.prototype.hasOwnProperty.call(TICKET_COSTS, featureKind)) {
    throw new RangeError(`Unknown ticket feature kind: ${String(featureKind)}`);
  }

  return TICKET_COSTS[featureKind];
}

export function formatTicketCount(balance: number): string {
  assertValidTicketBalance(balance);
  return `${new Intl.NumberFormat('ko-KR').format(balance)}장`;
}

export function canAfford(balance: number, featureKind: TicketFeatureKind): boolean {
  assertValidTicketBalance(balance);
  return balance >= getTicketCost(featureKind);
}

export function calculatePostPurchaseBalance(balance: number, packId: TicketPackId): number {
  assertValidTicketBalance(balance);

  const pack = TICKET_PACKS.find((candidate) => candidate.id === packId);
  if (!pack) {
    throw new RangeError(`Unknown ticket pack: ${String(packId)}`);
  }

  const nextBalance = balance + pack.tickets;
  assertValidTicketBalance(nextBalance);
  return nextBalance;
}

export function isFailedLedgerEntryRefundable(entry: TicketLedgerEntry): boolean {
  if (
    entry === null ||
    typeof entry !== 'object' ||
    !LEDGER_ENTRY_KINDS.has(entry.kind) ||
    !LEDGER_ENTRY_STATUSES.has(entry.status)
  ) {
    throw new TypeError('Unknown ticket ledger entry.');
  }

  if (entry.kind === 'usage') {
    getTicketCost(entry.featureKind);
  }

  return entry.kind === 'usage' && entry.status === 'failed';
}
