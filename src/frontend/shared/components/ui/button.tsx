import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-95 focus-visible:ring-[var(--ring)]',
        secondary: 'border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-slate-50',
        warning: 'bg-[var(--warning)] text-[var(--warning-foreground)] hover:brightness-95',
        danger: 'bg-[var(--danger)] text-[var(--danger-foreground)] hover:brightness-95',
        ghost: 'text-[var(--foreground)] hover:bg-slate-100',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
