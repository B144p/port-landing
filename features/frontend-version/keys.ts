// Client-safe: no import here may reach port-server (lib/backend.ts / ./server).
export const frontendVersionKeys = {
  all: ["frontend-version"] as const,
};

// Identifies this page for view counting and for excluding itself from its
// own selectable list. NEXT_PUBLIC_ because both the client filter (see
// ./client) and lib/backend.ts's proxyGet header need it.
export const FRONTEND_VERSION_KEY =
  process.env.NEXT_PUBLIC_FRONTEND_VERSION_KEY ?? "port-landing";
