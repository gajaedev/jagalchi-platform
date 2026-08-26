'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';
import { ChevronRight, ListFilter, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MY_ROADMAPS_MESSAGES } from '@/constants/messages';
import { useClickOutside } from '@/hooks/use-click-outside';
import { cn } from '@/lib/utils';

import { useCreateDirectory } from '../../../hooks/use-create-directory';
import { useCreateRoadmap } from '../../../hooks/use-create-roadmap';
import { breadcrumbPathAtom, searchQueryAtom } from '../../../stores/my-roadmaps.atoms';
import { AddDirectoryModal } from '../AddDirectoryModal';
import { AddRoadmapModal } from '../AddRoadmapModal';
import { MyRoadmapsFilter } from '../MyRoadmapsFilter';

export function MyRoadmapsToolbar() {
  const router = useRouter();
  const createMutation = useCreateRoadmap();
  const createDirMutation = useCreateDirectory();
  const [breadcrumbPath, setBreadcrumbPath] = useAtom(breadcrumbPathAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useClickOutside(filterRef, () => setIsFilterOpen(false));

  const handleAddRoadmap = (name: string, _locationId?: string | null) => {
    createMutation.mutate(
      { title: name },
      {
        onSuccess: (response) => {
          router.push(`/editor/${response.id}`);
        },
      },
    );
  };

  const handleAddDirectory = (name: string) => {
    createDirMutation.mutate({ name });
  };

  return (
    <div className="flex w-full flex-col gap-3 py-4 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
      {breadcrumbPath.length === 0 ? (
        <div className="flex h-9 items-center px-3">
          <span className="text-sm font-semibold">{MY_ROADMAPS_MESSAGES.ALL_ROADMAPS}</span>
        </div>
      ) : (
        <div className="flex h-9 items-center">
          <Button
            type="button"
            intent="neutral"
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-xl font-semibold hover:bg-transparent hover:opacity-70"
            onClick={() => setBreadcrumbPath([])}
          >
            {MY_ROADMAPS_MESSAGES.ALL_ROADMAPS}
          </Button>
          {breadcrumbPath.map((segment, index) => {
            const isLast = index === breadcrumbPath.length - 1;
            return (
              <div key={segment.id} className="flex items-center">
                <ChevronRight className="text-muted-foreground mx-1 h-5 w-5" />
                {isLast ? (
                  <span className="text-primary text-base font-semibold">{segment.name}</span>
                ) : (
                  <Button
                    type="button"
                    intent="neutral"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-0 text-base font-semibold hover:bg-transparent hover:opacity-70"
                    onClick={() => setBreadcrumbPath(breadcrumbPath.slice(0, index + 1))}
                  >
                    {segment.name}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex w-full items-center gap-2 lg:w-auto">
        <div className="relative min-w-0 flex-1 lg:flex-none">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder={MY_ROADMAPS_MESSAGES.SEARCH_PLACEHOLDER}
            className="bg-background h-10 w-full pl-9 text-xs lg:w-[240px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative" ref={filterRef}>
          <Button
            variant="outline"
            intent="neutral"
            size="icon-sm"
            aria-label="실행 과제 필터"
            className={cn('border-border h-10 w-10 transition-colors', isFilterOpen && 'bg-muted')}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <ListFilter className="text-muted-foreground h-4 w-4" />
          </Button>

          {isFilterOpen && <MyRoadmapsFilter />}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              intent="primary"
              variant="solid"
              size="sm"
              className="h-10 shrink-0 rounded-md px-4 text-sm"
            >
              새 과제
              <Plus className="ml-1.5 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px] rounded-lg p-1.5 shadow-lg">
            <DropdownMenuItem
              className="flex cursor-pointer items-center rounded-lg px-3 py-2.5"
              onClick={() => setIsRoadmapModalOpen(true)}
            >
              <span className="text-foreground text-[13px] font-semibold">
                {MY_ROADMAPS_MESSAGES.NEW_ROADMAP}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex cursor-pointer items-center rounded-lg px-3 py-2.5"
              onClick={() => setIsDirectoryModalOpen(true)}
            >
              <span className="text-foreground text-[13px] font-semibold">
                {MY_ROADMAPS_MESSAGES.NEW_DIRECTORY}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AddRoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
        onConfirm={handleAddRoadmap}
      />
      <AddDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        onConfirm={handleAddDirectory}
      />
    </div>
  );
}
