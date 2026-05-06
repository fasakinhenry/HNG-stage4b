import { clsx } from 'clsx';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

// Generate consistent hue from name
function nameToHue(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hues = [220, 260, 160, 340, 30, 190];
  return `hsl(${hues[Math.abs(hash) % hues.length]}, 70%, 45%)`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
}

export function Avatar({ name, size = 'md', online, className }: AvatarProps) {
  const sizeCls: Record<AvatarSize, string> = {
    sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl',
  };
  return (
    <div
      className={clsx('avatar', sizeCls[size], online && 'avatar-online', className)}
      style={{ background: nameToHue(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
