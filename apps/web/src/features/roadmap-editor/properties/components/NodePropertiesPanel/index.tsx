'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Upload, X } from 'lucide-react';

import { runAiJob } from '@/api/ai-jobs';
import {
  ATTACHMENT_UPLOAD_CONSTRAINTS,
  AttachmentUploadError,
  validateAttachmentFile,
} from '@/api/upload';
import type { AttachmentUploadErrorCode } from '@/api/upload';
import { uploadRoadmapAttachment } from '@/api/uploads';
import { Button } from '@/components/ui/button';
import { EDITOR_MESSAGES } from '@/constants/messages';

import { LoadingButton } from '../../../components/atoms/LoadingButton';
import { ResourceRecommendationModal } from '../../../components/organisms/ResourceRecommendationModal';
import { NODE_PRESET_COLORS } from '../../../constants/preset-colors';
import { useUpdateNode } from '../../../hooks/use-update-node';
import { validateUrl } from '../../../utils/url-validation';
import { ColorSelector } from '../ColorSelector';
import { EditorInput } from '../EditorInput';
import { PanelHeader } from '../PanelHeader';

import type { JagalchiNodeType, NodeColorVariant } from '../../../types/editor.types';

interface NodePropertiesPanelProps {
  node: JagalchiNodeType;
  roadmapId: string;
}

/**
 * Node 선택 시 표시되는 속성 패널
 *
 * Figma 디자인 기반 구조:
 * - Header: "Node_1" + Lock 버튼
 * - 노드 이름: EditorInput
 * - 노드 설명: EditorInput (multiline)
 * - AI 생성: LoadingButton
 * - 기본 컬러: ColorSelector
 * - 첨부자료: EditorInput 3개 + 파일 첨부 + "AI 추천" LoadingButton
 */
export const NodePropertiesPanel = memo(function NodePropertiesPanel({
  node,
  roadmapId,
}: NodePropertiesPanelProps) {
  const { updateNode } = useUpdateNode(node.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const [isDescLoading, setIsDescLoading] = useState(false);
  const [descError, setDescError] = useState('');
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentUploadProgress, setAttachmentUploadProgress] = useState(0);
  const [attachmentUploadError, setAttachmentUploadError] = useState('');

  useEffect(() => {
    return () => {
      uploadControllerRef.current?.abort();
    };
  }, []);

  const toggleLock = useCallback(() => {
    updateNode({ isLocked: !node.data.isLocked });
  }, [updateNode, node.data.isLocked]);

  const handleResourceChange = useCallback(
    (index: number, value: string) => {
      const newResources = [...node.data.resources];
      newResources[index] = value;
      updateNode({ resources: newResources });
    },
    [node.data.resources, updateNode],
  );

  const handleResourceBlur = useCallback(
    (index: number) => {
      const raw = node.data.resources[index];
      if (!raw) return;
      const validated = validateUrl(raw);
      const newResources = [...node.data.resources];
      newResources[index] = validated ?? '';
      updateNode({ resources: newResources });
    },
    [node.data.resources, updateNode],
  );

  const handleGenerateDescription = useCallback(async () => {
    if (!node.data.label) return;
    setIsDescLoading(true);
    setDescError('');
    try {
      const response = await runAiJob('node_explanation', { node_title: node.data.label });
      updateNode({ description: response.description });
    } catch {
      setDescError(EDITOR_MESSAGES.AI_DESC_ERROR);
    } finally {
      setIsDescLoading(false);
    }
  }, [node.data.label, updateNode]);

  const handleAddResource = useCallback(
    (url: string) => {
      const emptyIndex = node.data.resources.findIndex((r) => !r);
      if (emptyIndex !== -1) {
        handleResourceChange(emptyIndex, url);
      }
    },
    [node.data.resources, handleResourceChange],
  );

  const getAttachmentUploadErrorMessage = useCallback((code: AttachmentUploadErrorCode) => {
    switch (code) {
      case 'EMPTY_FILE':
        return EDITOR_MESSAGES.ATTACHMENT_UPLOAD_ERROR_EMPTY;
      case 'UNSUPPORTED_TYPE':
        return EDITOR_MESSAGES.ATTACHMENT_UPLOAD_ERROR_TYPE;
      case 'FILE_TOO_LARGE':
        return EDITOR_MESSAGES.ATTACHMENT_UPLOAD_ERROR_SIZE;
      case 'ABORTED':
        return '';
      case 'UPLOAD_FAILED':
      default:
        return EDITOR_MESSAGES.ATTACHMENT_UPLOAD_ERROR_FAILED;
    }
  }, []);

  const handleAttachmentUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCancelAttachmentUpload = useCallback(() => {
    uploadControllerRef.current?.abort();
  }, []);

  const handleAttachmentFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const emptyIndex = node.data.resources.findIndex((resource) => !resource);
      if (emptyIndex === -1) {
        setAttachmentUploadError(EDITOR_MESSAGES.ATTACHMENT_UPLOAD_ERROR_FULL);
        return;
      }

      const validationError = validateAttachmentFile(file);
      if (validationError) {
        setAttachmentUploadError(getAttachmentUploadErrorMessage(validationError));
        return;
      }

      const controller = new AbortController();
      uploadControllerRef.current = controller;
      setIsUploadingAttachment(true);
      setAttachmentUploadProgress(0);
      setAttachmentUploadError('');

      try {
        const response = await uploadRoadmapAttachment(file, roadmapId, {
          signal: controller.signal,
          onProgress: setAttachmentUploadProgress,
        });
        handleResourceChange(emptyIndex, response.resourceUrl);
      } catch (error) {
        if (error instanceof AttachmentUploadError) {
          setAttachmentUploadError(getAttachmentUploadErrorMessage(error.code));
        } else {
          setAttachmentUploadError(EDITOR_MESSAGES.ATTACHMENT_UPLOAD_ERROR_FAILED);
        }
      } finally {
        if (uploadControllerRef.current === controller) {
          uploadControllerRef.current = null;
        }
        setIsUploadingAttachment(false);
      }
    },
    [getAttachmentUploadErrorMessage, handleResourceChange, node.data.resources, roadmapId],
  );

  // Ensure we have exactly 3 resource slots
  const resources = [...node.data.resources];
  while (resources.length < 3) {
    resources.push('');
  }

  return (
    <div className="flex h-full w-full flex-col">
      <PanelHeader
        title={node.data.label}
        subtitle={EDITOR_MESSAGES.NODE_SUBTITLE}
        isLocked={node.data.isLocked}
        onToggleLock={toggleLock}
      />

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* 노드 이름 */}
        <EditorInput
          label={EDITOR_MESSAGES.SIDEBAR_NODE_NAME_LABEL}
          value={node.data.label}
          onChange={(value) => updateNode({ label: value })}
          placeholder={EDITOR_MESSAGES.NODE_NAME_PLACEHOLDER}
          isDisabled={node.data.isLocked}
        />

        {/* 노드 설명 */}
        <EditorInput
          label={EDITOR_MESSAGES.SIDEBAR_NODE_DESC_LABEL}
          value={node.data.description}
          onChange={(value) => updateNode({ description: value })}
          placeholder={EDITOR_MESSAGES.NODE_DESC_PLACEHOLDER}
          isMultiline
          isDisabled={node.data.isLocked || isDescLoading}
        />
        {descError && <p className="text-destructive text-xs">{descError}</p>}
        <div className="flex justify-end">
          <LoadingButton
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-auto p-0 text-sm font-medium hover:bg-transparent hover:underline"
            isLoading={isDescLoading}
            onClick={handleGenerateDescription}
            disabled={node.data.isLocked || !node.data.label}
          >
            {isDescLoading ? EDITOR_MESSAGES.AI_DESC_LOADING : EDITOR_MESSAGES.AI_DESC_BUTTON}
          </LoadingButton>
        </div>

        {/* 기본 컬러 */}
        <ColorSelector
          type="node"
          nodeId={node.id}
          currentVariant={node.data.variant}
          presets={NODE_PRESET_COLORS}
          onPresetSelect={(variant) => updateNode({ variant: variant as NodeColorVariant })}
        />

        {/* 첨부자료 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-foreground text-sm font-medium">
              {EDITOR_MESSAGES.SIDEBAR_RESOURCES_LABEL}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={EDITOR_MESSAGES.ATTACHMENT_UPLOAD_BUTTON}
              onClick={handleAttachmentUploadClick}
              disabled={node.data.isLocked || isUploadingAttachment}
            >
              <Upload className="size-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ATTACHMENT_UPLOAD_CONSTRAINTS.accept}
              onChange={handleAttachmentFileChange}
            />
          </div>
          <div className="space-y-2">
            {resources.slice(0, 3).map((resource: string, index: number) => (
              <EditorInput
                key={index}
                value={resource}
                onChange={(value) => handleResourceChange(index, value)}
                onBlur={() => handleResourceBlur(index)}
                placeholder={EDITOR_MESSAGES.RESOURCE_URL_PLACEHOLDER}
                isDisabled={node.data.isLocked}
              />
            ))}
          </div>
          {isUploadingAttachment && (
            <div className="flex items-center gap-2">
              <div className="bg-muted h-1.5 flex-1 rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-[width]"
                  style={{ width: `${attachmentUploadProgress}%` }}
                />
              </div>
              <span className="text-muted-foreground w-9 text-right text-xs">
                {attachmentUploadProgress}%
              </span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={EDITOR_MESSAGES.ATTACHMENT_UPLOAD_CANCEL}
                onClick={handleCancelAttachmentUpload}
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          {attachmentUploadError && (
            <p className="text-destructive text-xs">{attachmentUploadError}</p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-muted-foreground text-sm font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setIsResourceModalOpen(true)}
              disabled={node.data.isLocked}
            >
              {EDITOR_MESSAGES.AI_RECOMMEND_BUTTON}
            </button>
          </div>
        </div>
      </div>

      <ResourceRecommendationModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        nodeName={node.data.label}
        onAddResource={handleAddResource}
      />
    </div>
  );
});
