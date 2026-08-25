'use client';

import { Maximize, Minus, Plus } from 'lucide-react';

interface ZoomButtonGroupProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export function ZoomButtonGroup({ zoom, onZoomIn, onZoomOut, onFitView }: ZoomButtonGroupProps) {
  return (
    <div className="border-border bg-background flex h-9 items-center overflow-hidden rounded-lg border">
      {/* Fullscreen/FitView */}
      <button
        type="button"
        onClick={onFitView}
        className="border-border hover:bg-muted flex h-full w-9 items-center justify-center border-r transition-colors"
        aria-label="화면 맞춤"
      >
        <Maximize className="text-foreground h-4 w-4" />
      </button>

      {/* Zoom percentage */}
      <span className="border-border text-foreground flex h-full min-w-[52px] items-center justify-center border-r px-2 text-sm font-semibold">
        {Math.round(zoom * 100)}%
      </span>

      {/* +/- stacked */}
      <div className="flex h-full flex-col">
        <button
          type="button"
          onClick={onZoomIn}
          className="border-border hover:bg-muted flex h-1/2 w-9 items-center justify-center border-b transition-colors"
          aria-label="확대"
        >
          <Plus className="text-foreground h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="hover:bg-muted flex h-1/2 w-9 items-center justify-center transition-colors"
          aria-label="축소"
        >
          <Minus className="text-foreground h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
