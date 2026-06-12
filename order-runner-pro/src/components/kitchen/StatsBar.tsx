import { TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface StatsBarProps {
  completedToday: number;
  avgTime: number; // minutes
  rushOrders: number;
}

export function StatsBar({ completedToday, avgTime, rushOrders }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4 py-3">
      <div className="glass-card p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-success mb-1">
          <CheckCircle className="w-4 h-4" />
        </div>
        <p className="text-2xl font-bold">{completedToday}</p>
        <p className="text-xs text-muted-foreground">Completed</p>
      </div>

      <div className="glass-card p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-accent mb-1">
          <Clock className="w-4 h-4" />
        </div>
        <p className="text-2xl font-bold">{avgTime}m</p>
        <p className="text-xs text-muted-foreground">Avg Time</p>
      </div>

      <div className="glass-card p-3 text-center">
        <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
          <TrendingUp className="w-4 h-4" />
        </div>
        <p className="text-2xl font-bold">{rushOrders}</p>
        <p className="text-xs text-muted-foreground">Rush</p>
      </div>
    </div>
  );
}
