-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage policies for document uploads
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Populate legal frameworks
INSERT INTO legal_frameworks (name, description, category, jurisdiction, effective_date, version) VALUES
('CS3D', 'Corporate Sustainability Due Diligence Directive', 'Due Diligence', 'EU', '2024-07-15', '1.0'),
('EUDR', 'EU Deforestation Regulation', 'Environmental', 'EU', '2023-06-29', '1.0'),
('CSRD', 'Corporate Sustainability Reporting Directive', 'Reporting', 'EU', '2023-01-05', '1.0'),
('SFDR', 'Sustainable Finance Disclosure Regulation', 'Finance', 'EU', '2021-03-10', '1.0');