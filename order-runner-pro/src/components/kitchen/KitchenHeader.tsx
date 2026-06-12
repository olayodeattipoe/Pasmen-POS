import { Bell, Settings, Wifi } from 'lucide-react';

interface KitchenHeaderProps {
  stationName: string;
  pendingCount: number;
}

export function KitchenHeader({ stationName, pendingCount }: KitchenHeaderProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <header className="glass-surface border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Station
          </span>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-primary mr-2">Calabash</span>
            {stationName}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold tabular-nums">{currentTime}</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wifi className="w-3.5 h-3.5 text-success" />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success font-medium">{pendingCount} pending</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
