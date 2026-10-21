import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { fail } from './import.validation';

type Row = Record<string, any>;
const studentFields = ['code','email','fullName','programId','phone','className','status','cohortId','groupCode','entryAcademicPeriodId','currentAcademicPeriodId','courseCode','academicPeriodId','attemptNumber','courseStatus','score','grade','gradePoints','sourceReference'];
const enterpriseFields = ['code','email','fullName','name','address','positionCode','title','description','requirements','capacity'];

// One sheet row per course attempt / recruitment position. Repeated identities are grouped.
export async function parseImportSheet(body: Row, file?: Express.Multer.File): Promise<Row> {
  if (!file) return body;
  if (!['STUDENT','ENTERPRISE'].includes(body.kind)) throw fail('kind must be STUDENT or ENTERPRISE.');
  let mapping: Row;
  try { mapping = typeof body.mapping === 'string' ? JSON.parse(body.mapping) : body.mapping ?? {}; }
  catch { throw fail('mapping must be a JSON object.'); }
  const fields = body.kind === 'STUDENT' ? studentFields : enterpriseFields;
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping) || Object.keys(mapping).some(k=>!fields.includes(k)) || Object.values(mapping).some(v=>typeof v!=='string')) throw fail('Invalid column mapping.');
  const workbook = new ExcelJS.Workbook();
  let sheet: ExcelJS.Worksheet;
  try {
    if (/\.xlsx$/i.test(file.originalname)) { await workbook.xlsx.load(file.buffer as any); sheet = workbook.worksheets[0]; }
    else if (/\.csv$/i.test(file.originalname)) sheet = await workbook.csv.read(Readable.from([file.buffer]));
    else throw fail('Import file must be .xlsx or .csv.');
  } catch (error: any) { if (error.statusCode) throw error; throw fail('Cannot read import file.',400,'INVALID_SHEET'); }
  if (!sheet || sheet.rowCount < 2 || sheet.rowCount > 5001 || sheet.columnCount > 100) throw fail('Sheet requires a header and 1–5000 data rows, at most 100 columns.');
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell,index)=>{ const key=cell.text.trim(); if(headers.has(key))throw fail('Duplicate column header: '+key); headers.set(key,index); });
  for(const [field,column] of Object.entries(mapping)) if(!headers.has(column))throw fail(`Mapped column for ${field} does not exist: ${column}`);
  const groups = new Map<string, {identity:string; row:Row}>();
  for (let n=2; n<=sheet.rowCount; n++) {
    const source=sheet.getRow(n); if(!source.hasValues)continue;
    const v:Row={};
    for(const field of fields){const index=headers.get(mapping[field]??field);if(index){const value=source.getCell(index).text.trim();if(value!=='')v[field]=value;}}
    if(!v.code||!v.email)throw fail(`Sheet row ${n}: code and email are required.`);
    v.code=v.code.toUpperCase();v.email=v.email.toLowerCase();
    const row:Row={code:v.code,email:v.email,fullName:v.fullName};
    if(body.kind==='ENTERPRISE') Object.assign(row,{name:v.name,...(v.address?{address:v.address}:{})});
    else {
      const placement:Row={cohortId:Number(v.cohortId),groupCode:v.groupCode,currentAcademicPeriodId:Number(v.currentAcademicPeriodId)};
      if(v.entryAcademicPeriodId!==undefined)placement.entryAcademicPeriodId=Number(v.entryAcademicPeriodId);
      row.academic={programId:Number(v.programId),placement};
      for(const key of ['phone','className','status'])if(v[key]!==undefined)row.academic[key]=v[key];
    }
    const identity=JSON.stringify(row),key=body.kind==='ENTERPRISE'?v.email:v.code,old=groups.get(key);
    if(old&&old.identity!==identity)throw fail(`Sheet row ${n}: inconsistent identity/profile for ${key}.`);
    const target=old?.row??row;
    if(body.kind==='ENTERPRISE') {
      target.positions??=[];
      target.positions.push({code:v.positionCode,title:v.title,description:v.description,requirements:v.requirements,capacity:Number(v.capacity)});
    } else {
      target.academic.courseResults??=[];
      if(v.courseCode!==undefined){
        const result:Row={courseCode:v.courseCode,academicPeriodId:Number(v.academicPeriodId),status:v.courseStatus};
        for(const key of ['attemptNumber','score','gradePoints'])if(v[key]!==undefined)result[key]=Number(v[key]);
        for(const key of ['grade','sourceReference'])if(v[key]!==undefined)result[key]=v[key];
        target.academic.courseResults.push(result);
      } else if(['academicPeriodId','courseStatus','score','grade','gradePoints','attemptNumber','sourceReference'].some(k=>v[k]!==undefined))throw fail(`Sheet row ${n}: courseCode is required for course results.`);
    }
    if(!old)groups.set(key,{identity,row:target});
  }
  return {kind:body.kind,idempotencyKey:body.idempotencyKey,...(body.kind==='ENTERPRISE'?{windowId:Number(body.windowId)}:{}),rows:[...groups.values()].map(g=>g.row)};
}
