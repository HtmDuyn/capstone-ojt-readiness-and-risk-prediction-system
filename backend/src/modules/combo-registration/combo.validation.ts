import { dateInput } from '../academic/academic.schema';
import { array, unique } from '../curriculum/curriculum.validation';
import { invalid, inputObject, positiveId, requiredText, enumValue } from '../students/student.validation';
export { invalid, inputObject, positiveId, requiredText, enumValue, array, unique };
export function timestamp(value:unknown,name:string):string {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))throw invalid(`${name} must be an ISO timestamp including seconds and timezone.`);
  dateInput(value.slice(0,10),name);
  const date=new Date(value);if(!Number.isFinite(date.getTime()))throw invalid(`${name} is invalid.`);return date.toISOString();
}
export function ids(value:unknown,name:string,max=1000) {const values=array(value,name,max).map(v=>positiveId(v,name));unique(values,name);return values.sort((a,b)=>a-b);}
export function scope(value:unknown) {
  const b=inputObject(value,['cohortIds','groupCodes','majorIds','studentIds']);
  const cohortIds=ids(b.cohortIds,'cohortIds'),majorIds=ids(b.majorIds,'majorIds');
  const groupCodes=array(b.groupCodes,'groupCodes',4).map(v=>enumValue(v,['A','B','C','D'],'groupCode')).sort();unique(groupCodes,'groupCode');
  if(!cohortIds.length||!majorIds.length||!groupCodes.length)throw invalid('cohortIds, groupCodes and majorIds must be nonempty.');
  const studentIds=b.studentIds===undefined?null:ids(b.studentIds,'studentIds');if(studentIds && !studentIds.length)throw invalid('studentIds must be nonempty when supplied.');
  return {cohortIds,majorIds,groupCodes,studentIds};
}
export function purpose(combo:{ComboCode:string;SelectionGroup:string|null}) {
  const group=combo.SelectionGroup?.toUpperCase();if(['SPECIALIZATION','PHYSICAL_EDUCATION','OTHER'].includes(group??''))return group;
  if(/^PHE_COM/.test(combo.ComboCode))return 'PHYSICAL_EDUCATION';
  return /^(AI17|IA|IS|SE(-2026)?)_COM/.test(combo.ComboCode)?'SPECIALIZATION':'OTHER';
}
