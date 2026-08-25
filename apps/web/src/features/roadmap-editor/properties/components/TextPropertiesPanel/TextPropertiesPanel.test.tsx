import { render, screen } from '@testing-library/react';
import { Provider } from 'jotai';
import { describe, expect, it } from 'vitest';

import { TextPropertiesPanel } from '.';

import type { JagalchiTextType } from '../../../types/editor.types';

const mockText: JagalchiTextType = {
  id: 'text-1',
  type: 'jagalchi-text',
  position: { x: 0, y: 0 },
  data: {
    content: 'Test Text Content',
    variant: 'black',
    fontSize: 16,
    fontWeight: 'normal',
    isLocked: false,
  },
};

const renderWithProvider = (text: JagalchiTextType) => {
  return render(
    <Provider>
      <TextPropertiesPanel node={text} />
    </Provider>,
  );
};

describe('TextPropertiesPanel', () => {
  it('renders text header with content', () => {
    renderWithProvider(mockText);
    expect(screen.getByText('Test Text Content')).toBeInTheDocument();
  });

  it('renders lock button', () => {
    renderWithProvider(mockText);
    expect(screen.getByRole('button', { name: /잠금/ })).toBeInTheDocument();
  });

  it('renders color selector', () => {
    renderWithProvider(mockText);
    expect(screen.getByText('기본 컬러')).toBeInTheDocument();
  });

  it('shows unlock icon when text is unlocked', () => {
    renderWithProvider(mockText);
    expect(screen.getByRole('button', { name: /잠금/ })).toBeInTheDocument();
  });

  it('shows lock icon when text is locked', () => {
    const lockedText = { ...mockText, data: { ...mockText.data, isLocked: true } };
    renderWithProvider(lockedText);
    expect(screen.getByRole('button', { name: /잠금 해제/ })).toBeInTheDocument();
  });
});
