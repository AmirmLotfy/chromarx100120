
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="p-6 max-w-md border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-300">
            Oops! Something went wrong
          </h2>
          <p className="text-sm text-red-700 dark:text-red-400">
            {error?.message || "An unexpected error occurred in the application."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {resetErrorBoundary && (
              <Button 
                variant="outline" 
                onClick={resetErrorBoundary}
                className="border-red-300 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Return to home
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ErrorFallback;
