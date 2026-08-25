import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export type CardIntent = 'neutral' | 'primary' | 'ticket' | 'success' | 'warning' | 'destructive';
export type CardVariant = 'surface' | 'elevated' | 'outlined' | 'subtle' | 'solid' | 'interactive';
export type CardPadding = 'default' | 'none' | 'sm' | 'md' | 'lg';
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl';

const cardVariants = cva(
  'flex flex-col transition-[background-color,border-color,box-shadow,transform]',
  {
    variants: {
      intent: {
        neutral: '',
        primary: '',
        ticket: '',
        success: '',
        warning: '',
        destructive: '',
      },
      variant: {
        surface: 'border border-border bg-card text-card-foreground shadow-sm',
        elevated: 'border border-border/60 bg-card text-card-foreground shadow-lg',
        outlined: 'border bg-transparent text-foreground shadow-none',
        subtle: 'border border-transparent shadow-none',
        solid: 'border border-transparent shadow-sm',
        interactive:
          'border border-border bg-card text-card-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm focus-visible:ring-3 focus-visible:outline-none',
      },
      padding: {
        default: 'gap-6 py-6',
        none: 'gap-0 p-0',
        sm: 'gap-3 p-4',
        md: 'gap-5 p-5',
        lg: 'gap-6 p-6',
      },
      radius: {
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
      },
    },
    compoundVariants: [
      {
        intent: 'neutral',
        variant: ['subtle', 'solid'],
        className: 'bg-muted text-foreground',
      },
      {
        intent: 'primary',
        variant: 'subtle',
        className: 'border-primary/20 bg-primary-subtle text-foreground',
      },
      {
        intent: 'ticket',
        variant: 'subtle',
        className: 'border-ticket/20 bg-ticket-subtle text-foreground',
      },
      {
        intent: 'success',
        variant: 'subtle',
        className: 'border-success/30 bg-success-subtle text-foreground',
      },
      {
        intent: 'warning',
        variant: 'subtle',
        className: 'border-warning/30 bg-warning-subtle text-foreground',
      },
      {
        intent: 'destructive',
        variant: 'subtle',
        className: 'border-error/30 bg-error-subtle text-foreground',
      },
      {
        intent: 'primary',
        variant: 'solid',
        className: 'bg-primary text-primary-foreground',
      },
      {
        intent: 'ticket',
        variant: 'solid',
        className: 'bg-ticket text-ticket-foreground',
      },
      {
        intent: 'success',
        variant: 'solid',
        className: 'bg-success text-success-foreground',
      },
      {
        intent: 'warning',
        variant: 'solid',
        className: 'bg-warning text-warning-foreground',
      },
      {
        intent: 'destructive',
        variant: 'solid',
        className: 'bg-error text-error-foreground',
      },
      {
        intent: 'neutral',
        variant: ['outlined', 'interactive'],
        className: 'focus-visible:ring-ring/40',
      },
      {
        intent: 'primary',
        variant: ['outlined', 'interactive'],
        className: 'border-primary/35 focus-visible:ring-primary/35',
      },
      {
        intent: 'ticket',
        variant: ['outlined', 'interactive'],
        className: 'border-ticket/35 focus-visible:ring-ticket/35',
      },
      {
        intent: 'success',
        variant: ['outlined', 'interactive'],
        className: 'border-success/35 focus-visible:ring-success/35',
      },
      {
        intent: 'warning',
        variant: ['outlined', 'interactive'],
        className: 'border-warning/35 focus-visible:ring-warning/35',
      },
      {
        intent: 'destructive',
        variant: ['outlined', 'interactive'],
        className: 'border-error/35 focus-visible:ring-error/35',
      },
    ],
    defaultVariants: {
      intent: 'neutral',
      variant: 'surface',
      padding: 'default',
      radius: 'md',
    },
  },
);

export type CardProps = React.ComponentProps<'div'> &
  VariantProps<typeof cardVariants> & { asChild?: boolean };

function Card({
  className,
  intent = 'neutral',
  variant = 'surface',
  padding = 'default',
  radius = 'md',
  asChild = false,
  ...props
}: CardProps) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot="card"
      data-intent={intent}
      data-variant={variant}
      data-padding={padding}
      data-radius={radius}
      className={cn(cardVariants({ intent, variant, padding, radius }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
