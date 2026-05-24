import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props { name: string; photoUrl?: string | null; size?: number; className?: string; }

export default function Avatar({ name, photoUrl, size = 36, className }: Props) {
  if (photoUrl) {
    return (
      <Image src={photoUrl} alt={name} width={size} height={size}
        className={cn('rounded-full object-cover flex-shrink-0', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  const colors = ['bg-blue-500','bg-indigo-500','bg-purple-500','bg-pink-500','bg-emerald-500','bg-orange-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold flex-shrink-0', color, className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {getInitials(name)}
    </div>
  );
}
