'use client';

import { useRef, useState } from 'react';

import { useAtom } from 'jotai';
import {
  Heart,
  Clock,
  Album,
  ArrowDownWideNarrow,
  ChevronDown,
  ArrowUpNarrowWide,
  ALargeSmall,
  TimerReset,
  Map as MapIcon,
  Maximize,
  Folder,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { COMMUNITY_MESSAGES } from '@/constants/messages';
import { useClickOutside } from '@/hooks/use-click-outside';
import { cn } from '@/lib/utils';

import {
  activeTabAtom,
  filterCategoryAtom,
  sortByAtom,
  sortOrderAtom,
} from '../../../stores/community.atoms';
import { ActiveTab } from '../../../types/community.types';

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
      size="xs"
      onClick={onClick}
      className={cn(
        'min-h-[32px] w-full justify-start gap-2 rounded-md px-2 py-[5.5px] text-sm font-normal',
        isActive ? 'bg-muted text-foreground' : 'text-muted-foreground',
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

export function CommunityFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [sortOrder, setSortOrder] = useAtom(sortOrderAtom);
  const [sortBy, setSortBy] = useAtom(sortByAtom);
  const [filterCategory, setFilterCategory] = useAtom(filterCategoryAtom);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const TABS = [
    { id: 'popular', label: COMMUNITY_MESSAGES.TAB_POPULAR, icon: Heart },
    { id: 'latest', label: COMMUNITY_MESSAGES.TAB_LATEST, icon: Clock },
    { id: 'saved', label: COMMUNITY_MESSAGES.TAB_SAVED, icon: Album },
  ] as const;

  return (
    <div className="relative mb-10 flex w-full max-w-[960px] items-center gap-2 px-4 py-4 md:px-0">
      <div
        className="flex min-w-0 flex-1 [scrollbar-width:none] items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="커뮤니티 탭 필터"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              type="button"
              intent={isActive ? 'primary' : 'neutral'}
              variant={isActive ? 'solid' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              aria-pressed={isActive}
              className="h-9 shrink-0 gap-2 rounded-lg px-3 py-[7.5px] font-normal sm:px-4"
            >
              <Icon
                className={cn(
                  'h-[13px] w-[13px]',
                  isActive ? 'text-primary-foreground' : 'text-foreground',
                )}
              />
              <span className="text-[14px] leading-[20px] font-normal">{tab.label}</span>
            </Button>
          );
        })}
      </div>

      <div className="relative shrink-0" ref={dropdownRef}>
        <Button
          intent="neutral"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="정렬 옵션"
          aria-expanded={isOpen}
          className="h-9 w-11 justify-center rounded-lg p-0 font-normal sm:w-32 sm:justify-between sm:gap-2 sm:py-2 sm:pr-2 sm:pl-3"
        >
          <div className="flex items-center gap-[8px]">
            <ArrowDownWideNarrow className="text-foreground h-5 w-5" />
            <span className="text-foreground hidden text-sm leading-5 sm:inline">
              {sortOrder === 'desc' ? COMMUNITY_MESSAGES.SORT_DESC : COMMUNITY_MESSAGES.SORT_ASC}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'text-muted-foreground hidden h-4 w-4 transition-transform sm:block',
              isOpen && 'rotate-180',
            )}
          />
        </Button>

        {isOpen && (
          <div className="animate-in fade-in zoom-in-95 border-border bg-card absolute top-11 right-0 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-[434px] flex-wrap gap-x-2 gap-y-4 overflow-y-auto rounded-lg border p-4 duration-100">
            <div className="flex w-[124px] flex-col gap-1">
              <p className="text-foreground text-xs font-medium">
                {COMMUNITY_MESSAGES.SORT_ORDER_LABEL}
              </p>
              <Separator />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.SORT_DESC}
                isActive={sortOrder === 'desc'}
                onClick={() => setSortOrder('desc')}
                icon={<ArrowDownWideNarrow className="h-5 w-5" />}
              />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.SORT_ASC}
                isActive={sortOrder === 'asc'}
                onClick={() => setSortOrder('asc')}
                icon={<ArrowUpNarrowWide className="h-5 w-5" />}
              />
            </div>

            <div className="flex w-[130px] flex-col gap-1">
              <p className="text-foreground text-xs font-medium">
                {COMMUNITY_MESSAGES.SORT_BY_LABEL}
              </p>
              <Separator />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.SORT_NAME}
                isActive={sortBy === 'name'}
                onClick={() => setSortBy('name')}
                icon={<ALargeSmall className="h-5 w-5" />}
              />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.SORT_RECENT}
                isActive={sortBy === 'recent'}
                onClick={() => setSortBy('recent')}
                icon={<TimerReset className="h-5 w-5" />}
              />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.SORT_SIZE}
                isActive={sortBy === 'size'}
                onClick={() => setSortBy('size')}
                icon={<Maximize className="h-5 w-5" />}
              />
            </div>

            <div className="flex w-[132px] flex-col gap-1">
              <p className="text-foreground text-xs font-medium">
                {COMMUNITY_MESSAGES.FILTER_LABEL}
              </p>
              <Separator />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.FILTER_ALL}
                isActive={filterCategory === 'all'}
                onClick={() => setFilterCategory('all')}
                icon={
                  <div
                    className={cn(
                      'mx-1.5 h-1.5 w-1.5 rounded-full',
                      filterCategory === 'all' ? 'bg-foreground' : 'bg-muted-foreground',
                    )}
                  />
                }
              />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.FILTER_ROADMAP}
                isActive={filterCategory === 'roadmap'}
                onClick={() => setFilterCategory('roadmap')}
                icon={<MapIcon className="h-5 w-5" />}
              />
              <FilterDropdownItem
                label={COMMUNITY_MESSAGES.FILTER_DIRECTORY}
                isActive={filterCategory === 'directory'}
                onClick={() => setFilterCategory('directory')}
                icon={<Folder className="h-5 w-5" />}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
