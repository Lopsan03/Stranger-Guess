import { AVATAR_COLORS, AVATAR_ICONS } from '@/src/lib/gameUtils';
import { cn } from '@/src/lib/utils';
import PlayerAvatar from './PlayerAvatar';

interface AvatarPickerProps {
  selectedColor: string;
  selectedIcon: string;
  onColorChange: (color: string) => void;
  onIconChange: (icon: string) => void;
  nickname: string;
}

export default function AvatarPicker({ selectedColor, selectedIcon, onColorChange, onIconChange, nickname }: AvatarPickerProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <PlayerAvatar 
        player={{ nickname, avatar_color: selectedColor, avatar_icon: selectedIcon }} 
        size="xl" 
        showName 
      />

      <div className="w-full space-y-4">
        <div>
          <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-3 block">Choose Color</label>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(AVATAR_COLORS).map((colorKey) => (
              <button
                key={colorKey}
                onClick={() => onColorChange(colorKey)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  selectedColor === colorKey ? "border-white scale-125 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                )}
                style={{ backgroundColor: AVATAR_COLORS[colorKey as keyof typeof AVATAR_COLORS] }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground mb-3 block">Choose Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => onIconChange(icon)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white/5 hover:bg-white/10",
                  selectedIcon === icon ? "ring-2 ring-primary bg-white/15 scale-110" : "opacity-60"
                )}
              >
                <span className="text-xl">{icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
