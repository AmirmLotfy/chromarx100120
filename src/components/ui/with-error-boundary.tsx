
import React from "react";
import { ErrorBoundary } from "./error-boundary";

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ReactNode,
  onError?: (error: Error, info: React.ErrorInfo) => void
): React.FC<P> {
  const displayName = Component.displayName || Component.name || "Component";
  
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary fallback={errorFallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  
  return WrappedComponent;
}
