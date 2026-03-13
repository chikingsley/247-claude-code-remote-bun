/**
 * Project-related API routes: listing, folder scanning, and git clone.
 */

import { config } from "../config.js";
import { json, type Route, route } from "../router.js";

export function projectRoutes(): Route[] {
  return [
    // List whitelisted projects
    route("GET", "/api/projects", () => {
      return json(config.projects.whitelist);
    }),

    // Dynamic folder listing - scans basePath for directories
    route("GET", "/api/folders", async () => {
      try {
        const fs = await import("fs/promises");
        const basePath = config.projects.basePath.replace(
          "~",
          process.env.HOME!
        );

        const entries = await fs.readdir(basePath, { withFileTypes: true });
        const folders = entries
          .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
          .map((entry) => entry.name)
          .sort();

        return json(folders);
      } catch (err) {
        console.error("Failed to list folders:", err);
        return json({ error: "Failed to list folders" }, 500);
      }
    }),

    // Clone a git repository
    route("POST", "/api/clone", async (req) => {
      const { url } = (await req.json()) as { url?: string };

      if (!url) {
        return json({ success: false, error: "URL is required" }, 400);
      }

      // Validate URL format (https:// or git@)
      const httpsPattern = /^https:\/\/.+\/.+/;
      const sshPattern = /^git@.+:.+/;
      if (!(httpsPattern.test(url) || sshPattern.test(url))) {
        return json({ success: false, error: "Invalid URL format" }, 400);
      }

      // Extract repo name from URL
      let repoName: string;
      try {
        if (url.startsWith("git@")) {
          // git@github.com:user/repo.git -> repo
          const match = url.match(/:([^/]+\/)?(.+?)(\.git)?$/);
          repoName = match?.[2] || "";
        } else {
          // https://github.com/user/repo.git -> repo
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split("/").filter(Boolean);
          repoName =
            pathParts[pathParts.length - 1]?.replace(/\.git$/, "") || "";
        }

        if (!repoName) {
          return json(
            {
              success: false,
              error: "Could not extract repo name from URL",
            },
            400
          );
        }
      } catch (_err) {
        return json({ success: false, error: "Invalid URL format" }, 400);
      }

      const fs = await import("fs/promises");
      const path = await import("path");
      const basePath = config.projects.basePath.replace("~", process.env.HOME!);
      const targetPath = path.join(basePath, repoName);

      // Check if folder already exists
      try {
        await fs.access(targetPath);
        return json(
          {
            success: false,
            error: `Folder "${repoName}" already exists`,
          },
          400
        );
      } catch (_err) {
        // Folder doesn't exist, good to proceed
      }

      // Clone the repository using Bun.spawn
      try {
        const proc = Bun.spawn(["git", "clone", url, repoName], {
          cwd: basePath,
          env: process.env,
          stdout: "pipe",
          stderr: "pipe",
        });

        const exitCode = await proc.exited;

        if (exitCode === 0) {
          console.log(`Successfully cloned ${url} to ${targetPath}`);
          return json({
            success: true,
            project: repoName,
            path: targetPath,
          });
        }

        const stderr = await new Response(proc.stderr).text();
        console.error(`Git clone failed: ${stderr}`);
        return json(
          {
            success: false,
            error: stderr.trim() || "Git clone failed",
          },
          500
        );
      } catch (err) {
        console.error("Failed to spawn git:", err);
        return json(
          {
            success: false,
            error: "Failed to execute git command",
          },
          500
        );
      }
    }),
  ];
}
