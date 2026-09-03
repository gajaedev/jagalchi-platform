'use client';

import { memo, useState } from 'react';

import { ExternalLink } from 'lucide-react';

import { runAiJob } from '@/api/ai-jobs';
import type { ResourceItem } from '@/api/ai-jobs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EDITOR_MESSAGES } from '@/constants/messages';
import { sanitizeUrl } from '@/lib/url-validation';

import { LoadingButton } from '../../atoms/LoadingButton';

interface ResourceRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeName?: string;
  onAddResource?: (url: string) => void;
}

export const ResourceRecommendationModal = memo(function ResourceRecommendationModal({
  isOpen,
  onClose,
  nodeName = '',
  onAddResource,
}: ResourceRecommendationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRecommend = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const query = nodeName || EDITOR_MESSAGES.DEFAULT_RESOURCE_QUERY;
      const response = await runAiJob('resource_recommendation', { query, top_k: 5 });
      setResources(response.items);
    } catch {
      setErrorMessage(EDITOR_MESSAGES.AI_RESOURCE_MODAL_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResources([]);
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{EDITOR_MESSAGES.AI_RESOURCE_MODAL_TITLE}</DialogTitle>
          <DialogDescription>
            {nodeName
              ? `"${nodeName}" ${EDITOR_MESSAGES.AI_RESOURCE_MODAL_SUBTITLE}`
              : EDITOR_MESSAGES.AI_RESOURCE_MODAL_SUBTITLE}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">
              {EDITOR_MESSAGES.AI_RESOURCE_MODAL_LOADING}
            </p>
          </div>
        )}

        {!isLoading && resources.length === 0 && !errorMessage && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <p className="text-muted-foreground text-sm">
              {EDITOR_MESSAGES.AI_RESOURCE_MODAL_EMPTY}
            </p>
            <LoadingButton onClick={handleRecommend} isLoading={isLoading}>
              {EDITOR_MESSAGES.AI_RESOURCE_MODAL_RECOMMEND_BUTTON}
            </LoadingButton>
          </div>
        )}

        {!isLoading && resources.length > 0 && (
          <>
            <ScrollArea className="max-h-[300px]">
              <div className="flex flex-col gap-3">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="border-border hover:bg-muted flex flex-col gap-1 rounded-md border p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={sanitizeUrl(resource.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-visible:ring-ring/40 flex items-center gap-2 rounded-sm focus-visible:ring-3 focus-visible:outline-none"
                      >
                        <h4 className="text-sm font-medium">{resource.title}</h4>
                        <ExternalLink className="text-muted-foreground h-3 w-3" />
                      </a>
                      {onAddResource && (
                        <Button
                          type="button"
                          variant="link"
                          size="xs"
                          onClick={() => onAddResource(resource.url)}
                        >
                          {EDITOR_MESSAGES.SIDEBAR_ADD_RESOURCE_BUTTON}
                        </Button>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">{resource.source}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button type="button" intent="neutral" variant="ghost" onClick={handleClose}>
                {EDITOR_MESSAGES.AI_RESOURCE_MODAL_CLOSE}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});
