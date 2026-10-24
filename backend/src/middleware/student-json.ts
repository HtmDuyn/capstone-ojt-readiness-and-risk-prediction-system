import { Router, type RequestHandler } from 'express';
import { authenticate } from './authenticate';
import { authorizeRoles } from './authorize';
import { invalid } from '../modules/students/student.validation';
import { studentJsonHandlers, type StudentInput } from '../modules/student-portal/student-json.handlers';

type Spec = Record<string, any>;

// Validate JSON before selecting the authenticated student's data.
function validate(value: unknown, raw: Spec, spec: Spec, field = 'body'): void {
  const schema: Spec = raw.$ref ? raw.$ref.slice(2).split('/').reduce((v: Spec, key: string) => v[key], spec) : raw;
  if (value === null && schema.nullable) return;
  const fail = (message: string): never => { throw invalid(field + ' ' + message); };
  if (schema.type === 'object' || schema.properties) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('must be a JSON object.');
    const object = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!Object.hasOwn(object, key)) fail('requires ' + key + '.');
    if (schema.minProperties !== undefined && Object.keys(object).length < schema.minProperties) fail('requires at least one field.');
    for (const [key, item] of Object.entries(object)) {
      if (schema.properties && Object.hasOwn(schema.properties, key)) validate(item, schema.properties[key], spec, field + '.' + key);
      else if (schema.additionalProperties === false) fail('contains unknown field ' + key + '.');
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value)) fail('must be an array.');
    const array = value as unknown[];
    if (schema.minItems !== undefined && array.length < schema.minItems) fail('has too few items.');
    if (schema.maxItems !== undefined && array.length > schema.maxItems) fail('has too many items.');
    if (schema.uniqueItems && new Set(array.map(item => JSON.stringify(item))).size !== array.length) fail('must contain unique items.');
    array.forEach((item, i) => validate(item, schema.items ?? {}, spec, field + '[' + i + ']'));
  } else if (schema.type === 'integer' && !Number.isSafeInteger(value)) fail('must be an integer.');
  else if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) fail('must be a number.');
  else if (schema.type === 'string' && typeof value !== 'string') fail('must be a string.');
  else if (schema.type === 'boolean' && typeof value !== 'boolean') fail('must be a boolean.');
  if (typeof value === 'number' && ((schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum))) fail('is out of range.');
  if (typeof value === 'string' && ((schema.minLength !== undefined && value.length < schema.minLength) || (schema.maxLength !== undefined && value.length > schema.maxLength))) fail('has invalid length.');
  if (schema.enum && !schema.enum.includes(value)) fail('has an invalid value.');
}

export function createStudentJsonRouter(spec: Spec): Router {
  const router = Router();
  const used = new Set<string>();
  for (const [path, item] of Object.entries(spec.paths) as [string, Spec][]) {
    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const operation = item[method], contract = operation?.['x-student-json'];
      if (!contract) continue;
      const key = operation['x-student-handler'];
      const handler = studentJsonHandlers[key];
      if (!handler || used.has(key)) throw Error('Missing or duplicate Student handler: ' + key);
      used.add(key);
      const adapt: RequestHandler = (req, res, next) => {
        try {
          if (!req.is('application/json')) throw invalid('Content-Type must be application/json.', 415);
          if (Object.keys(req.query).length) throw invalid('Put all fields in the JSON body, not query parameters.');
          validate(req.body, operation.requestBody.content['application/json'].schema, spec);
          const input = req.body as Record<string, any>;
          const params: Record<string, string> = {}, query: Record<string, string> = {};
          for (const binding of contract.bindings) {
            if (input[binding.name] === undefined) continue;
            if (binding.source === 'path') params[binding.originalName] = String(input[binding.name]);
            else if (binding.source === 'query') query[binding.originalName] = String(input[binding.name]);
          }
          res.locals.studentInput = { params, query, body: Object.fromEntries(contract.bodyFields.filter((name: string) => Object.hasOwn(input, name)).map((name: string) => [name, input[name]])) };
          next();
        } catch (error) { next(error); }
      };
      router[method](path.slice('/api'.length), adapt, authenticate, authorizeRoles('STUDENT'), (req, res, next) => {
        if (req.body.studentId !== undefined && req.body.studentId !== req.user?.studentId) {
          next(invalid('studentId does not belong to the authenticated account.', 403, 'FORBIDDEN')); return;
        }
        (res.locals.studentInput as StudentInput).actor = req.user as StudentInput['actor'];
        handler(req, res, next);
      });
    }
  }
  for (const key of Object.keys(studentJsonHandlers)) if (!used.has(key)) throw Error('Unused Student handler: ' + key);
  return router;
}
