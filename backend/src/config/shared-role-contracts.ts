type Spec = Record<string, any>;

// Both handlers intentionally share these HTTP paths. The ADMIN middleware runs
// first for ADMIN; OJT_COORD/ENTERPRISE use the QHDN implementation.
const sharedRoutes: Record<string, string[]> = {
  '/api/companies': ['get', 'post'],
  '/api/companies/{id}': ['get', 'patch'],
  '/api/positions': ['get', 'post'],
  '/api/positions/{id}': ['patch'],
  '/api/assignments': ['get', 'post'],
  '/api/assignments/{id}': ['get', 'patch'],
  '/api/assignments/{id}/status': ['patch'],
};

// Keep both schemas and both sets of allowed input fields: the JSON-input
// adapter derives its field whitelist from the top-level properties object.
// anyOf documents the role-dependent payload constraints without pretending
// that ADMIN and OJT_COORD share the same mandatory fields.
export function mergeSharedRoleContracts(spec: Spec, qhdnPaths: Spec): void {
  let count = 0;
  for (const [path, methods] of Object.entries(sharedRoutes)) {
    for (const method of methods) {
      const admin = spec.paths?.[path]?.[method];
      const qhdn = qhdnPaths?.[path]?.[method];
      if (!admin?.tags?.includes('Admin') || !qhdn?.tags?.includes('QHDN core')) {
        throw new Error('Missing ADMIN/QHDN shared contract: ' + method.toUpperCase() + ' ' + path);
      }
      const adminCopy = structuredClone(admin);
      const qhdnCopy = structuredClone(qhdn);
      admin.tags = ['Admin', 'QHDN core'];
      admin.summary = (admin.summary ?? method.toUpperCase() + ' ' + path) + ' (ADMIN / QHDN)';
      admin.description = [
        'Role-dependent implementation on the same URL.',
        'ADMIN: Admin service contract (ADMIN JWT).',
        method === 'get'
          ? 'OJT_COORD and ENTERPRISE: QHDN read contract; ENTERPRISE records are restricted to its own company.'
          : 'OJT_COORD: QHDN write contract. ENTERPRISE writes are not permitted.',
        'For body fields and required properties, use the matching schema variant shown in anyOf or x-role-contracts.'
      ].join(' ');
      admin['x-role-contracts'] = { ADMIN: adminCopy, OJT_COORD: qhdnCopy };

      if (method === 'get') {
        const parameters = new Map<string, Spec>();
        for (const param of [...(adminCopy.parameters ?? []), ...(qhdnCopy.parameters ?? [])]) {
          const key = param.in + ':' + param.name;
          if (!parameters.has(key)) {
            parameters.set(key, structuredClone(param));
          } else {
            const previous = parameters.get(key)!;
            if (Array.isArray(previous.schema?.enum) && Array.isArray(param.schema?.enum)) {
              previous.schema.enum = [...new Set([...previous.schema.enum, ...param.schema.enum])];
            }
          }
        }
        admin.parameters = [...parameters.values()];
      } else {
        const adminSchema = adminCopy.requestBody?.content?.['application/json']?.schema;
        const qhdnSchema = qhdnCopy.requestBody?.content?.['application/json']?.schema;
        if (!adminSchema || !qhdnSchema) {
          throw new Error('Missing shared write body: ' + method.toUpperCase() + ' ' + path);
        }
        const merged = {
          type: 'object',
          additionalProperties: false,
          properties: { ...structuredClone(adminSchema.properties ?? {}), ...structuredClone(qhdnSchema.properties ?? {}) },
          anyOf: [structuredClone(adminSchema), structuredClone(qhdnSchema)]
        };
        admin.requestBody = { required: true, content: { 'application/json': { schema: merged } } };
      }
      ++count;
    }
  }
  if (count !== 12) throw new Error('Expected 12 shared operations, got ' + count);
}
