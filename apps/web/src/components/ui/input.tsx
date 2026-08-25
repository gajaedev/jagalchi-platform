import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export type InputVariant = 'outline' | 'filled' | 'underlined';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputValidation = 'default' | 'error' | 'success';

const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 border text-base transition-[background-color,border-color,color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium read-only:cursor-default read-only:bg-muted/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/35 md:text-sm',
  {
    variants: {
      variant: {
        outline: 'border-input bg-background shadow-xs dark:bg-input/30',
        filled: 'border-transparent bg-muted shadow-none hover:bg-muted/80',
        underlined: 'rounded-none border-x-0 border-t-0 bg-transparent px-0 shadow-none',
      },
      inputSize: {
        sm: 'h-9 rounded-lg px-3 py-1 text-xs',
        md: 'h-11 rounded-xl px-3.5 py-2',
        lg: 'h-12 rounded-xl px-4 py-2 text-base',
      },
      validation: {
        default: 'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
        error:
          'border-destructive focus-visible:border-destructive focus-visible:ring-3 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/35',
        success:
          'border-success focus-visible:border-success focus-visible:ring-3 focus-visible:ring-success/20 dark:focus-visible:ring-success/35',
      },
    },
    defaultVariants: {
      variant: 'outline',
      inputSize: 'md',
      validation: 'default',
    },
  },
);

export type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants>;

function Input({
  className,
  type,
  variant,
  inputSize,
  validation,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant ?? 'outline'}
      data-size={inputSize ?? 'md'}
      data-validation={validation ?? 'default'}
      aria-invalid={validation === 'error' || ariaInvalid || undefined}
      className={cn(inputVariants({ variant, inputSize, validation }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
