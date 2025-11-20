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
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2">
            <Button disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Extracting...
            </Button>
            <Button 
              onClick={onCancel} 
              variant="destructive"
              size="sm"
              className="w-10 px-2"
            >
              X
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
