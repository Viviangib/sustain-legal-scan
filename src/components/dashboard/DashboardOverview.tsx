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
        <Button onClick={() => console.log('Starting new analysis...')}>
          <Plus className="mr-2 h-4 w-4" />
          Start New Analysis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No analyses yet</p>
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
            <p className="text-xs text-muted-foreground">No active analyses</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
          <CardDescription>Your latest sustainability framework analyses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No analyses yet</p>
            <p className="text-sm">Create your first analysis to get started</p>
          </div>
        </CardContent>
      </Card>

      {/* Legal Frameworks Available */}
      <Card>
        <CardHeader>
          <CardTitle>Available Legal Frameworks</CardTitle>
          <CardDescription>
            Reference frameworks available for benchmarking your sustainability documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">CS3D</h4>
              <p className="text-sm text-muted-foreground">Corporate Sustainability Due Diligence Directive</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  Due Diligence
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">EUDR</h4>
              <p className="text-sm text-muted-foreground">EU Deforestation Regulation</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-accent/50 px-2 py-1 text-xs font-medium text-accent-foreground ring-1 ring-inset ring-accent/20">
                  Environmental
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">CSRD</h4>
              <p className="text-sm text-muted-foreground">Corporate Sustainability Reporting Directive</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/20">
                  Reporting
                </span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium">SFDR</h4>
              <p className="text-sm text-muted-foreground">Sustainable Finance Disclosure Regulation</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                  Finance
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}