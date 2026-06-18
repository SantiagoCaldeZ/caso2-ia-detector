import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted';

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-slate-200 text-slate-700',
  success: 'bg-[var(--success)]/15 text-[var(--success)]',
  warning: 'bg-[var(--warning)]/15 text-[var(--warning)]',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)]',
  muted: 'bg-slate-100 text-slate-600',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
