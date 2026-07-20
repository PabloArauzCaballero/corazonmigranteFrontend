"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based error boundary (React requires a class component for this).
 * Catches render errors in the subtree and shows a recoverable fallback UI.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeFeature />
 *   </ErrorBoundary>
 *
 * Or with a custom fallback:
 *   <ErrorBoundary fallback={<p>Algo salió mal</p>}>
 *     <SomeFeature />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production this would go to your error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary] Render error caught:", error, info.componentStack);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Algo salió mal</p>
            {process.env.NODE_ENV !== "production" && this.state.error ? (
              <p className="max-w-sm text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ocurrió un error inesperado. Por favor, intenta de nuevo.
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={this.reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
