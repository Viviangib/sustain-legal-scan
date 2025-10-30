import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, X, Plus, CheckCircle } from 'lucide-react';
import { AnalysisData } from '@/pages/Analysis';

interface UploadSupportingDocumentsStepProps {
  onNext: () => void;
  onPrevious?: () => void;
  onDataUpdate: (data: Partial<AnalysisData>) => void;
  data: AnalysisData;
}

interface SupportingDocument {
  id?: string;
  file: File;
  description: string;
  uploading?: boolean;
  uploaded?: boolean;
}

export function UploadSupportingDocumentsStep({ onNext, onPrevious, onDataUpdate, data }: UploadSupportingDocumentsStepProps) {
  const [supportingDocuments, setSupportingDocuments] = useState<SupportingDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Restore supporting documents when navigating back
  useEffect(() => {
    if (data.supportingDocuments && data.supportingDocuments.length > 0) {
      // Convert stored documents back to the format expected by the component
      const restoredDocs: SupportingDocument[] = data.supportingDocuments.map(doc => ({
        id: doc.id,
        file: null as any, // We can't restore the File object, but mark as uploaded
        description: doc.metadata?.description || '',
        uploaded: true,
      }));
      setSupportingDocuments(restoredDocs);
    }
  }, [data.supportingDocuments]);

  const addDocument = () => {
    setSupportingDocuments(prev => [...prev, { file: null as any, description: '' }]);
  };

  const removeDocument = (index: number) => {
    setSupportingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
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

      setSupportingDocuments(prev => prev.map((doc, i) => 
        i === index ? { ...doc, file } : doc
      ));
    }
  };

  const updateDescription = (index: number, description: string) => {
    setSupportingDocuments(prev => prev.map((doc, i) => 
      i === index ? { ...doc, description } : doc
    ));
  };

  const handleSubmit = async () => {
    if (!user || !data.project) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Project information is missing.",
      });
      return;
    }

    // Filter out documents without files
    const validDocuments = supportingDocuments.filter(doc => doc.file);

    setUploading(true);

    try {
      const uploadedDocuments = [];

      for (const doc of validDocuments) {
        // Upload file to storage
        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${user.id}/${data.project.id}/supporting/${Date.now()}-${doc.file.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, doc.file);

        if (uploadError) throw uploadError;

        // Create document record
        const { data: document, error: documentError } = await supabase
          .from('documents')
          .insert({
            project_id: data.project.id,
            user_id: user.id,
            filename: doc.file.name,
            original_filename: doc.file.name,
            content_type: doc.file.type,
            file_size: doc.file.size,
            storage_path: uploadData.path,
            upload_status: 'uploaded',
            metadata: { 
              type: 'supporting_document',
              description: doc.description || 'Supporting document'
            }
          })
          .select()
          .single();

        if (documentError) throw documentError;
        uploadedDocuments.push(document);
      }

      // Update analysis data
      onDataUpdate({ supportingDocuments: uploadedDocuments });

      toast({
        title: "Upload successful",
        description: `${uploadedDocuments.length} supporting document(s) uploaded successfully.`,
      });

      onNext();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "There was an error uploading your files.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onDataUpdate({ supportingDocuments: [] });
    onNext();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Supporting Documents</CardTitle>
          <CardDescription>
            Provide additional context and background documents to enhance the knowledge base for your sustainability framework analysis. These documents will help provide more comprehensive insights during the AI analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supportingDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No supporting documents added yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add documents that provide context for your sustainability framework
                </p>
                <Button onClick={addDocument} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {supportingDocuments.map((doc, index) => (
                  <Card key={index} className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Supporting Document {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div>
                          <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                          <Input
                            id={`description-${index}`}
                            placeholder="e.g., Policy guidelines, Best practices document, Compliance checklist"
                            value={doc.description}
                            onChange={(e) => updateDescription(index, e.target.value)}
                          />
                        </div>

                        {!doc.file ? (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium mb-1">Choose a file to upload</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              PDF, Word, Excel, or text files up to 10MB
                            </p>
                            <Input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                              onChange={(e) => handleFileSelect(index, e)}
                              className="hidden"
                              id={`fileInput-${index}`}
                            />
                            <Label htmlFor={`fileInput-${index}`}>
                              <Button variant="outline" size="sm" asChild>
                                <span>Select File</span>
                              </Button>
                            </Label>
                          </div>
                        ) : (
                          <div className="border rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-6 w-6 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{doc.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              {doc.uploaded && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button onClick={addDocument} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Document
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {onPrevious && (
              <Button 
                onClick={onPrevious} 
                variant="outline" 
                className="flex-1"
                disabled={uploading}
              >
                Previous Step
              </Button>
            )}
            <Button 
              onClick={handleSkip} 
              variant="outline" 
              className="flex-1"
              disabled={uploading}
            >
              Skip This Step
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={uploading || supportingDocuments.filter(doc => doc.file).length === 0}
            >
              {uploading ? 'Uploading...' : 'Continue to Next Step'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            You can skip this step if you don't have additional supporting documents
          </p>
        </CardContent>
      </Card>
    </div>
  );
}