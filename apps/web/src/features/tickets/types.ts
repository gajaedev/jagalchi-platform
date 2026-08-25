export type TicketFeatureKind =
  | 'coaching'
  | 'node_explanation'
  | 'resource_recommendation'
  | 'deep_search'
  | 'feedback'
  | 'roadmap_generation'
  | 'document_conversion';

export type TicketLedgerEntryKind =
  'signup_grant' | 'monthly_grant' | 'purchase' | 'usage' | 'refund';

export type TicketLedgerEntryStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type TicketPackId = 'ticket-20' | 'ticket-60' | 'ticket-150';

export type TicketPack =
  | Readonly<{
      id: 'ticket-20';
      storeProductId: 'com.jagalchi.app.ticket20';
      tickets: 20;
      priceKrw: 3900;
    }>
  | Readonly<{
      id: 'ticket-60';
      storeProductId: 'com.jagalchi.app.ticket60';
      tickets: 60;
      priceKrw: 8900;
    }>
  | Readonly<{
      id: 'ticket-150';
      storeProductId: 'com.jagalchi.app.ticket150';
      tickets: 150;
      priceKrw: 17900;
    }>;

export type TicketLedgerEntry =
  | Readonly<{
      kind: 'usage';
      status: TicketLedgerEntryStatus;
      featureKind: TicketFeatureKind;
    }>
  | Readonly<{
      kind: Exclude<TicketLedgerEntryKind, 'usage'>;
      status: TicketLedgerEntryStatus;
      featureKind?: never;
    }>;
