type Spec = Record<string, any>;

// Write handlers intentionally share these paths; reads use one common handler.
// The ADMIN middleware runs
// first for ADMIN; OJT_COORD uses the QHDN implementation.
const sharedRoutes: Record<string, string[]> = {
  '/api/companies/{id}': ['patch'],
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
        'OJT_COORD: QHDN write contract. ENTERPRISE uses the dedicated Enterprise APIs.',
        'For body fields and required properties, use the matching schema variant shown in anyOf or x-role-contracts.'
      ].join(' ');
      admin['x-role-contracts'] = { ADMIN: adminCopy, OJT_COORD: qhdnCopy };

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
      ++count;
    }
  }
  if (count !== 1) throw new Error('Expected 1 shared operation, got ' + count);
}
