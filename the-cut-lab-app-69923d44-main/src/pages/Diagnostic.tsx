import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle, LogOut } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  message: string;
}

export default function Diagnostic() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [results, setResults] = useState<DiagnosticResult[]>([
    { name: 'Supabase Connection', status: 'loading', message: 'Checking...' },
    { name: 'Authentication Status', status: 'loading', message: 'Checking...' },
    { name: 'Services Table', status: 'loading', message: 'Checking...' },
    { name: 'Barbers Table', status: 'loading', message: 'Checking...' },
    { name: 'Appointments Table', status: 'loading', message: 'Checking...' },
    { name: 'User Roles Access', status: 'loading', message: 'Checking...' },
  ]);

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Check Supabase connection
        const { data: healthData } = await supabase.from('services').select('id').limit(1);
        updateResult(0, 'success', 'Connected to Supabase');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        updateResult(0, 'error', `Connection failed: ${msg}`);
      }

      try {
        // Check auth status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          updateResult(1, 'error', `Auth error: ${authError.message}`);
        } else if (user) {
          updateResult(1, 'success', `Logged in as: ${user.email}`);
        } else {
          updateResult(1, 'error', 'Not authenticated');
        }
      } catch (error) {
        updateResult(1, 'error', error instanceof Error ? error.message : 'Unknown error');
      }

      try {
        // Check services
        const { data: services, error: servError } = await supabase.from('services').select('id, name');
        if (servError) {
          updateResult(2, 'error', `Error: ${servError.message}`);
        } else {
          updateResult(2, 'success', `Found ${services?.length || 0} services`);
        }
      } catch (error) {
        updateResult(2, 'error', error instanceof Error ? error.message : 'Unknown error');
      }

      try {
        // Check barbers
        const { data: barbers, error: barbError } = await supabase.from('barbers').select('id, name');
        if (barbError) {
          updateResult(3, 'error', `Error: ${barbError.message}`);
        } else {
          updateResult(3, 'success', `Found ${barbers?.length || 0} barbers`);
        }
      } catch (error) {
        updateResult(3, 'error', error instanceof Error ? error.message : 'Unknown error');
      }

      try {
        // Check appointments
        const { data: appointments, error: aptError } = await supabase
          .from('appointments')
          .select('id, customer_name')
          .limit(5);
        if (aptError) {
          updateResult(4, 'error', `Error: ${aptError.message}`);
        } else {
          updateResult(4, 'success', `Found ${appointments?.length || 0} appointments`);
        }
      } catch (error) {
        updateResult(4, 'error', error instanceof Error ? error.message : 'Unknown error');
      }

      try {
        // Check user roles access
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          if (rolesError) {
            updateResult(5, 'error', `Error: ${rolesError.message}`);
          } else {
            const roleList = roles?.map(r => r.role).join(', ') || 'none';
            updateResult(5, 'success', `Your roles: ${roleList}`);
          }
        } else {
          updateResult(5, 'error', 'Not authenticated');
        }
      } catch (error) {
        updateResult(5, 'error', error instanceof Error ? error.message : 'Unknown error');
      }
    };

    runDiagnostics();
  }, []);

  const updateResult = (index: number, status: DiagnosticResult['status'], message: string) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], status, message };
      return newResults;
    });
  };

  const getIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">System Diagnostics</h1>
            <p className="text-muted-foreground">Testing your Supabase connection and configuration</p>
          </div>

          <Alert className="mb-8 border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-600">🔐 Authentication Required</AlertTitle>
            <AlertDescription className="text-red-600 mt-2">
              <p className="mb-2">You are not logged in. To access system diagnostics and the dashboard, you must first authenticate.</p>
              <p className="text-sm">Your session credentials are missing. This is normal if you just opened the page without logging in first.</p>
            </AlertDescription>
          </Alert>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How to Proceed</CardTitle>
              <CardDescription>Follow these steps to log in and access the dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Step 1: Log In</h3>
                <p className="text-sm text-muted-foreground mb-3">Click the button below to go to the login page. Sign in with your email and password.</p>
                <Button onClick={() => navigate('/login')} className="w-full">
                  Go to Login Page
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Step 2: Create Account (if needed)</h3>
                <p className="text-sm text-muted-foreground mb-3">Don't have an account? Create one first, then come back here.</p>
                <Button onClick={() => navigate('/signup')} variant="outline" className="w-full">
                  Go to Sign Up
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">✅ Step 3: Return to Diagnostics</h3>
                <p className="text-sm text-muted-foreground">After logging in, come back to this page to check your system status.</p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>📚 About the Dashboard</AlertTitle>
            <AlertDescription>
              <p className="mb-2">After logging in, you'll have access to:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Dashboard:</strong> View and manage all appointments</li>
                <li><strong>Add Appointments:</strong> Create new walk-in appointments</li>
                <li><strong>Reschedule Appointments:</strong> Move appointments to different times</li>
                <li><strong>View Diagnostics:</strong> Check system status and troubleshoot issues</li>
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">Note: You need either a <strong>barber</strong> or <strong>admin</strong> role to access the dashboard. If you're having role issues, ask your administrator.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">System Diagnostics</h1>
            <p className="text-muted-foreground">Testing your Supabase connection and configuration</p>
            <p className="text-sm text-muted-foreground mt-2">Logged in as: <strong>{user.email}</strong></p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="space-y-4 mb-8">
          {results.map((result, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getIcon(result.status)}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{result.name}</p>
                    <p className={`text-sm ${
                      result.status === 'success' 
                        ? 'text-green-600' 
                        : result.status === 'error' 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Next Steps</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>If any test fails:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your Supabase project is not paused</li>
              <li>Verify your API keys in .env match Supabase Project Settings</li>
              <li>Check if migrations have been applied (customer_name and user_id nullable columns)</li>
              <li>Ensure your user has barber or admin role assigned</li>
              <li>Check browser console (F12) for actual error messages</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="mt-8 space-y-3">
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
