import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '@/components/ui/input';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Hello World',
    readOnly: true,
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'email@example.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Invalid input',
    'aria-invalid': true,
    validation: 'error',
  },
};

export const File: Story = {
  args: {
    type: 'file',
  },
};

export const SizeVariantStateMatrix: Story = {
  render: () => (
    <div className="bg-background grid w-[720px] grid-cols-3 gap-4 rounded-3xl p-6">
      {(['sm', 'md', 'lg'] as const).flatMap((inputSize) =>
        (['outline', 'filled', 'underlined'] as const).map((variant) => (
          <div key={`${inputSize}-${variant}`} className="space-y-2">
            <span className="text-muted-foreground text-xs">
              {inputSize} · {variant}
            </span>
            <Input inputSize={inputSize} variant={variant} placeholder="입력해 주세요" />
          </div>
        )),
      )}
      <Input validation="success" defaultValue="검증 성공" />
      <Input validation="error" defaultValue="검증 오류" />
      <Input disabled defaultValue="비활성화" />
    </div>
  ),
};
