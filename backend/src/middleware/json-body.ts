import type { RequestHandler } from 'express';
import { invalid } from '../modules/students/student.validation';

export const requireJsonBody: RequestHandler = (req, _res, next) => {
  try {
    if (!req.is('application/json')) throw invalid('Use Content-Type: application/json.', 415, 'JSON_CONTENT_TYPE_REQUIRED');
    if (Object.keys(req.query).length) throw invalid('Send input fields in the JSON body; resource IDs belong in the URL.');
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw invalid('Body must be a JSON object.');
    next();
  } catch (error) { next(error); }
};

export const requireNoBody: RequestHandler = (req, _res, next) => {
  if (Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined) {
    next(invalid('GET requests do not accept a body. Use path IDs and query filters.'));
    return;
  }
  next();
};
