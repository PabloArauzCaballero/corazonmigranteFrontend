"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionProvider } from "@/shared/auth/use-session";
import { GlobalLoadingBar } from "@/shared/ui/global-loading-bar";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <GlobalLoadingBar />
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
