import { cn } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/types';

interface Props { status: string; label?: string; className?: string; }

export default function Badge({ status, label, className }: Props) {
  return (
    <span className={cn('badge', STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600', className)}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
