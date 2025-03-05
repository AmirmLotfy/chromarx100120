
import { ErrorBoundary } from "@/components/ui/error-boundary";
import ErrorFallback from "@/components/ErrorFallback";
import { ReactNode } from "react";
import { toast } from "sonner";

interface RootErrorBoundaryProps {
  children: ReactNode;
}

const RootErrorBoundary = ({ children }: RootErrorBoundaryProps) => {
  const handleError = (error: Error) => {
    console.error("Application error:", error);
    toast.error("An unexpected error occurred");
  };

  const handleReset = () => {
    // Any reset logic needed for the entire app
    window.location.href = "/";
  };

  return (
    <ErrorBoundary 
      onError={handleError}
      onReset={handleReset}
      fallback={<ErrorFallback resetErrorBoundary={handleReset} />}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RootErrorBoundary;
