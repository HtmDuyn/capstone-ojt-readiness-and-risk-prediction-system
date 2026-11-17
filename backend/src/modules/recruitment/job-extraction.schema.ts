import { inputObject, invalid, requiredText } from '../students/student.validation';

export const JOB_SCHEMA_VERSION = 'JOB_PROFILE_V2';
export type JobSource = {
  title: string; content: string; benefits: string | null;
  positions: { id: number; title: string; description: string; requirements: string; location: string | null; workMode: string | null }[];
};
const fields = ['post.content', 'post.benefits', 'position.description', 'position.requirements'] as const;
const categories = ['TECHNOLOGY', 'TOOL', 'PROFESSIONAL', 'SOFT', 'LANGUAGE', 'EDUCATION', 'EXPERIENCE', 'OTHER'] as const;
const evidence = { type: 'object', additionalProperties: false, required: ['field', 'quote'], properties: {
  field: { type: 'string', enum: fields }, quote: { type: 'string' },
} };
const fact = { type: 'object', additionalProperties: false, required: ['text', 'evidence'], properties: { text: { type: 'string' }, evidence } };
export const jobExtractionSchema = {
  type: 'object', additionalProperties: false, required: ['positions'], properties: {
    positions: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['positionId', 'responsibilities', 'requirements', 'benefits'], properties: {
        positionId: { type: 'integer' }, responsibilities: { type: 'array', items: fact }, benefits: { type: 'array', items: fact },
        requirements: { type: 'array', items: { type: 'object', additionalProperties: false,
          required: ['name', 'category', 'importance', 'evidence'], properties: {
            name: { type: 'string' }, category: { type: 'string', enum: categories },
            importance: { type: 'string', enum: ['REQUIRED', 'PREFERRED', 'UNSPECIFIED'] }, evidence,
          } } },
      } } },
  },
};

export function validateJobProfile(value: unknown, source: JobSource) {
  const root = inputObject(value, ['positions']);
  if (!Array.isArray(root.positions) || root.positions.length !== source.positions.length) throw invalid('Missing recruitment positions.');
  const seen = new Set<number>();
  let omittedEvidenceItems = 0;
  const positions = root.positions.map(value => {
    const p = inputObject(value, ['positionId', 'responsibilities', 'requirements', 'benefits']);
    const original = source.positions.find(s => s.id === p.positionId);
    if (!original || seen.has(original.id)) throw invalid('Unknown or duplicate position.');
    seen.add(original.id);
    const parseEvidence = (value: unknown) => {
      const e = inputObject(value, ['field', 'quote']);
      if (typeof e.field !== 'string' || !(fields as readonly string[]).includes(e.field)) throw invalid('Invalid evidence field.');
      const quote = requiredText(e.quote, 'evidence.quote', 2000);
      const text: Record<string, string | null> = { 'post.content': source.content, 'post.benefits': source.benefits,
        'position.description': original.description, 'position.requirements': original.requirements };
      // Re-anchor an exact quote if the model selected the wrong source field.
      // Never search a different position, paraphrase, or manufacture evidence.
      const field = text[e.field]?.includes(quote) ? e.field : fields.find(field => text[field]?.includes(quote));
      if (!field) { omittedEvidenceItems++; return null; }
      return { field: field as typeof fields[number], quote };
    };
    const list = (v: unknown) => { if (!Array.isArray(v) || v.length > 100) throw invalid('Invalid extraction items.'); return v; };
    const facts = (v: unknown) => list(v).map(value => {
      const item = inputObject(value, ['text', 'evidence']);
      return { text: requiredText(item.text, 'text', 2000), evidence: parseEvidence(item.evidence) };
    }).filter((item): item is typeof item & { evidence: NonNullable<typeof item.evidence> } => item.evidence !== null);
    return { positionId: original.id, title: original.title, location: original.location, workMode: original.workMode,
      responsibilities: facts(p.responsibilities), benefits: facts(p.benefits),
      requirements: list(p.requirements).map(value => {
        const item = inputObject(value, ['name', 'category', 'importance', 'evidence']);
        if (typeof item.category !== 'string' || !(categories as readonly string[]).includes(item.category)
          || typeof item.importance !== 'string' || !['REQUIRED', 'PREFERRED', 'UNSPECIFIED'].includes(item.importance)) throw invalid('Invalid requirement classification.');
        return { name: requiredText(item.name, 'requirement.name', 300), category: item.category as typeof categories[number],
          importance: item.importance as 'REQUIRED' | 'PREFERRED' | 'UNSPECIFIED', evidence: parseEvidence(item.evidence) };
      }).filter((item): item is typeof item & { evidence: NonNullable<typeof item.evidence> } => item.evidence !== null),
    };
  });
  if (!positions.some(p => p.responsibilities.length || p.requirements.length)) throw invalid('No readable job information.');
  return { positions: positions.sort((a, b) => a.positionId - b.positionId),
    validation: { omittedEvidenceItems, warnings: omittedEvidenceItems ? ['UNVERIFIED_ITEMS_OMITTED'] : [] } };
}
