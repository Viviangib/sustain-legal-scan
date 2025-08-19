import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Plus,
  TrendingUp,
  Shield,
  FileCheck
} from 'lucide-react';

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome to Sustainability Benchmarking</h1>
        <p className="text-muted-foreground mb-4">
          Analyze and benchmark your sustainability frameworks against legal requirements with AI-powered insights.
        </p>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Start New Analysis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No projects yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Analyses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ready to start analyzing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Compliance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-%</div>
            <p className="text-xs text-muted-foreground">Start analyzing to see scores</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your latest sustainability framework analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects yet</p>
              <p className="text-sm">Create your first project to get started</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Upload Framework Document
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Browse Legal Frameworks
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Legal Frameworks Available */}
      <Card>
        <CardHeader>
          <CardTitle>Available Legal Frameworks</CardTitle>
          <CardDescription>
            Reference frameworks available for benchmarking your sustainability documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">EU Taxonomy Regulation</h4>
              <p className="text-sm text-muted-foreground">European Union environmental classification</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  Environmental
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">TCFD Framework</h4>
              <p className="text-sm text-muted-foreground">Climate-related financial risk disclosures</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-1 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                  Climate
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">GRI Standards</h4>
              <p className="text-sm text-muted-foreground">Global sustainability reporting standards</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/20">
                  Reporting
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}