import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, X } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface UploadStepProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function UploadStep({ onNext, onDataUpdate, data }: UploadStepProps) {
  const [frameworkName, setFrameworkName] = useState('');
  const [version, setVersion] = useState('');
  const [publicationTime, setPublicationTime] = useState('');
  const [organization, setOrganization] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAutoFillOption, setShowAutoFillOption] = useState(false);
  const [previousAnalysisData, setPreviousAnalysisData] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Restore form state from parent data when navigating back
  useEffect(() => {
    if (data.project) {
      const description = data.project.description || '';
      const frameworkMatch = description.match(/Framework: ([^|]+)/);
      const versionMatch = description.match(/Version: ([^|]+)/);
      const publishedMatch = description.match(/Published: ([^|]+)/);
      const organizationMatch = description.match(/Organization: (.+)/);

      if (frameworkMatch) setFrameworkName(frameworkMatch[1].trim());
      if (versionMatch) setVersion(versionMatch[1].trim());
      if (publishedMatch) setPublicationTime(publishedMatch[1].trim());
      if (organizationMatch) setOrganization(organizationMatch[1].trim());
    }
  }, [data.project]);

  useEffect(() => {
    const checkForPreviousAnalysis = async () => {
      if (!user?.id) {
        console.log('No user found for auto-fill check');
        return;
      }

      try {
        console.log('Checking for previous analysis for user:', user.id);
        
        // Get the most recent project with analysis results
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching projects:', error);
          throw error;
        }

        console.log('Found projects:', projects);

        if (projects && projects.length > 0) {
          setPreviousAnalysisData(projects[0]);
          setShowAutoFillOption(true);
          console.log('Auto-fill option enabled');
        } else {
          console.log('No previous projects found');
        }
      } catch (error) {
        console.error('Error checking for previous analysis:', error);
      }
    };

    // Add a small delay to ensure user data is loaded
    if (user) {
      const timeoutId = setTimeout(checkForPreviousAnalysis, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  const fillFromLastAnalysis = () => {
    if (previousAnalysisData) {
      const description = previousAnalysisData.description || '';
      const frameworkMatch = description.match(/Framework: ([^|]+)/);
      const versionMatch = description.match(/Version: ([^|]+)/);
      const publishedMatch = description.match(/Published: ([^|]+)/);
      const organizationMatch = description.match(/Organization: (.+)/);

      if (frameworkMatch) setFrameworkName(frameworkMatch[1].trim());
      if (versionMatch) setVersion(versionMatch[1].trim());
      if (publishedMatch) setPublicationTime(publishedMatch[1].trim());
      if (organizationMatch) setOrganization(organizationMatch[1].trim());
    }
    setShowAutoFillOption(false);
    toast({
      title: "Form filled",
      description: "Previous analysis data has been loaded into the form.",
    });
  };

  const handleSubmit = async () => {
    if (!frameworkName.trim()) {
      toast({
        variant: "destructive",
        title: "Framework name required",
        description: "Please enter a framework name.",
      });
      return;
    }

    if (!version.trim()) {
      toast({
        variant: "destructive",
        title: "Version required",
        description: "Please enter a version.",
      });
      return;
    }

    if (!publicationTime.trim()) {
      toast({
        variant: "destructive",
        title: "Publication time required",
        description: "Please enter a publication time.",
      });
      return;
    }

    if (!organization.trim()) {
      toast({
        variant: "destructive",
        title: "Organization required",
        description: "Please enter a standard-setting organization.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to continue.",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: frameworkName,
          description: `Framework: ${frameworkName} | Version: ${version} | Published: ${publicationTime} | Organization: ${organization}`,
          user_id: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      onDataUpdate({ project });

      toast({
        title: "Success",
        description: "Framework information saved successfully.",
      });

      onNext();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: error.message || "There was an error saving your information.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {showAutoFillOption && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Use Previous Analysis Data</h3>
                <p className="text-sm text-muted-foreground">
                  Would you like to automatically fill the form with data from your last analysis?
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAutoFillOption(false)}>
                  No, thanks
                </Button>
                <Button size="sm" onClick={fillFromLastAnalysis}>
                  Auto-fill Form
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sustainability Framework</CardTitle>
          <CardDescription>
            Provide basic information of your sustainability framework
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="frameworkName">Name *</Label>
            <Input
              id="frameworkName"
              placeholder="e.g., FAST-Infra Label"
              value={frameworkName}
              onChange={(e) => setFrameworkName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="version">Version *</Label>
            <Input
              id="version"
              placeholder="e.g., 1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="publicationTime">Publication Time *</Label>
            <Input
              id="publicationTime"
              placeholder="e.g., November 2024"
              value={publicationTime}
              onChange={(e) => setPublicationTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="organization">Standard-Setting Organization *</Label>
            <Input
              id="organization"
              placeholder="e.g., Global Infrastructure Basel Foundation"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Continue to Next Step'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}