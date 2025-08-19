import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, X } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface UploadStepProps {
  onNext: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
}

export function UploadStep({ onNext, onDataUpdate }: UploadStepProps) {
  const [frameworkName, setFrameworkName] = useState('');
  const [version, setVersion] = useState('');
  const [publicationTime, setPublicationTime] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF, Word document, Excel file, or text file.",
        });
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
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

    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Please select a file to upload.",
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

    setUploading(true);

    try {
      // Create project
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

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${project.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .insert({
          project_id: project.id,
          user_id: user.id,
          filename: selectedFile.name,
          original_filename: selectedFile.name,
          content_type: selectedFile.type,
          file_size: selectedFile.size,
          storage_path: uploadData.path,
          upload_status: 'completed'
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Update analysis data
      onDataUpdate({ project, document });

      toast({
        title: "Upload successful",
        description: "Your document has been uploaded successfully.",
      });

      onNext();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "There was an error uploading your file.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
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
        <CardHeader>
          <CardTitle>Upload Sustainability Framework Document</CardTitle>
          <CardDescription>
            Upload your sustainability framework document (PDF, Word, Excel, or text file). Max size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFile ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Choose a file to upload</p>
              <p className="text-sm text-muted-foreground mb-4">
                PDF, Word, Excel, or text files up to 10MB
              </p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="fileInput"
              />
              <Label htmlFor="fileInput">
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
              </Label>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Continue to Next Step'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}