'use client';

import { useState } from 'react';

import { ChevronRight, GitBranch } from 'lucide-react';

import type { RoadmapForkTreeResponse } from '@/api/roadmap';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VIEWER_MESSAGES } from '@/constants/messages';
import { useForkTree } from '@/hooks/use-fork-tree';

interface ForkTreeNodeItemProps {
  node: RoadmapForkTreeResponse;
  depth: number;
}

function ForkTreeNodeItem({ node, depth }: ForkTreeNodeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="hover:bg-muted flex items-center gap-1.5 rounded-md px-2 py-1.5"
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-muted-foreground flex h-4 w-4 shrink-0 items-center justify-center"
            aria-label={
              isExpanded ? VIEWER_MESSAGES.FORK_TREE_COLLAPSE : VIEWER_MESSAGES.FORK_TREE_EXPAND
            }
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <div className="h-4 w-4 shrink-0" />
        )}
        <GitBranch className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground min-w-0 flex-1 truncate text-sm">{node.title}</span>
        <span className="text-muted-foreground shrink-0 text-xs">@{node.ownerName}</span>
        {node.forkCount > 0 && (
          <span className="text-muted-foreground shrink-0 text-xs">({node.forkCount})</span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <ForkTreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ForkTreeDialogProps {
  roadmapId: string;
}

export function ForkTreeDialog({ roadmapId }: ForkTreeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: forkTree, isLoading } = useForkTree(roadmapId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button intent="neutral" variant="outline" size="sm">
          <GitBranch className="mr-1.5 h-4 w-4" />
          {VIEWER_MESSAGES.FORK_TREE_TITLE}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            {VIEWER_MESSAGES.FORK_TREE_TITLE}
          </DialogTitle>
          <DialogDescription>이 로드맵에서 파생된 포크 구조를 확인합니다.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground text-sm">{VIEWER_MESSAGES.FORK_TREE_LOADING}</p>
            </div>
          ) : !forkTree ? (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground text-sm">{VIEWER_MESSAGES.FORK_TREE_EMPTY}</p>
            </div>
          ) : (
            <div className="py-2">
              <ForkTreeNodeItem node={forkTree} depth={0} />
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
