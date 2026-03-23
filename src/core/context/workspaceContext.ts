import type { Context } from 'hono';
import { generateRequestId } from '../../utils/errorHandler.js';

export interface WorkspaceContext {
  requestId: string;
  workspaceId: string;
  route: string;
  method: string;
  timestamp: string;
}

export function buildWorkspaceContext(c: Context): WorkspaceContext {
  const workspaceId = c.req.header('x-workspace-id')?.trim() || 'default';
  const requestId = c.req.header('x-request-id')?.trim() || generateRequestId();

  return {
    requestId,
    workspaceId,
    route: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  };
}
