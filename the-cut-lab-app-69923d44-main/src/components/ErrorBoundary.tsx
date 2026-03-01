import React, { ReactNode, Component, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nešto je pošlo po zlu</AlertTitle>
              <AlertDescription>
                Aplikacija je naišla na neočekivanu grešku. Pokušajte osvježiti stranicu ili kontaktirajte podršku.
              </AlertDescription>
            </Alert>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-white rounded border border-red-200">
                <summary className="cursor-pointer font-semibold text-sm mb-2">
                  Detalji greške (razvoj)
                </summary>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-red-700 break-words">
                    {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-2">
              <Button
                onClick={this.handleReset}
                variant="gold"
                className="w-full"
              >
                Pokušaj ponovno
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full"
              >
                Idi na početnu stranicu
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
