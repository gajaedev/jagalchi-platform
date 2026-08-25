'use client';

import { useEffect } from 'react';

import { useAtomValue } from 'jotai';
import { Building2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';

import { Input } from '@/components/ui/input';

import { profileModeAtom } from '../../../stores/profile-atoms';

interface ProfileCustomOrganizationProps {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export function ProfileCustomOrganization({
  initialValue = '',
  onChange,
}: ProfileCustomOrganizationProps) {
  const mode = useAtomValue(profileModeAtom);

  const { control, getValues, register, reset } = useForm({
    defaultValues: {
      organization: initialValue,
    },
  });

  const value = useWatch({ control, name: 'organization' });

  // Update form when prop changes
  useEffect(() => {
    if (getValues('organization') === initialValue) return;
    reset({ organization: initialValue });
  }, [getValues, initialValue, reset]);

  // Notify parent of changes
  useEffect(() => {
    if (mode !== 'edit') return;
    if (value === initialValue) return;
    onChange?.(value);
  }, [initialValue, mode, value, onChange]);

  if (mode === 'edit') {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="relative">
          <Building2
            size={16}
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
          />
          <Input className="pl-9" placeholder="소속을 입력해주세요" {...register('organization')} />
        </div>
      </div>
    );
  }

  if (!value) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="border-border flex h-[54px] items-center gap-4 rounded-md border px-4">
        <Building2 size={16} className="text-muted-foreground" />
        <p className="text-foreground text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
