import { MonitoringService } from '../services/monitoring/index.js';

const monitoring = new MonitoringService();

export function requestLogger(req, res, next) {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (chunk, encoding, callback) {
    const responseTime = Date.now() - start;
    const responseSize = chunk ? chunk.length : 0;

    monitoring
      .logRequest({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTimeMs: responseTime,
        userId: req.user?.userId,
        organizationId: req.user?.organizationId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        errorMessage: res.locals?.errorMessage,
        requestSize: req.headers['content-length'] ? Number(req.headers['content-length']) : null,
        responseSize
      })
      .catch((err) => console.error('Failed to log request', err));

    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
}
