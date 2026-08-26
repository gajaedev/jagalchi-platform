import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddRoadmapModal } from './AddRoadmapModal';

describe('AddRoadmapModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<AddRoadmapModal {...defaultProps} />);
    expect(screen.getByText('실행 과제 추가')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('만들 결과물을 입력하세요')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<AddRoadmapModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('실행 과제 추가')).not.toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(<AddRoadmapModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('만들 결과물을 입력하세요') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Roadmap' } });
    expect(input.value).toBe('New Roadmap');
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<AddRoadmapModal {...defaultProps} />);
    fireEvent.click(screen.getByText('취소'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onConfirm with input value when confirm button is clicked', () => {
    render(<AddRoadmapModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('만들 결과물을 입력하세요');
    fireEvent.change(input, { target: { value: 'Test Roadmap' } });
    fireEvent.click(screen.getByText('확인'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('Test Roadmap', null);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('opens SelectLocationModal when completion settings are clicked', () => {
    render(<AddRoadmapModal {...defaultProps} />);

    // Initially, SelectLocationModal content should not be visible
    expect(screen.queryByText('위치선택')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('완료 조건 설정하기'));

    // Now, SelectLocationModal content should be visible
    expect(screen.getByText('위치선택')).toBeInTheDocument();
  });
});
