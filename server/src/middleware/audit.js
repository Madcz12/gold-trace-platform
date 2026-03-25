import { AuditLog } from '../models/index.js';

export const auditMiddleware = (action, entityType = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        AuditLog.create({
          userId: req.user.id,
          action,
          entityType: entityType || req.baseUrl.split('/').pop(),
          entityId: data?.id || req.params?.id || null,
          details: {
            method: req.method,
            path: req.originalUrl,
            body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
          },
          ipAddress: req.ip,
        }).catch(err => console.error('Audit log error:', err));
      }
      return originalJson(data);
    };

    next();
  };
};

function sanitizeBody(body) {
  if (!body) return undefined;
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.token;
  return sanitized;
}
