import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, X } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface DocumentUploadStepProps {
  onNext: () => void;
  onPrevious: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

export function DocumentUploadStep({ onNext, onPrevious, onDataUpdate, data }: DocumentUploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAutoFillOption, setShowAutoFillOption] = useState(false);
  const [previousDocument, setPreviousDocument] = useState<any>(null);
  const [isUsingPreviousDocument, setIsUsingPreviousDocument] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Restore document state when navigating back
  useEffect(() => {
    if (data.document) {
      setIsUsingPreviousDocument(true);
      setPreviousDocument(data.document);
    }
  }, [data.document]);

  useEffect(() => {
    const checkForPreviousDocument = async () => {
      if (!user?.id || !data.project?.id) {
        return;
      }

      try {
        // Get the most recent document for user's projects
        const { data: documents, error } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && documents && documents.length > 0) {
          setPreviousDocument(documents[0]);
          setShowAutoFillOption(true);
        }
      } catch (error) {
        console.error('Error checking for previous document:', error);
      }
    };

    if (user && data.project) {
      const timeoutId = setTimeout(checkForPreviousDocument, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user, data.project]);

  const usePreviousDocument = () => {
    if (previousDocument) {
      setIsUsingPreviousDocument(true);
      setSelectedFile(null);
      setShowAutoFillOption(false);
      toast({
        title: "Previous document selected",
        description: "Using document from your last analysis.",
      });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setIsUsingPreviousDocument(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUsingPreviousDocument(false);
      
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

  const handleSubmit = async () => {
    if (!selectedFile && !isUsingPreviousDocument) {
      toast({
        variant: "destructive",
        title: "File required",
        description: "Please select a file to upload.",
      });
      return;
    }

    if (!user || !data.project) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Project information is missing.",
      });
      return;
    }

    setUploading(true);

    try {
      let document;

      if (isUsingPreviousDocument && previousDocument) {
        document = previousDocument;
        toast({
          title: "Using previous document",
          description: "Reusing document from your last analysis.",
        });
      } else {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/${data.project.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: newDocument, error: documentError } = await supabase
          .from('documents')
          .insert({
            project_id: data.project.id,
            user_id: user.id,
            filename: selectedFile.name,
            original_filename: selectedFile.name,
            content_type: selectedFile.type,
            file_size: selectedFile.size,
            storage_path: uploadData.path,
            upload_status: 'uploaded'
          })
          .select()
          .single();

        if (documentError) throw documentError;
        document = newDocument;
      }

      onDataUpdate({ document });

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
      {showAutoFillOption && previousDocument && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Use Previous Document</h3>
                <p className="text-sm text-muted-foreground">
                  Would you like to use the document from your last analysis?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last document: {previousDocument.original_filename}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAutoFillOption(false)}>
                  No, thanks
                </Button>
                <Button size="sm" onClick={usePreviousDocument}>
                  Use Previous Document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload Sustainability Framework Document *</CardTitle>
          <CardDescription>
            Upload your sustainability framework document (PDF, Word, Excel, or text file). Max size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFile && !isUsingPreviousDocument ? (
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {isUsingPreviousDocument ? previousDocument?.original_filename : selectedFile?.name}
                      </p>
                      {isUsingPreviousDocument && (
                        <Badge variant="secondary" className="text-xs">
                          From previous analysis
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {((isUsingPreviousDocument ? previousDocument?.file_size : selectedFile?.size) / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {isUsingPreviousDocument && (
                      <p className="text-xs text-muted-foreground">
                        This document will be reused from your previous analysis
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-6 flex gap-4">
            <Button onClick={onPrevious} variant="outline" className="flex-1" disabled={uploading}>
              Previous Step
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Continue to Next Step'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
