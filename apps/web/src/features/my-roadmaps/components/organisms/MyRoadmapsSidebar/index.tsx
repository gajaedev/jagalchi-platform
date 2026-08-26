import { useRef, useState } from 'react';

import { useAtom } from 'jotai';
import {
  ChevronDown,
  Clock,
  Files,
  Folder,
  LogOut,
  MoreHorizontal,
  Pencil,
  Search,
  Star,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { DirectoryTreeItem } from '@/api/roadmap';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AUTH_MESSAGES, EDITOR_MESSAGES, MY_ROADMAPS_MESSAGES } from '@/constants/messages';
import { cn } from '@/lib/utils';

import { useDeleteDirectory } from '../../../hooks/use-delete-directory';
import { useDirectoryTree } from '../../../hooks/use-directory-tree';
import { useUpdateDirectory } from '../../../hooks/use-update-directory';
import {
  searchQueryAtom,
  type SidebarCategory,
  sidebarCategoryAtom,
} from '../../../stores/my-roadmaps.atoms';

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  id: SidebarCategory;
}

const SIDEBAR_GROUPS: SidebarItem[][] = [
  [{ icon: Clock, label: MY_ROADMAPS_MESSAGES.SIDEBAR_RECENT, id: 'recent' }],
  [
    { icon: Files, label: MY_ROADMAPS_MESSAGES.SIDEBAR_MY_ROADMAP, id: 'my-roadmap' },
    { icon: Users, label: MY_ROADMAPS_MESSAGES.SIDEBAR_SHARED, id: 'shared' },
  ],
  [{ icon: Star, label: MY_ROADMAPS_MESSAGES.SIDEBAR_FAVORITES, id: 'favorites' }],
];

function DirectoryNode({ node }: { node: DirectoryTreeItem }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const inputRef = useRef<HTMLInputElement>(null);

  /** path 기반 depth 계산 (e.g. "/a/b" → depth 1) */
  const depth = node.path ? node.path.split('/').filter(Boolean).length - 1 : 0;

  const { mutate: updateDirectory, isPending: isUpdating } = useUpdateDirectory();
  const { mutate: deleteDirectory } = useDeleteDirectory();

  const handleRenameStart = () => {
    setRenameValue(node.name);
    setIsRenaming(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.name) {
      updateDirectory({ id: node.id, name: trimmed });
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setIsRenaming(false);
  };

  const handleDeleteConfirm = () => {
    deleteDirectory(node.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div>
      <div
        className="group text-foreground hover:bg-accent flex h-7 w-full items-center gap-1.5 rounded-md text-sm transition-colors"
        style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: '4px' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="w-3.5 shrink-0" />
          <Folder className="text-muted-foreground h-4 w-4 shrink-0" />
          {isRenaming ? (
            <Input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              disabled={isUpdating}
              className="bg-background h-6 min-w-0 flex-1 rounded px-1 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              intent="neutral"
              variant="ghost"
              size="icon-sm"
              className="size-5 shrink-0 rounded opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`${node.name} 더보기`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="text-muted-foreground size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={handleRenameStart}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {MY_ROADMAPS_MESSAGES.DIR_RENAME}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} variant="destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {MY_ROADMAPS_MESSAGES.DIR_DELETE}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{MY_ROADMAPS_MESSAGES.DIR_DELETE}</AlertDialogTitle>
            <AlertDialogDescription>
              {MY_ROADMAPS_MESSAGES.DIR_DELETE_CONFIRM}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{EDITOR_MESSAGES.AI_MODAL_CANCEL}</AlertDialogCancel>
            <AlertDialogAction intent="destructive" onClick={handleDeleteConfirm}>
              {MY_ROADMAPS_MESSAGES.DIR_DELETE}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface MyRoadmapsSidebarProps {
  className?: string;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  onProfileClick?: () => void;
}

export function MyRoadmapsSidebar({
  className,
  userName = 'UserName',
  userEmail = 'user@example.com',
  onLogout,
  onProfileClick,
}: MyRoadmapsSidebarProps) {
  const [activeCategory, setActiveCategory] = useAtom(sidebarCategoryAtom);
  const [searchQuery, setSearchQuery] = useAtom(searchQueryAtom);
  const { data: directoryTree } = useDirectoryTree();
  const userInitial = userName.trim().charAt(0) || 'U';

  return (
    <div
      className={cn(
        'border-border bg-muted text-foreground flex min-h-screen w-[240px] flex-col border-r p-4',
        className,
      )}
    >
      {/* Profile Section */}
      <Button
        type="button"
        intent="neutral"
        variant="ghost"
        size="md"
        aria-label={MY_ROADMAPS_MESSAGES.PROFILE_ARIA}
        className="mb-4 h-auto w-full justify-start gap-3 rounded-md px-3 py-2 text-left font-normal"
        onClick={onProfileClick}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate text-sm font-normal">{userName}</span>
          <span className="text-foreground truncate text-xs leading-4">{userEmail}</span>
        </div>
        <ChevronDown className="text-muted-foreground size-5" />
      </Button>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
          <Input
            placeholder="과제·폴더 검색"
            className="bg-background h-9 pl-10 text-sm shadow-xs"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col">
        {SIDEBAR_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <Separator className="my-2" />}
            {group.map((item) => (
              <Button
                key={item.id}
                type="button"
                intent="neutral"
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(item.id)}
                aria-pressed={activeCategory === item.id}
                className={cn(
                  'h-8 w-full justify-start gap-2 rounded-md px-3 py-1 text-sm font-normal',
                  activeCategory === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground',
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Button>
            ))}
          </div>
        ))}
      </nav>

      {/* Directory Tree */}
      {directoryTree && directoryTree.length > 0 && (
        <>
          <Separator className="my-2" />
          <div className="flex flex-col gap-0.5">
            {directoryTree.map((dir) => (
              <DirectoryNode key={dir.id} node={dir} />
            ))}
          </div>
        </>
      )}

      {/* Logout */}
      {onLogout && (
        <>
          <Separator className="my-2 mt-auto" />
          <Button
            type="button"
            intent="neutral"
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-8 w-full justify-start gap-2 rounded-md px-3 py-1 text-sm font-normal"
          >
            <LogOut className="size-5" />
            {AUTH_MESSAGES.LOGOUT}
          </Button>
        </>
      )}
    </div>
  );
}
