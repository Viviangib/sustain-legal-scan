import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ExtractionProgressCardProps {
  onCancel: () => void;
}

export function ExtractionProgressCard({
  onCancel
}: ExtractionProgressCardProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-sm font-medium">Processing your documents</span>
        </div>
        
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
}
