import { isServer, QueryClient } from "@tanstack/react-query";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * The server needs a fresh client per request (no cross-request state
 * leakage); the browser needs exactly one shared client so navigating
 * around the app doesn't lose its cache.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
