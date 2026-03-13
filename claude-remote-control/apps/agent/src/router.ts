/**
 * Lightweight regex-based router for Bun.serve() fetch handler.
 * Converts Express-style ":param" patterns to named capture groups.
 */

export type RouteHandler = (
  req: Request,
  url: URL,
  params: Record<string, string>
) => Response | Promise<Response>;

export interface Route {
  handler: RouteHandler;
  method: string;
  paramNames: string[];
  regex: RegExp;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/** JSON response helper */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

/** HTML response helper */
export function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
  });
}

/** CORS preflight response */
export function handleCORS(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Convert "/api/sessions/:sessionName/output" → regex with named groups */
function pathnameToRegex(pathname: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const paramNames: string[] = [];
  const regexStr = pathname.replace(
    /:([a-zA-Z_][a-zA-Z0-9_]*)/g,
    (_match, name) => {
      paramNames.push(name);
      return "([^/]+)";
    }
  );
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

/** Match a request against registered routes */
export function matchRoute(
  routes: Route[],
  req: Request,
  url: URL
): { handler: RouteHandler; params: Record<string, string> } | null {
  const pathname = url.pathname;
  for (const r of routes) {
    if (r.method !== req.method) {
      continue;
    }
    const match = r.regex.exec(pathname);
    if (match) {
      const params: Record<string, string> = {};
      for (let i = 0; i < r.paramNames.length; i++) {
        params[r.paramNames[i]] = decodeURIComponent(match[i + 1]);
      }
      return { handler: r.handler, params };
    }
  }
  return null;
}

/** Create a route definition */
export function route(
  method: string,
  pathname: string,
  handler: RouteHandler
): Route {
  const { regex, paramNames } = pathnameToRegex(pathname);
  return { method, regex, paramNames, handler };
}
