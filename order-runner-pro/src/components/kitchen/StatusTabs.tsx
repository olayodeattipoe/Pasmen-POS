import { OrderStatus } from '@/api/models';
import { cn } from '@/lib/utils';
import { Flame, ChefHat, CheckCircle2, LayoutGrid } from 'lucide-react';

type FilterOption = OrderStatus | 'all';

interface StatusTabsProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  counts: Record<FilterOption, number>;
}

const tabs: { value: FilterOption; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
  { value: 'new', label: 'New', icon: <Flame className="w-4 h-4" /> },
  { value: 'preparing', label: 'Prep', icon: <ChefHat className="w-4 h-4" /> },
  { value: 'ready', label: 'Ready', icon: <CheckCircle2 className="w-4 h-4" /> },
];

export function StatusTabs({ activeFilter, onFilterChange, counts }: StatusTabsProps) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onFilterChange(tab.value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all",
            "border border-transparent",
            activeFilter === tab.value
              ? "bg-primary text-primary-foreground glow-accent"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          <span
            className={cn(
              "min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold",
              activeFilter === tab.value
                ? "bg-primary-foreground/20"
                : "bg-foreground/10"
            )}
          >
            {counts[tab.value]}
          </span>
        </button>
      ))}
    </div>
  );
}
