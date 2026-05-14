import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface ControllerWaitProps {
  message: string;
  subtitle?: string;
  emoji?: string;
  details?: ReactNode;
  progress?: string;
}

export default function ControllerWait({ message, subtitle, emoji = '⏳', details, progress }: ControllerWaitProps) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-8 min-h-[60vh]">
      <motion.div 
        animate={{ scale: [1, 1.1, 1] }} 
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-8xl select-none"
      >
        {emoji}
      </motion.div>
      
      <div className="space-y-3">
        <h2 className="font-display text-4xl text-white uppercase tracking-tight">{message}</h2>
        {subtitle && <p className="text-muted-foreground font-medium">{subtitle}</p>}
      </div>

      {progress && (
        <div className="flex flex-col items-center gap-2">
           <div className="font-display text-5xl text-primary neon-text-purple">{progress}</div>
           <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Answered</span>
        </div>
      )}

      {details}

      <div className="flex items-center gap-3 bg-white/5 py-3 px-6 rounded-full border border-white/10">
        <span className="text-muted-foreground text-sm flex items-center gap-2">
           <span className="animate-pulse">👀</span> Watch the big screen!
        </span>
      </div>
    </div>
  );
}
