
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="p-6 mx-auto max-w-md my-4 border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
              Something went wrong
            </h2>
            <p className="text-sm text-red-700 dark:text-red-400">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-red-300 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
              onClick={this.handleReset}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
