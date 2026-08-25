import { Ticket } from 'lucide-react';

import { formatTicketCount } from '../ticket-policy';

export interface TicketBalanceProps {
  balance: number;
  compact?: boolean;
  href?: string;
}

export function TicketBalance({ balance, compact = false, href }: TicketBalanceProps) {
  const ticketCount = formatTicketCount(balance);
  const label = compact ? ticketCount : `AI 티켓 ${ticketCount}`;
  const className =
    'inline-flex items-center gap-[7px] rounded-full bg-ticket-subtle px-[11px] py-2 text-xs font-bold text-ticket';
  const content = (
    <>
      <Ticket aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </>
  );

  if (href !== undefined) {
    return (
      <a
        href={href}
        className={`${className} hover:bg-ticket-subtle/75 focus-visible:ring-ticket/35 focus-visible:ring-offset-background transition-[background-color,transform,box-shadow] focus-visible:ring-3 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]`}
        aria-label={`${label} 확인`}
      >
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}
