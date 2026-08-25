import { apiClient } from './client';

export interface TicketBalanceResponse {
  balance: number;
  nextMonthlyGrantAt: string;
  expiresAt: null;
}

export interface TicketLedgerResponse {
  id: string;
  amount: number;
  kind: 'SIGNUP_GRANT' | 'MONTHLY_GRANT' | 'PURCHASE' | 'AI_USAGE';
  status: 'RESERVED' | 'COMMITTED' | 'REFUNDED';
  feature: string | null;
  description: string;
  createdAt: string;
}

export interface TicketPurchaseContextResponse {
  appleAppAccountToken: string;
  googleObfuscatedAccountId: string;
}

export const getTicketBalance = () => apiClient.get<TicketBalanceResponse>('/tickets/balance');

export const getTicketLedger = () => apiClient.get<TicketLedgerResponse[]>('/tickets/ledger');

export const getTicketPurchaseContext = () =>
  apiClient.get<TicketPurchaseContextResponse>('/tickets/purchases/context');
