import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'placeholder:text-muted-foreground flex field-sizing-content w-full border text-base transition-[background-color,border-color,color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/35 md:text-sm',
  {
    variants: {
      variant: {
        outline: 'border-input bg-background shadow-xs dark:bg-input/30',
        filled: 'border-transparent bg-muted shadow-none hover:bg-muted/80',
      },
      textareaSize: {
        sm: 'min-h-20 rounded-lg px-3 py-2 text-xs',
        md: 'min-h-28 rounded-xl px-3.5 py-3',
        lg: 'min-h-36 rounded-xl px-4 py-3 text-base',
      },
      validation: {
        default: 'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
        error:
          'border-destructive focus-visible:border-destructive focus-visible:ring-3 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/35',
        success:
          'border-success focus-visible:border-success focus-visible:ring-3 focus-visible:ring-success/20',
      },
    },
    defaultVariants: {
      variant: 'outline',
      textareaSize: 'md',
      validation: 'default',
    },
  },
);

export type TextareaProps = React.ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants>;

function Textarea({
  className,
  variant,
  textareaSize,
  validation,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-variant={variant ?? 'outline'}
      data-size={textareaSize ?? 'md'}
      data-validation={validation ?? 'default'}
      aria-invalid={validation === 'error' || ariaInvalid || undefined}
      className={cn(textareaVariants({ variant, textareaSize, validation }), className)}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
