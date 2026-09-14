import "server-only";
import { backendGet } from "@/lib/backend";
import type { FrontendVersionList } from "../types";

// No view header here — see lib/backend.ts's backendGet doc. The SSR read
// is silent; only the client-side refetch (see ../client, staleTime: 0)
// counts an actual visit.
export const getFrontendVersion = () =>
  backendGet<FrontendVersionList>("/v1/frontend-version");
