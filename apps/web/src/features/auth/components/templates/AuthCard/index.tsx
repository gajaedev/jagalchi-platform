'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <Card
      className={cn(
        'border-border bg-card w-full gap-7 rounded-3xl p-6 shadow-sm sm:p-8',
        className,
      )}
    >
      <CardHeader className="gap-2 p-0">
        <CardTitle className="text-2xl font-extrabold tracking-tight">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm leading-6">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
      {footer && <CardFooter className="items-start justify-center p-0">{footer}</CardFooter>}
    </Card>
  );
}
