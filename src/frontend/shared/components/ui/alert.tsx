import { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type AlertVariant = 'info' | 'warning' | 'danger' | 'success';

const variantClass: Record<AlertVariant, string> = {
  info: 'border-sky-300 bg-sky-50 text-sky-900',
  warning: 'border-amber-300 bg-amber-50 text-amber-900',
  danger: 'border-red-300 bg-red-50 text-red-900',
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export function Alert({ className, variant = 'info', ...props }: AlertProps) {
  return (
    <div
      className={cn('rounded-md border px-3 py-2 text-sm', variantClass[variant], className)}
      role="alert"
      {...props}
    />
  );
}
