import { Player } from '@/src/types';
import { AVATAR_COLORS } from '@/src/lib/gameUtils';
import { cn } from '@/src/lib/utils';

interface PlayerAvatarProps {
  player?: Partial<Player>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  dim?: boolean;
  className?: string;
  hostBadge?: boolean;
}

export default function PlayerAvatar({ player, size = 'md', showName, dim, className, hostBadge }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  };

  const color = player?.avatar_color ? AVATAR_COLORS[player.avatar_color as keyof typeof AVATAR_COLORS] || '#555' : '#555';

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div 
        className={cn(
          "relative rounded-2xl flex items-center justify-center font-display shadow-lg transition-all duration-300",
          sizeClasses[size],
          dim && "opacity-40 grayscale",
          player?.avatar_color && "neon-glow-purple"
        )}
        style={{ backgroundColor: color }}
      >
        <span className="select-none">{player?.avatar_icon || '?'}</span>
        {hostBadge && player?.is_host && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-[10px] font-bold px-1 rounded-sm text-black uppercase tracking-tighter">
            Host
          </div>
        )}
      </div>
      {showName && player?.nickname && (
        <span className={cn(
          "font-display text-sm tracking-wide uppercase",
          dim ? "text-muted-foreground" : "text-foreground"
        )}>
          {player.nickname}
        </span>
      )}
    </div>
  );
}
