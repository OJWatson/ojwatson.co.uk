import { handleRequest, securityHeaders } from '../server/app.ts';
import type { Env } from '../server/types.ts';

interface Context { request: Request; env: Env; next(): Promise<Response> }
export async function onRequest(context: Context): Promise<Response> {
  const response = await handleRequest(context.request, context.env) || await context.next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
