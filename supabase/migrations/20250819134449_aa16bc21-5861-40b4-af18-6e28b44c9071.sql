-- Create user profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create legal frameworks reference table
CREATE TABLE public.legal_frameworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  jurisdiction TEXT,
  category TEXT,
  version TEXT,
  effective_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table for analysis sessions
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  legal_framework_id UUID REFERENCES public.legal_frameworks(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create documents table for uploaded files metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'processed', 'failed')),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analysis results table for benchmarking outputs
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'benchmarking',
  input_parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  compliance_score DECIMAL(5,2),
  recommendations TEXT,
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_model_used TEXT,
  processing_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for legal frameworks (public read access)
CREATE POLICY "Anyone can view legal frameworks" 
ON public.legal_frameworks FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage legal frameworks" 
ON public.legal_frameworks FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own projects" 
ON public.projects FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" 
ON public.projects FOR DELETE 
USING (user_id = auth.uid());

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own documents" 
ON public.documents FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents" 
ON public.documents FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" 
ON public.documents FOR DELETE 
USING (user_id = auth.uid());

-- Create RLS policies for analysis results
CREATE POLICY "Users can view their own analysis results" 
ON public.analysis_results FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own analysis results" 
ON public.analysis_results FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own analysis results" 
ON public.analysis_results FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own analysis results" 
ON public.analysis_results FOR DELETE 
USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_frameworks_updated_at
  BEFORE UPDATE ON public.legal_frameworks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at
  BEFORE UPDATE ON public.analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_analysis_results_project_id ON public.analysis_results(project_id);
CREATE INDEX idx_analysis_results_user_id ON public.analysis_results(user_id);
CREATE INDEX idx_legal_frameworks_is_active ON public.legal_frameworks(is_active);

-- Insert some default legal frameworks
INSERT INTO public.legal_frameworks (name, description, jurisdiction, category, version, effective_date) VALUES
('EU Taxonomy Regulation', 'European Union classification system for environmentally sustainable economic activities', 'European Union', 'Environmental', '2021', '2021-07-12'),
('Corporate Sustainability Reporting Directive (CSRD)', 'EU directive on corporate sustainability reporting', 'European Union', 'Reporting', '2022', '2023-01-05'),
('Task Force on Climate-related Financial Disclosures (TCFD)', 'Framework for climate-related financial risk disclosures', 'Global', 'Climate', '2017', '2017-06-29'),
('Global Reporting Initiative (GRI)', 'International standards for sustainability reporting', 'Global', 'Reporting', 'GRI Standards', '2016-10-19'),
('Sustainability Accounting Standards Board (SASB)', 'Industry-specific sustainability accounting standards', 'Global', 'Accounting', '2018', '2018-11-01'),
('Science Based Targets initiative (SBTi)', 'Framework for setting emission reduction targets', 'Global', 'Climate', '2.0', '2021-10-01');