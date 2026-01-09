/**
 * Route aggregation - exports all route creators.
 */

export { createProjectRoutes } from './projects.js';
export { createEnvironmentRoutes } from './environments.js';
export { createSessionRoutes } from './sessions.js';
export { createHeartbeatRoutes } from './heartbeat.js';
export {
  createEditorRoutes,
  isProjectAllowed,
  updateEditorActivity,
  getOrStartEditor,
} from './editor.js';
export { createFilesRoutes } from './files.js';
