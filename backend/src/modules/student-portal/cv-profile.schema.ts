import { inputObject,invalid,requiredText } from '../students/student.validation';
export const CV_SCHEMA_VERSION='CV_PROFILE_V1';
type Row=Record<string,any>;
const nullableText={type:['string','null']};
const evidenceSchema={type:['object','null'],additionalProperties:false,required:['page','quote'],properties:{page:{type:'integer'},quote:{type:'string'}}};
const item=(fields:Row)=>({type:'object',additionalProperties:false,required:[...Object.keys(fields),'evidence'],properties:{...fields,evidence:evidenceSchema}});
export const cvProfileSchema={type:'object',additionalProperties:false,required:['summary','skills','projects','experience','languages','education'],properties:{
 summary:nullableText,
 skills:{type:'array',items:item({name:{type:'string'}})},
 projects:{type:'array',items:item({name:{type:'string'},description:nullableText,technologies:{type:'array',items:{type:'string'}}})},
 experience:{type:'array',items:item({role:{type:'string'},organization:nullableText,description:nullableText})},
 languages:{type:'array',items:item({language:{type:'string'},level:nullableText,certificate:nullableText,score:nullableText})},
 education:{type:'array',items:item({institution:nullableText,degree:nullableText,major:nullableText,gpa:{type:['number','null']},gpaScale:{type:['number','null']}})},
}};
const optional=(value:unknown,name:string,max=2000)=>value===null?null:requiredText(value,name,max);
const numeric=(v:unknown,name:string)=>{if(v===null)return null;if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)throw invalid(`Invalid ${name}.`);return v;};
const skillAliases:Record<string,string>={js:'JavaScript',javascript:'JavaScript',ts:'TypeScript',typescript:'TypeScript',reactjs:'React',react:'React','node.js':'Node.js',nodejs:'Node.js',postgres:'PostgreSQL',postgresql:'PostgreSQL'};
export function validateCvProfile(value:unknown,fromProvider=false) {
 const b=inputObject(value,['summary','skills','projects','experience','languages','education']);
 const parseEvidence=(value:unknown)=>{
  if(value===null){if(fromProvider)throw invalid('Extraction evidence is required.');return null;}
  const e=inputObject(value,['page','quote']);
  if(typeof e.page!=='number'||!Number.isInteger(e.page)||e.page<1||e.page>100)throw invalid('Evidence page must be 1–100.');
  return {page:e.page,quote:requiredText(e.quote,'quote',2000)};
 };
 const parse=(key:string,keys:string[],convert:(r:Row)=>Row):Row[]=>{
  if(!Array.isArray(b[key])||b[key].length>50)throw invalid(`${key} must be an array of at most 50 entries.`);
  return b[key].map((v:unknown)=>{const row=inputObject(v,[...keys,'evidence']);return {...convert(row),evidence:parseEvidence(row.evidence)};});
 };
 const skills=parse('skills',['name'],r=>{const name=requiredText(r.name,'skill',100);return {name:skillAliases[name.toLowerCase()]??name};});
 const seen=new Set<string>();
 return {summary:optional(b.summary,'summary'),skills:skills.filter(r=>{const k=r.name.toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}),
  projects:parse('projects',['name','description','technologies'],r=>{
   if(!Array.isArray(r.technologies)||r.technologies.length>30)throw invalid('Invalid project technologies.');
   return {name:requiredText(r.name,'project name',200),description:optional(r.description,'description'),technologies:r.technologies.map((v:unknown)=>requiredText(v,'technology',100))};
  }),
  experience:parse('experience',['role','organization','description'],r=>({role:requiredText(r.role,'role',200),organization:optional(r.organization,'organization',200),description:optional(r.description,'description')})),
  languages:parse('languages',['language','level','certificate','score'],r=>({language:requiredText(r.language,'language',100),level:optional(r.level,'level',100),certificate:optional(r.certificate,'certificate',200),score:optional(r.score,'score',100)})),
  education:parse('education',['institution','degree','major','gpa','gpaScale'],r=>{
   const gpa=numeric(r.gpa,'gpa'),gpaScale=numeric(r.gpaScale,'gpaScale');
   if(gpaScale!==null&&(gpaScale<=0||(gpa!==null&&gpa>gpaScale)))throw invalid('GPA exceeds its stated scale.');
   return {institution:optional(r.institution,'institution',200),degree:optional(r.degree,'degree',200),major:optional(r.major,'major',200),gpa,gpaScale};
  })};
}
