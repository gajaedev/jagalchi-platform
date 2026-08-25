import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '@/components/ui/badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Primary: Story = { args: { intent: 'primary' } };
export const Ticket: Story = { args: { intent: 'ticket' } };
export const Success: Story = { args: { intent: 'success' } };
export const Warning: Story = { args: { intent: 'warning' } };
export const Destructive: Story = { args: { intent: 'destructive' } };
export const Solid: Story = { args: { intent: 'primary', variant: 'solid' } };
export const Outline: Story = { args: { intent: 'primary', variant: 'outline' } };
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const AsLink: Story = {
  args: { asChild: true, children: <a href="#badge-target">Badge link</a> },
};

const intents = ['neutral', 'primary', 'ticket', 'success', 'warning', 'destructive'] as const;
const variants = ['solid', 'subtle', 'outline'] as const;

export const IntentAppearanceMatrix: Story = {
  render: () => (
    <div className="bg-background grid gap-3 rounded-3xl p-6">
      {intents.map((intent) => (
        <div key={intent} className="flex items-center gap-3">
          {variants.map((variant) => (
            <Badge key={variant} intent={intent} variant={variant}>
              {intent} · {variant}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};
