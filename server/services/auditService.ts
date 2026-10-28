import { AuditLogModel, IAuditLog } from '../models/index.ts';

export async function logAudit(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
}): Promise<IAuditLog> {
  const log = await AuditLogModel.create({
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    timestamp: new Date().toISOString(),
    details: params.details || {},
  });
  return log;
}
