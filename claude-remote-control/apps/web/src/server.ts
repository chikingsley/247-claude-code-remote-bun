import pkg from "../package.json";

// Inject app version for client-side env var inlining (bunfig.toml env = "PUBLIC_*")
process.env.PUBLIC_APP_VERSION ??= pkg.version;

import {
  DELETE as connectionDelete,
  PUT as connectionPut,
} from "./app/api/connections/[id]/route";
import {
  GET as connectionsGet,
  POST as connectionsPost,
} from "./app/api/connections/route";
import {
  GET as pairCodeGet,
  POST as pairCodePost,
} from "./app/api/pair/code/route";
import { POST as pairValidatePost } from "./app/api/pair/validate/route";
import { POST as pushNotifyPost } from "./app/api/push/notify/route";
import {
  DELETE as pushSubscribeDelete,
  POST as pushSubscribePost,
} from "./app/api/push/subscribe/route";
import { GET as vapidKeyGet } from "./app/api/push/vapid-key/route";
import { GET as testGet } from "./app/api/test/route";
import homepage from "./index.html";

// Sound files in public/sounds/
function serveSoundFile(req: Request): Response {
  const url = new URL(req.url);
  const filename = url.pathname.replace("/sounds/", "");
  // Sanitize: only allow alphanumeric, hyphens, dots
  if (!/^[\w.-]+$/.test(filename)) {
    return Response.json({ error: "Invalid filename" }, { status: 400 });
  }
  return new Response(Bun.file(`./public/sounds/${filename}`));
}

export default {
  port: Number(process.env.PORT) || 3001,

  routes: {
    // SPA — same HTML for all client routes
    "/": homepage,
    "/connect": homepage,

    // API routes
    "/api/test": { GET: testGet },
    "/api/connections": { GET: connectionsGet, POST: connectionsPost },
    "/api/connections/:id": { PUT: connectionPut, DELETE: connectionDelete },
    "/api/pair/code": { GET: pairCodeGet, POST: pairCodePost },
    "/api/pair/validate": { POST: pairValidatePost },
    "/api/push/vapid-key": { GET: vapidKeyGet },
    "/api/push/subscribe": {
      POST: pushSubscribePost,
      DELETE: pushSubscribeDelete,
    },
    "/api/push/notify": { POST: pushNotifyPost },

    // Static assets
    "/sw.js": Bun.file("./public/sw.js"),
    "/manifest.json": Bun.file("./public/manifest.json"),
    "/favicon.ico": Bun.file("./public/favicon.ico"),
    "/apple-icon.png": Bun.file("./public/apple-icon.png"),
    "/icon-192x192.png": Bun.file("./public/icon-192x192.png"),
    "/icon-512x512.png": Bun.file("./public/icon-512x512.png"),
    "/icon-maskable-512x512.png": Bun.file(
      "./public/icon-maskable-512x512.png"
    ),
    "/sounds/*": serveSoundFile,
  },

  // Fallback: serve SPA for unmatched non-API routes
  fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    // SPA fallback — serve the same HTML for any client route
    return new Response(homepage as unknown as BodyInit);
  },

  development: process.env.NODE_ENV !== "production",
} satisfies Parameters<typeof Bun.serve>[0];
