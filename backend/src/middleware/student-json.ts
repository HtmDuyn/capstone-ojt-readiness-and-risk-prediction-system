import { Router, type RequestHandler } from 'express';
import { authenticate } from './authenticate';
import { authorizeRoles } from './authorize';
import { invalid } from '../modules/students/student.validation';

type Spec = Record<string, any>;

export function createStudentJsonRouter(spec: Spec, dispatch: RequestHandler): Router {
  const router = Router();
  for (const [path, item] of Object.entries(spec.paths) as [string, Spec][]) {
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const operation = item[method];
      const contract = operation?.['x-student-json'];
      if (!contract) continue;
      const source = operation['x-original-operation'];
      const schema = operation.requestBody.content['application/json'].schema;
      const adapt: RequestHandler = (req, _res, next) => {
        try {
          if (!req.is('application/json')) throw invalid('Content-Type must be application/json.', 415);
          if (Object.keys(req.query).length) throw invalid('Put all fields in the JSON body, not query parameters.');
          const input = req.body;
          if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalid('JSON object is required.');
          for (const name of Object.keys(input)) if (!Object.hasOwn(schema.properties, name)) throw invalid('Unknown field: ' + name);
          for (const name of schema.required) if (input[name] === undefined) throw invalid(name + ' is required.');
          let target = source.path.slice('/api'.length);
          const query = new URLSearchParams();
          for (const binding of contract.bindings) {
            const value = input[binding.name];
            if (value === undefined) continue;
            const rule = binding.schema;
            if ((rule.type === 'integer' && !Number.isSafeInteger(value))
              || (rule.type === 'string' && typeof value !== 'string')
              || (rule.type === 'boolean' && typeof value !== 'boolean')
              || (rule.minimum !== undefined && value < rule.minimum)
              || (rule.maximum !== undefined && value > rule.maximum)
              || (rule.enum && !rule.enum.includes(value))) throw invalid('Invalid ' + binding.name + '.');
            if (binding.source === 'path') target = target.replace('{' + binding.originalName + '}', encodeURIComponent(String(value)));
            else if (binding.source === 'query') query.set(binding.originalName, String(value));
          }
          const previous = { method: req.method, url: req.url, originalUrl: req.originalUrl, body: req.body };
          req.method = source.method;
          req.url = target + (query.size ? '?' + query.toString() : '');
          // Authentication checks password-change exceptions against the actual target.
          req.originalUrl = '/api' + req.url;
          req.body = Object.fromEntries(contract.bodyFields.filter((name: string) => Object.hasOwn(input, name)).map((name: string) => [name, input[name]]));
          // Restore the request if the underlying router delegates to error/404 handling.
          (req as any).studentJsonRestore = () => Object.assign(req, previous);
          (req as any).studentJsonStudentId = input.studentId;
          next();
        } catch (error) { next(error); }
      };
      router[method](path.slice('/api'.length), adapt, authenticate, authorizeRoles('STUDENT'), (req, res, next) => {
        const selected = (req as any).studentJsonStudentId;
        if (selected !== undefined && selected !== req.user?.studentId) {
          next(invalid('studentId does not belong to the authenticated account.', 403, 'FORBIDDEN'));
          return;
        }
        dispatch(req, res, error => {
          (req as any).studentJsonRestore?.();
          next(error);
        });
      });
    }
  }
  return router;
}
