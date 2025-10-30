import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Settings, 
  BarChart3, 
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { UploadStep } from '@/components/analysis/UploadStep';
import { DocumentUploadStep } from '@/components/analysis/DocumentUploadStep';
import { UploadSupportingDocumentsStep } from '@/components/analysis/UploadSupportingDocumentsStep';
import { FrameworkStep } from '@/components/analysis/FrameworkStep';
import { AnalysisStep } from '@/components/analysis/AnalysisStep';
import { ResultsStep } from '@/components/analysis/ResultsStep';
import { Link } from 'react-router-dom';

export type AnalysisData = {
  project: any;
  document: any;
  supportingDocuments: any[];
  legalFramework: any;
  analysisResults: any;
};

const steps = [
  { id: 1, name: 'Primary Information', icon: Upload, status: 'current' },
  { id: 2, name: 'Sustainability Framework', icon: FileText, status: 'upcoming' },
  { id: 3, name: 'Supporting Documents', icon: FileText, status: 'upcoming' },
  { id: 4, name: 'Legal Framework', icon: Settings, status: 'upcoming' },
  { id: 5, name: 'AI Analysis', icon: BarChart3, status: 'upcoming' },
  { id: 6, name: 'View Results', icon: Download, status: 'upcoming' },
];

const Analysis = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    project: null,
    document: null,
    supportingDocuments: [],
    legalFramework: null,
    analysisResults: null,
  });

  const updateAnalysisData = (data: Partial<AnalysisData>) => {
    setAnalysisData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startNewAnalysis = () => {
    setCurrentStep(1);
    setAnalysisData({
      project: null,
      document: null,
      supportingDocuments: [],
      legalFramework: null,
      analysisResults: null,
    });
  };

  const selectAnotherFramework = () => {
    setCurrentStep(4);
    setAnalysisData(prev => ({
      ...prev,
      legalFramework: null,
      analysisResults: null,
    }));
  };

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'complete';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (step: any, status: string) => {
    const Icon = step.icon;
    if (status === 'complete') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (status === 'current') {
      return <Clock className="h-5 w-5 text-primary" />;
    }
    return <Icon className="h-5 w-5 text-muted-foreground" />;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <UploadStep onNext={nextStep} onDataUpdate={updateAnalysisData} data={analysisData} />;
      case 2:
        return <DocumentUploadStep onNext={nextStep} onPrevious={previousStep} onDataUpdate={updateAnalysisData} data={analysisData} />;
      case 3:
        return <UploadSupportingDocumentsStep onNext={nextStep} onPrevious={previousStep} onDataUpdate={updateAnalysisData} data={analysisData} />;
      case 4:
        return <FrameworkStep onNext={nextStep} onPrevious={previousStep} onDataUpdate={updateAnalysisData} />;
      case 5:
        return <AnalysisStep onNext={nextStep} onPrevious={previousStep} onDataUpdate={updateAnalysisData} data={analysisData} />;
      case 6:
        return <ResultsStep data={analysisData} onStartNew={startNewAnalysis} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
            <CardDescription>Follow the steps below to complete your analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      status === 'complete' ? 'bg-green-100 border-green-600' :
                      status === 'current' ? 'bg-primary/10 border-primary' :
                      'bg-muted border-muted-foreground'
                    }`}>
                      {getStepIcon(step, status)}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-medium ${
                        status === 'complete' ? 'text-green-600' :
                        status === 'current' ? 'text-primary' :
                        'text-muted-foreground'
                      }`}>
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                        status === 'complete' ? 'bg-green-600' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.name}
            </p>
          </CardContent>
        </Card>

        {/* Step Content */}
        {renderStepContent()}
      </main>
    </div>
  );
};

export default Analysis;