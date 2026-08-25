'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';
import { useAtomValue } from 'jotai';

import { viewerZoomLevelAtom } from '../../stores/viewer-atoms';
import { ZoomButtonGroup } from '../ZoomButtonGroup';

export function ViewerZoomControls() {
  const zoomLevel = useAtomValue(viewerZoomLevelAtom);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView();
  }, [fitView]);

  return (
    <ZoomButtonGroup
      zoom={zoomLevel}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onFitView={handleFitView}
    />
  );
}
