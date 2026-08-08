// Response shape for port-server's public GET /v1/frontend-version.
// The endpoint returns raw Prisma rows (no serialization DTO), so
// `show` / `createdAt` / `updatedAt` are present even though this app
// never uses them beyond `show` already being filtered server-side.

export interface FrontendVersion {
  id: string;
  key: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  show: boolean;
  order: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface FrontendVersionList {
  totalViews: number;
  versions: FrontendVersion[];
}
