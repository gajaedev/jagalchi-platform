import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

function DialogExample({
  size = 'default',
  showCloseButton = true,
}: {
  size?: 'sm' | 'default' | 'lg' | 'full';
  showCloseButton?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open {size} dialog</Button>
      </DialogTrigger>
      <DialogContent size={size} showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            Radix owns focus, Escape, open and close state; copy-owned primitives own appearance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input aria-label="Name" placeholder="Name" />
          <Input aria-label="Email" type="email" placeholder="email@example.com" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button intent="neutral" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  title: 'UI/Dialog',
  component: DialogExample,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DialogExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const Full: Story = { args: { size: 'full' } };
export const WithoutCloseButton: Story = { args: { showCloseButton: false } };

export const DestructiveAction: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button intent="destructive">Delete account</Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delete account?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button intent="neutral" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button intent="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const SizeMatrix: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(['sm', 'default', 'lg', 'full'] as const).map((size) => (
        <DialogExample key={size} size={size} />
      ))}
    </div>
  ),
};
