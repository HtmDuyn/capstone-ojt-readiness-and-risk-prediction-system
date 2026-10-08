import type { PoolClient } from 'pg';
import { array, inputObject, courseId, credits, integer, boolean, enumValue, optionalText, requiredText, positiveId, unique, invalid, assertAcyclic } from './curriculum.validation';
export type Row=Record<string,any>;
export async function normalizeCourses(client:PoolClient,raw:unknown):Promise<Row[]> {
  const rows:Row[]=[];
  for(const value of array(raw,'courses')) {
    const b=inputObject(value,['courseId','courseCode','credits','semester','isRequired','entryKind','prerequisiteText']);
    const c=await courseId(client,b);
    rows.push({courseId:c.CourseID,name:c.CourseName,credits:credits(b.credits),semester:integer(b.semester,'semester'),isRequired:boolean(b.isRequired,'isRequired'),entryKind:enumValue(b.entryKind??'COURSE',['COURSE','COMBO_SLOT','ELECTIVE_SLOT'],'entryKind'),prerequisiteText:optionalText(b.prerequisiteText,'prerequisiteText',10000)});
  }
  unique(rows.map(c=>c.courseId),'curriculum course');return rows;
}
export async function normalizeCombo(client:PoolClient,raw:unknown,programCourses:Row[]):Promise<Row> {
  const body=inputObject(raw,['courses','choiceGroups']);
  const courses:Row[]=[];
  for(const value of array(body.courses,'combo courses')) {
    const b=inputObject(value,['courseId','courseCode','credits','semester','prerequisiteText','note','slotCourseIds']);
    const c=await courseId(client,b),slotCourseIds=array(b.slotCourseIds,'slotCourseIds',100).map(v=>positiveId(v,'slotCourseId'));
    unique(slotCourseIds,'slot mapping');
    for(const id of slotCourseIds) {
      const slot=programCourses.find(pc=>pc.courseId===id);
      if(!slot || !['COMBO_SLOT','ELECTIVE_SLOT'].includes(slot.entryKind))throw invalid(`Course ${id} is not a slot in this curriculum.`);
      if(slot.credits!==credits(b.credits))throw invalid('Combo course credits must match its mapped slot credits.');
    }
    courses.push({courseId:c.CourseID,name:c.CourseName,credits:credits(b.credits),semester:integer(b.semester,'semester'),prerequisiteText:optionalText(b.prerequisiteText,'prerequisiteText',10000),note:optionalText(b.note,'note',2000),slotCourseIds});
  }
  unique(courses.map(c=>c.courseId),'combo course');
  const groups:Row[]=[],members:number[]=[];
  for(const value of array(body.choiceGroups,'choiceGroups')) {
    const g=inputObject(value,['code','minCourses','maxCourses','courseIds']);
    const ids=array(g.courseIds,'choice group courseIds').map(v=>positiveId(v,'courseId'));
    unique(ids,'choice group member');
    if(ids.some(id=>!courses.some(c=>c.courseId===id)))throw invalid('Choice group members must belong to this combo.');
    const min=integer(g.minCourses,'minCourses',0,500),max=integer(g.maxCourses,'maxCourses',0,500);
    if(min>max || max>ids.length || !ids.length)throw invalid('Choice group bounds must satisfy 0 <= min <= max <= member count; groups must have members.');
    groups.push({code:requiredText(g.code,'group code',50),minCourses:min,maxCourses:max,courseIds:ids});members.push(...ids);
  }
  unique(groups.map(g=>g.code.toUpperCase()),'choice group code');unique(members,'choice membership across groups');
  if(courses.length!==members.length)throw invalid('Every combo course must belong to exactly one explicit choice group.');
  return {courses,choiceGroups:groups};
}
export async function scopeCourses(client:PoolClient,id:number) {
  const program=(await client.query(`SELECT "ProgramCourseID" AS id,"CourseID" AS "courseId","Credits"::float8 AS credits,"RecommendedSemester" AS semester,"IsRequired" AS "isRequired","EntryKind" AS "entryKind" FROM "ProgramCourses" WHERE "ProgramID"=$1`,[id])).rows;
  const combo=(await client.query(`SELECT c."CourseID" AS "courseId",c."Semester" AS semester FROM "ComboCourses" c JOIN "ProgramCombos" b ON b."ProgramComboID"=c."ProgramComboID" WHERE b."ProgramID"=$1`,[id])).rows;
  return {program,combo};
}
export function normalizePrerequisites(raw:unknown,program:Row[],combo:Row[]):Row[] {
  const rows:Row[]=[],keys:string[]=[],edges=new Map<number,Set<number>>();
  const real=new Set([...program.filter(c=>c.entryKind==='COURSE'),...combo].map(c=>c.courseId));
  for(const value of array(raw,'prerequisites',1000)) {
    const b=inputObject(value,['courseId','groupCode','minimumPassed','prerequisiteCourseIds']);
    const id=positiveId(b.courseId,'courseId'),target=program.find(c=>c.courseId===id);
    if(!target || target.entryKind!=='COURSE')throw invalid('Prerequisite target must be an actual curriculum course, not a placeholder.');
    const members=array(b.prerequisiteCourseIds,'prerequisiteCourseIds').map(v=>positiveId(v,'prerequisiteCourseId'));
    unique(members,'prerequisite member');
    if(members.includes(id)||members.some(m=>!real.has(m)))throw invalid('Prerequisites must be other real courses in this curriculum or its combos.');
    const min=integer(b.minimumPassed,'minimumPassed',1,500);if(min>members.length)throw invalid('minimumPassed exceeds prerequisite member count.');
    const groupCode=requiredText(b.groupCode,'groupCode',50);keys.push(`${id}:${groupCode.toUpperCase()}`);
    edges.set(id,new Set([...(edges.get(id)??[]),...members]));rows.push({courseId:id,groupCode,minimumPassed:min,prerequisiteCourseIds:members});
  }
  unique(keys,'prerequisite group');assertAcyclic(edges,'Prerequisites');return rows;
}
export async function normalizeEquivalences(client:PoolClient,raw:unknown,program:Row[],combo:Row[]):Promise<Row[]> {
  const real=new Set([...program.filter(c=>c.entryKind==='COURSE'),...combo].map(c=>c.courseId));
  const rows:Row[]=[],edges=new Map<number,Set<number>>();
  for(const value of array(raw,'equivalences')) {
    const b=inputObject(value,['sourceCourseId','targetCourseId','reason']);
    const source=positiveId(b.sourceCourseId,'sourceCourseId'),target=positiveId(b.targetCourseId,'targetCourseId');
    if(source===target || !real.has(target))throw invalid('Equivalence target must be a different actual course in this curriculum or its combos.');
    await courseId(client,{courseId:source});
    rows.push({sourceCourseId:source,targetCourseId:target,reason:requiredText(b.reason,'reason',2000)});edges.set(source,new Set([target]));
  }
  unique(rows.map(r=>r.sourceCourseId),'equivalence source');assertAcyclic(edges,'Course equivalences');
  return rows;
}
export async function writeCourses(client:PoolClient,id:number,rows:Row[]) {
  const ids=rows.map(r=>r.courseId);
  // Keep stable ProgramCourseIDs for prerequisite/slot references on retained courses.
  await client.query('DELETE FROM "ProgramCourses" WHERE "ProgramID"=$1 AND NOT ("CourseID"=ANY($2::int[]))',[id,ids]);
  for(const r of rows)await client.query(`INSERT INTO "ProgramCourses" ("ProgramID","CourseID","CourseName","Credits","RecommendedSemester","IsRequired","EntryKind","PrerequisiteText") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT ("ProgramID","CourseID") DO UPDATE SET "CourseName"=EXCLUDED."CourseName","Credits"=EXCLUDED."Credits","RecommendedSemester"=EXCLUDED."RecommendedSemester","IsRequired"=EXCLUDED."IsRequired","EntryKind"=EXCLUDED."EntryKind","PrerequisiteText"=EXCLUDED."PrerequisiteText"`,[id,r.courseId,r.name,r.credits,r.semester,r.isRequired,r.entryKind,r.prerequisiteText]);
}
export async function writePrerequisites(client:PoolClient,id:number,rows:Row[]) {
  await client.query('DELETE FROM "ProgramPrerequisiteMembers" WHERE "ProgramID"=$1',[id]);await client.query('DELETE FROM "ProgramPrerequisiteGroups" WHERE "ProgramID"=$1',[id]);
  for(const r of rows) {
    const group=(await client.query(`INSERT INTO "ProgramPrerequisiteGroups" ("ProgramID","ProgramCourseID","GroupCode","MinimumPassed") SELECT $1,"ProgramCourseID",$3,$4 FROM "ProgramCourses" WHERE "ProgramID"=$1 AND "CourseID"=$2 RETURNING "GroupID"`,[id,r.courseId,r.groupCode,r.minimumPassed])).rows[0];
    for(const m of r.prerequisiteCourseIds)await client.query('INSERT INTO "ProgramPrerequisiteMembers" ("ProgramID","GroupID","CourseID") VALUES ($1,$2,$3)',[id,group.GroupID,m]);
  }
  await client.query('UPDATE "TrainingPrograms" SET "PrerequisitesReviewed"=true WHERE "ProgramID"=$1',[id]);
}
export async function writeEquivalences(client:PoolClient,id:number,rows:Row[],actorId:number) {
  await client.query('DELETE FROM "ProgramCourseEquivalences" WHERE "ProgramID"=$1',[id]);
  for(const r of rows)await client.query(`INSERT INTO "ProgramCourseEquivalences" ("ProgramID","SourceCourseID","TargetCourseID","ConfirmedBy","Reason") VALUES ($1,$2,$3,$4,$5)`,[id,r.sourceCourseId,r.targetCourseId,actorId,r.reason]);
  await client.query('UPDATE "TrainingPrograms" SET "EquivalencesReviewed"=true WHERE "ProgramID"=$1',[id]);
}
export async function writeComboCourses(client:PoolClient,id:number,comboId:number,value:Row) {
  await client.query('DELETE FROM "ProgramSlotOptions" WHERE "ProgramComboID"=$1',[comboId]);await client.query('DELETE FROM "ComboCourseChoiceMembers" WHERE "ProgramComboID"=$1',[comboId]);await client.query('DELETE FROM "ComboCourseChoiceGroups" WHERE "ProgramComboID"=$1',[comboId]);
  await client.query('DELETE FROM "ComboCourses" WHERE "ProgramComboID"=$1 AND NOT ("CourseID"=ANY($2::int[]))',[comboId,value.courses.map((c:Row)=>c.courseId)]);
  const courseMap=new Map<number,number>();
  for(const c of value.courses) {
    const row=(await client.query(`INSERT INTO "ComboCourses" ("ProgramComboID","CourseID","CourseName","Credits","Semester","PrerequisiteText","Note") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ("ProgramComboID","CourseID") DO UPDATE SET "CourseName"=EXCLUDED."CourseName","Credits"=EXCLUDED."Credits","Semester"=EXCLUDED."Semester","PrerequisiteText"=EXCLUDED."PrerequisiteText","Note"=EXCLUDED."Note" RETURNING "ComboCourseID"`,[comboId,c.courseId,c.name,c.credits,c.semester,c.prerequisiteText,c.note])).rows[0];
    courseMap.set(c.courseId,row.ComboCourseID);
    for(const slot of c.slotCourseIds)await client.query(`INSERT INTO "ProgramSlotOptions" ("ProgramID","ProgramCourseID","ProgramComboID","ComboCourseID") SELECT $1,"ProgramCourseID",$3,$4 FROM "ProgramCourses" WHERE "ProgramID"=$1 AND "CourseID"=$2`,[id,slot,comboId,row.ComboCourseID]);
  }
  for(const g of value.choiceGroups) {
    const group=(await client.query(`INSERT INTO "ComboCourseChoiceGroups" ("ProgramComboID","GroupCode","MinCourses","MaxCourses") VALUES ($1,$2,$3,$4) RETURNING "ChoiceGroupID"`,[comboId,g.code,g.minCourses,g.maxCourses])).rows[0];
    for(const course of g.courseIds)await client.query(`INSERT INTO "ComboCourseChoiceMembers" ("ProgramComboID","ChoiceGroupID","ComboCourseID") VALUES ($1,$2,$3)`,[comboId,group.ChoiceGroupID,courseMap.get(course)]);
  }
  await client.query('UPDATE "ProgramCombos" SET "CoursesReviewed"=true WHERE "ProgramComboID"=$1',[comboId]);
}

// A subject can fill only one slot. Check choice-group capacity with a small max-flow network.
export function validateComboCapacity(value:Row) {
  const graph=new Map<string,Map<string,number>>();
  const edge=(a:string,b:string,n:number)=>{if(!graph.has(a))graph.set(a,new Map());if(!graph.has(b))graph.set(b,new Map());graph.get(a)!.set(b,n);graph.get(b)!.set(a,0);};
  let required=0;
  for(const [index,g] of value.choiceGroups.entries()) {
    const group=`group:${index}`;edge('source',group,g.maxCourses);required+=g.maxCourses;
    for(const id of g.courseIds)edge(group,`course:${id}`,1);
  }
  const slots=new Set<number>();
  for(const c of value.courses)for(const id of c.slotCourseIds){edge(`course:${c.courseId}`,`slot:${id}`,1);slots.add(id);}
  for(const id of slots)edge(`slot:${id}`,'sink',1);
  function augment(node:string,seen:Set<string>):boolean {
    if(node==='sink')return true;seen.add(node);
    for(const [next,capacity] of graph.get(node)??[])if(capacity>0&&!seen.has(next)&&augment(next,seen)){graph.get(node)!.set(next,capacity-1);graph.get(next)!.set(node,(graph.get(next)!.get(node)??0)+1);return true;}
    return false;
  }
  let flow=0;while(augment('source',new Set()))flow++;
  if(flow<required)throw invalid('Combo choice-group maximums cannot fit distinct curriculum slots. Review group limits and slot mappings.');
}
