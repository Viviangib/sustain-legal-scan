import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ExtractionStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

interface ExtractionProgressCardProps {
  isMinimized: boolean;
  onMinimize: () => void;
  onCancel: () => void;
  progress: number;
  elapsedSeconds: number;
  steps: ExtractionStep[];
}

export function ExtractionProgressCard({
  isMinimized,
  onMinimize,
  onCancel,
  progress,
  elapsedSeconds,
  steps
}: ExtractionProgressCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm">
            Extracting… {progress > 0 ? `${progress}%` : ''} • {formatTime(elapsedSeconds)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onMinimize} variant="ghost" size="sm">
            Show details
          </Button>
          <Button onClick={onCancel} variant="ghost" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Extracting indicators…</CardTitle>
            <CardDescription>
              May take 1–5 minutes. Preview appears below.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onMinimize} variant="ghost" size="sm">
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button onClick={onCancel} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <Badge
              key={step.id}
              variant={
                step.status === 'done'
                  ? 'default'
                  : step.status === 'running'
                  ? 'secondary'
                  : step.status === 'error'
                  ? 'destructive'
                  : 'outline'
              }
            >
              {step.label}
            </Badge>
          ))}
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress > 0 ? `${progress}%` : 'Processing…'}</span>
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
