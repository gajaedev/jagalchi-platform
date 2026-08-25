import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uploadAttachment } from '@/api/upload';

import { NodePropertiesPanel } from '.';

import { nodesAtom } from '../../../stores/editor-atoms';

import type { JagalchiNodeType } from '../../../types/editor.types';

vi.mock('@/api/upload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/upload')>();
  return {
    ...actual,
    uploadAttachment: vi.fn(),
  };
});

const mockNode: JagalchiNodeType = {
  id: 'node-1',
  type: 'jagalchi-node',
  position: { x: 0, y: 0 },
  data: {
    label: 'Test Node',
    description: 'Test Description',
    variant: 'blue',
    isLocked: false,
    resources: ['https://example.com', '', ''],
  },
};

const renderWithProvider = (node: JagalchiNodeType) => {
  const store = createStore();
  store.set(nodesAtom, [node]);

  return {
    store,
    ...render(
      <Provider store={store}>
        <NodePropertiesPanel node={node} />
      </Provider>,
    ),
  };
};

describe('NodePropertiesPanel', () => {
  beforeEach(() => {
    vi.mocked(uploadAttachment).mockReset();
  });

  it('renders node header with label', () => {
    renderWithProvider(mockNode);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('renders lock button', () => {
    renderWithProvider(mockNode);
    expect(screen.getByRole('button', { name: /잠금/ })).toBeInTheDocument();
  });

  it('renders node name input', () => {
    renderWithProvider(mockNode);
    expect(screen.getByDisplayValue('Test Node')).toBeInTheDocument();
  });

  it('renders node description textarea', () => {
    renderWithProvider(mockNode);
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('renders AI generation text indicator', () => {
    renderWithProvider(mockNode);
    expect(screen.getByText('AI 생성')).toBeInTheDocument();
  });

  it('renders 3 resource input fields', () => {
    renderWithProvider(mockNode);
    const resourceInputs = screen.getAllByPlaceholderText('URL을 입력하세요');
    expect(resourceInputs).toHaveLength(3);
  });

  it('renders AI recommendation text indicator', () => {
    renderWithProvider(mockNode);
    expect(screen.getByText('AI 추천')).toBeInTheDocument();
  });

  it('renders attachment upload button', () => {
    renderWithProvider(mockNode);
    expect(screen.getByRole('button', { name: '파일 첨부' })).toBeInTheDocument();
  });

  it('disables inputs when node is locked', () => {
    const lockedNode = { ...mockNode, data: { ...mockNode.data, isLocked: true } };
    renderWithProvider(lockedNode);

    const nameInput = screen.getByDisplayValue('Test Node');
    expect(nameInput).toBeDisabled();

    const descriptionInput = screen.getByDisplayValue('Test Description');
    expect(descriptionInput).toBeDisabled();
  });

  it('allows user to interact with name input when unlocked', async () => {
    const user = userEvent.setup();
    renderWithProvider(mockNode);

    const nameInput = screen.getByDisplayValue('Test Node');
    expect(nameInput).not.toBeDisabled();

    // Verify input can receive focus
    await user.click(nameInput);
    expect(nameInput).toHaveFocus();
  });

  it('shows unlock icon when node is unlocked', () => {
    renderWithProvider(mockNode);
    expect(screen.getByRole('button', { name: /잠금/ })).toBeInTheDocument();
  });

  it('shows lock icon when node is locked', () => {
    const lockedNode = { ...mockNode, data: { ...mockNode.data, isLocked: true } };
    renderWithProvider(lockedNode);
    expect(screen.getByRole('button', { name: /잠금 해제/ })).toBeInTheDocument();
  });

  it('uploads an attachment into the first empty resource slot', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadAttachment).mockImplementation(async (file, options) => {
      options?.onProgress?.(100);
      return {
        url: 'https://cdn.jagalchi.dev/uploads/e2e/lesson.pdf',
        filename: file.name,
        contentType: file.type,
        size: file.size,
        thumbnailUrl: null,
      };
    });

    const { container, store } = renderWithProvider(mockNode);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input!, new File(['lesson'], 'lesson.pdf', { type: 'application/pdf' }));

    expect(uploadAttachment).toHaveBeenCalledOnce();
    expect(store.get(nodesAtom)[0]?.data.resources).toEqual([
      'https://example.com',
      'https://cdn.jagalchi.dev/uploads/e2e/lesson.pdf',
      '',
    ]);
  });

  it('shows validation error for unsupported attachment files', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = renderWithProvider(mockNode);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input!, new File(['html'], 'bad.html', { type: 'text/html' }));

    expect(uploadAttachment).not.toHaveBeenCalled();
    expect(
      screen.getByText('이미지, PDF, 텍스트 파일만 업로드할 수 있습니다.'),
    ).toBeInTheDocument();
  });
});
