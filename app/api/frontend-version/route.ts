import { proxyGet } from "@/lib/backend";

export async function GET(request: Request) {
  return proxyGet(request, "/v1/frontend-version");
}
