import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'Button' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = { args: { intent: 'destructive' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Secondary: Story = { args: { intent: 'neutral' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Link: Story = { args: { variant: 'link' } };
export const Ticket: Story = { args: { intent: 'ticket' } };
export const Success: Story = { args: { intent: 'success' } };
export const Warning: Story = { args: { intent: 'warning' } };
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const Icon: Story = { args: { children: '🔍', size: 'icon', 'aria-label': '검색' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, loadingLabel: '저장 중' } };
export const Pressed: Story = { args: { 'aria-pressed': true } };

const intents = [
  'primary',
  'neutral',
  'inverse',
  'ticket',
  'success',
  'warning',
  'destructive',
] as const;
const variants = ['solid', 'outline', 'ghost', 'link'] as const;

export const IntentAppearanceMatrix: Story = {
  render: () => (
    <div className="bg-background grid gap-3 rounded-3xl p-6">
      {intents.map((intent) => (
        <div key={intent} className="grid grid-cols-4 gap-3">
          {variants.map((variant) => (
            <Button key={variant} intent={intent} variant={variant}>
              {intent} · {variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};
