'use client';

import { useState } from 'react';

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

import { SelectLocationModal } from '../SelectLocationModal';

interface AddRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, locationId?: string | null) => void;
}

export function AddRoadmapModal({ isOpen, onClose, onConfirm }: AddRoadmapModalProps) {
  const [roadmapName, setRoadmapName] = useState('');
  const [isSelectLocationOpen, setIsSelectLocationOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!roadmapName.trim()) return;
    onConfirm(roadmapName.trim(), selectedLocationId);
    setRoadmapName('');
    setSelectedLocationId(null);
    onClose();
  };

  const handleClose = () => {
    setRoadmapName('');
    setSelectedLocationId(null);
    onClose();
  };

  const handleOpenSelectLocation = () => {
    setIsSelectLocationOpen(true);
  };

  const handleCloseSelectLocation = () => {
    setIsSelectLocationOpen(false);
  };

  const handleConfirmSelectLocation = (selectedId: string) => {
    setSelectedLocationId(selectedId);
    setIsSelectLocationOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="rounded-2xl p-6 sm:max-w-[440px]" showCloseButton={false}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground text-lg font-bold">
              {MY_ROADMAPS_MESSAGES.ADD_ROADMAP_TITLE}
            </DialogTitle>
            <DialogDescription>새 로드맵의 이름과 저장 위치를 정하세요.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={roadmapName}
              onChange={(e) => setRoadmapName(e.target.value)}
              placeholder={MY_ROADMAPS_MESSAGES.ADD_ROADMAP_PLACEHOLDER}
              className="h-12 px-4 text-sm shadow-none"
            />
          </div>
          <DialogFooter className="mt-6 flex items-center justify-between sm:justify-between">
            <Button
              intent="neutral"
              variant="link"
              size="sm"
              className="px-0"
              onClick={handleOpenSelectLocation}
            >
              {MY_ROADMAPS_MESSAGES.ADD_ROADMAP_DETAIL}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                intent="neutral"
                onClick={handleClose}
                className="h-9 rounded-lg px-4 text-sm font-semibold"
              >
                {MY_ROADMAPS_MESSAGES.CANCEL}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!roadmapName.trim()}
                className="h-9 rounded-lg px-4 text-sm font-semibold"
              >
                {MY_ROADMAPS_MESSAGES.CONFIRM}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelectLocationModal
        isOpen={isSelectLocationOpen}
        onClose={handleCloseSelectLocation}
        onConfirm={handleConfirmSelectLocation}
      />
    </>
  );
}
