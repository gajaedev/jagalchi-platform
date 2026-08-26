'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { BookOpen } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MY_ROADMAPS_MESSAGES } from '@/constants/messages';
import type { RoadmapSummary } from '@/types/roadmap.types';

import { useDeleteRoadmap } from '../../../hooks/use-delete-roadmap';
import { useUpdateRoadmap } from '../../../hooks/use-update-roadmap';
import { RoadmapCard } from '../../atoms/RoadmapCard';

interface MyRoadmapsGridProps {
  emptyMessage?: string;
  roadmaps: RoadmapSummary[];
}

export function MyRoadmapsGrid({
  emptyMessage = MY_ROADMAPS_MESSAGES.EMPTY,
  roadmaps,
}: MyRoadmapsGridProps) {
  const router = useRouter();
  const deleteMutation = useDeleteRoadmap();
  const updateMutation = useUpdateRoadmap();

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Rename dialog state
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget);
    setDeleteTarget(null);
  };

  const handleRenameOpen = (id: string, title: string) => {
    setRenameTarget({ id, title });
    setRenameInput(title);
  };

  const handleRenameConfirm = () => {
    if (!renameTarget || !renameInput.trim()) return;
    updateMutation.mutate({
      roadmapId: renameTarget.id,
      data: { title: renameInput.trim() },
    });
    setRenameTarget(null);
    setRenameInput('');
  };

  const handleOpenRoadmap = (roadmap: RoadmapSummary) => {
    if (roadmap.type === 'Directory') return;
    router.push(`/editor/${roadmap.id}`);
  };

  return (
    <>
      {roadmaps.length === 0 ? (
        <div className="border-border bg-muted/40 flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <BookOpen className="text-muted-foreground mb-3 h-8 w-8" />
          <p className="text-foreground text-sm font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roadmaps.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              id={roadmap.id}
              title={roadmap.title}
              type={roadmap.type}
              author={roadmap.author}
              fileCount={roadmap.fileCount}
              imageUrl={roadmap.imageUrl}
              isFavorite={roadmap.isFavorite}
              onClick={() => handleOpenRoadmap(roadmap)}
              onRename={() => handleRenameOpen(roadmap.id, roadmap.title)}
              onDelete={() => setDeleteTarget(roadmap.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{MY_ROADMAPS_MESSAGES.DELETE_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {MY_ROADMAPS_MESSAGES.DELETE_DESCRIPTION}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{MY_ROADMAPS_MESSAGES.DELETE_CANCEL}</AlertDialogCancel>
            <AlertDialogAction intent="destructive" onClick={handleDeleteConfirm}>
              {MY_ROADMAPS_MESSAGES.DELETE_CONFIRM}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename dialog */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameInput('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{MY_ROADMAPS_MESSAGES.RENAME_TITLE}</DialogTitle>
            <DialogDescription>실행 과제의 새 이름을 입력하세요.</DialogDescription>
          </DialogHeader>
          <Input
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder={MY_ROADMAPS_MESSAGES.RENAME_PLACEHOLDER}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameConfirm();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameTarget(null);
                setRenameInput('');
              }}
            >
              {MY_ROADMAPS_MESSAGES.RENAME_CANCEL}
            </Button>
            <Button onClick={handleRenameConfirm} disabled={!renameInput.trim()}>
              {MY_ROADMAPS_MESSAGES.RENAME_CONFIRM}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
