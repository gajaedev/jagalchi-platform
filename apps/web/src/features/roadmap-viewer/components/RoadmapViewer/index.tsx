'use client';

import { useEffect, useRef, useState } from 'react';

import { ReactFlowProvider } from '@xyflow/react';
import { useAtom, useAtomValue } from 'jotai';
import { LayoutGrid, Map, PanelRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { VIEWER_MESSAGES } from '@/constants/messages';
import { capture } from '@/lib/analytics/client';

import { useViewerRoadmapLoader } from '../../hooks/use-viewer-roadmap-loader';
import {
  viewerErrorAtom,
  viewerLayoutAtom,
  viewerLoadingAtom,
  viewerRoadmapAtom,
  viewerSidebarOpenAtom,
} from '../../stores/viewer-atoms';
import { CardListMode } from '../CardListMode';
import { ForkTreeDialog } from '../ForkTreeDialog';
import { HeaderExportMenu } from '../HeaderExportMenu';
import { HeaderMenu } from '../HeaderMenu';
import { HeaderSaveAsImageMenu } from '../HeaderSaveAsImageMenu';
import { LearningCoachModal } from '../LearningCoachModal';
import { RoadmapHeader } from '../RoadmapHeader';
import { ViewerCanvas } from '../ViewerCanvas';
import { ViewerSidebar } from '../ViewerSidebar';
import { ViewerZoomControls } from '../ViewerZoomControls';

interface RoadmapViewerProps {
  roadmapId: string;
}

function ViewerContent({ roadmapId }: RoadmapViewerProps) {
  useViewerRoadmapLoader(roadmapId);

  const isLoading = useAtomValue(viewerLoadingAtom);
  const error = useAtomValue(viewerErrorAtom);
  const roadmap = useAtomValue(viewerRoadmapAtom);
  const [layout, setLayout] = useAtom(viewerLayoutAtom);
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(viewerSidebarOpenAtom);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const capturedRoadmapId = useRef<string | null>(null);
  const aiEnabled = process.env.NEXT_PUBLIC_AI_FEATURES_ENABLED === 'true';

  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    setLayout('cards');
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen, setLayout]);

  useEffect(() => {
    if (!roadmap || capturedRoadmapId.current === roadmapId) return;
    if (capture('roadmap_viewed', {})) capturedRoadmapId.current = roadmapId;
  }, [roadmap, roadmapId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{VIEWER_MESSAGES.LOADING}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">{VIEWER_MESSAGES.ERROR_NOT_FOUND}</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <RoadmapHeader
        roadmapId={roadmapId}
        roadmapTitle={roadmap?.title ?? VIEWER_MESSAGES.DEFAULT_ROADMAP_TITLE}
        onAiFeedback={aiEnabled ? () => setIsCoachOpen(true) : undefined}
      />

      <div className="mx-auto flex w-full max-w-[2011px] flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          {/* Toolbar row */}
          <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
            <HeaderMenu />
            <HeaderExportMenu />
            <HeaderSaveAsImageMenu />
            <ForkTreeDialog roadmapId={roadmapId} />
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Button
                variant={layout === 'page' ? 'solid' : 'outline'}
                size="sm"
                onClick={() => setLayout('page')}
              >
                <Map className="mr-1.5 h-4 w-4" />
                {VIEWER_MESSAGES.VIEW_CANVAS}
              </Button>
              <Button
                variant={layout === 'cards' ? 'solid' : 'outline'}
                size="sm"
                onClick={() => setLayout('cards')}
              >
                <LayoutGrid className="mr-1.5 h-4 w-4" />
                {VIEWER_MESSAGES.VIEW_CARDS}
              </Button>
              {!isSidebarOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label={VIEWER_MESSAGES.SIDEBAR_OPEN_BUTTON_LABEL}
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Main content */}
          {layout === 'cards' ? <CardListMode /> : <ViewerCanvas />}
        </div>

        <ViewerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          roadmapId={roadmapId}
        />
      </div>

      {layout === 'page' && <ViewerZoomControls />}

      {aiEnabled ? (
        <LearningCoachModal
          isOpen={isCoachOpen}
          onClose={() => setIsCoachOpen(false)}
          roadmapId={roadmapId}
        />
      ) : null}
    </div>
  );
}

export function RoadmapViewer({ roadmapId }: RoadmapViewerProps) {
  return (
    <ReactFlowProvider>
      <ViewerContent roadmapId={roadmapId} />
    </ReactFlowProvider>
  );
}
