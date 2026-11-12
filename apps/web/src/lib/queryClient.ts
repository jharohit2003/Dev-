import { QueryClient } from "@tanstack/react-query";
import { ApiClientError } from "./apiClient";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as fresh for 30 seconds before refetching in the background.
      staleTime: 30_000,
      // Retry network and server errors, but not 4xx errors: those will not fix themselves.
      retry: (failureCount, error) => {
        if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
