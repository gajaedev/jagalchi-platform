'use client';

import { useAtom } from 'jotai';
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ALargeSmall,
  CircleSmall,
  TimerReset,
  Maximize,
  Map as MapIcon,
  Folder,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MY_ROADMAPS_MESSAGES } from '@/constants/messages';
import {
  filterCategoryAtom,
  sortByAtom,
  sortOrderAtom,
} from '@/features/my-roadmaps/stores/my-roadmaps.atoms';
import { cn } from '@/lib/utils';

interface FilterItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

function FilterDropdownItem({ label, isActive, onClick, icon }: FilterItemProps) {
  return (
    <Button
      type="button"
      intent="neutral"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-full justify-start gap-2 rounded-md px-2 text-sm font-normal',
        isActive ? 'bg-muted text-foreground' : 'text-foreground',
      )}
    >
      <div className="flex h-5 w-5 items-center justify-center">{icon}</div>
      {label}
    </Button>
  );
}

export function MyRoadmapsFilter() {
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);
  const [sortBy, setSortBy] = useAtom(sortByAtom);
  const [filterCategory, setFilterCategory] = useAtom(filterCategoryAtom);

  return (
    <div className="animate-in fade-in zoom-in-95 border-border bg-popover text-popover-foreground absolute top-[44px] right-0 z-50 flex gap-2 rounded-lg border p-4 shadow-lg duration-100">
      <div className="flex w-[124px] flex-col gap-1">
        <p className="text-foreground text-xs font-medium">
          {MY_ROADMAPS_MESSAGES.SORT_ORDER_LABEL}
        </p>
        <Separator className="my-1" />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.SORT_DESC}
          isActive={sortOrder === 'desc'}
          onClick={() => setSortOrder('desc')}
          icon={<ArrowDownWideNarrow className="size-5" />}
        />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.SORT_ASC}
          isActive={sortOrder === 'asc'}
          onClick={() => setSortOrder('asc')}
          icon={<ArrowUpNarrowWide className="size-5" />}
        />
      </div>

      <div className="flex w-[130px] flex-col gap-1">
        <p className="text-foreground text-xs font-medium">{MY_ROADMAPS_MESSAGES.SORT_BY_LABEL}</p>
        <Separator className="my-1" />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.SORT_NAME}
          isActive={sortBy === 'name'}
          onClick={() => setSortBy('name')}
          icon={<ALargeSmall className="size-5" />}
        />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.SORT_RECENT}
          isActive={sortBy === 'recent'}
          onClick={() => setSortBy('recent')}
          icon={<TimerReset className="size-5" />}
        />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.SORT_SIZE}
          isActive={sortBy === 'size'}
          onClick={() => setSortBy('size')}
          icon={<Maximize className="size-5" />}
        />
      </div>

      <div className="flex w-[132px] flex-col gap-1">
        <p className="text-foreground text-xs font-medium">{MY_ROADMAPS_MESSAGES.FILTER_LABEL}</p>
        <Separator className="my-1" />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.FILTER_ALL}
          isActive={filterCategory === 'all'}
          onClick={() => setFilterCategory('all')}
          icon={<CircleSmall className="size-5" />}
        />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.FILTER_ROADMAP}
          isActive={filterCategory === 'roadmap'}
          onClick={() => setFilterCategory('roadmap')}
          icon={<MapIcon className="size-5" />}
        />
        <FilterDropdownItem
          label={MY_ROADMAPS_MESSAGES.FILTER_DIRECTORY}
          isActive={filterCategory === 'directory'}
          onClick={() => setFilterCategory('directory')}
          icon={<Folder className="size-5" />}
        />
      </div>
    </div>
  );
}
