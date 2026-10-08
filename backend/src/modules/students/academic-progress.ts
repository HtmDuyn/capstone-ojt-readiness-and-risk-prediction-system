import type { PoolClient } from 'pg';
import { pool } from '../../config/database';
import { invalid } from './student.validation';
import { resultSelect } from './student.service';

type Row=Record<string,any>;
// Pure calculation: no guessed passing threshold, conversion scale, or legacy global course credits.
export function calculateProgress(program:Row|undefined,courses:Row[],attempts:Row[],aliases:Row[],options:Row[],policy:Row|undefined,configurationIssues:string[]=[],curriculumGradeWeights:Row[]=[]) {
  const issues=[...configurationIssues];
  if (!program) return {status:'INSUFFICIENT_CONFIGURATION',gpa:null,retakePolicy:'LATEST',credits:{earned:0,total:null,remaining:null},issues:['STUDENT_PROGRAM_NOT_ASSIGNED'],requirements:[]};
  if (program.Status !== undefined && program.Status !== 'PUBLISHED') issues.push('CURRICULUM_NOT_PUBLISHED');
  const mapping=new Map<number,number>(aliases.map(a=>[a.SourceCourseID,a.TargetCourseID]));
  const canonical=(id:number):number=>{
    const seen=new Set<number>();
    while (mapping.has(id)) {if (seen.has(id)) {issues.push('COURSE_EQUIVALENCE_CYCLE');return -1;}seen.add(id);id=mapping.get(id)!;}
    return id;
  };
  const requirements:Row[]=[],normal=new Map<number,Row>();
  for (const c of courses) {
    if (c.IsRequired==null) issues.push(`REQUIREMENT_UNCONFIRMED:${c.ProgramCourseID}`);
    if (c.EntryKind==='COURSE') {
      const key=canonical(c.CourseID);
      if (key<0) continue;
      const previous=normal.get(key);
      if (previous) {
        previous.required=previous.required===true || c.IsRequired===true;
        if (previous.credits===null || c.Credits===null || Number(previous.credits)!==Number(c.Credits)) {issues.push(`EQUIVALENT_CREDIT_CONFLICT:${key}`);previous.credits=null;}
        continue;
      }
      const r={id:c.ProgramCourseID,courseId:key,courseCode:c.CourseCode,name:c.CourseName,kind:c.EntryKind,credits:c.Credits===null?null:Number(c.Credits),required:c.IsRequired,choices:[key]};
      normal.set(key,r);requirements.push(r);
    } else {
      const allowed=options.filter(o=>o.ProgramCourseID===c.ProgramCourseID);
      const choices=[...new Set<number>(allowed.map(o=>canonical(o.CourseID)).filter(id=>id>0))].sort((a,b)=>a-b);
      let credits=c.Credits===null?null:Number(c.Credits);
      if (credits===null) {
        const weights=new Set(allowed.map(o=>o.Credits===null?null:Number(o.Credits)));
        if (weights.size===1 && !weights.has(null)) credits=[...weights][0] as number;
      }
      if (!choices.length) issues.push(`SLOT_CHOICES_UNCONFIRMED:${c.ProgramCourseID}`);
      requirements.push({id:c.ProgramCourseID,courseId:null,courseCode:c.CourseCode,name:c.CourseName,kind:c.EntryKind,credits,required:c.IsRequired,choices});
    }
  }
  for (const r of requirements) if (r.credits===null) issues.push(`COURSE_CREDITS_MISSING:${r.id}`);
  if (!requirements.length) issues.push('PROGRAM_COURSES_MISSING');
  const groups=new Map<number,Row[]>();
  for (const a of attempts) {
    if (!['PASSED','FAILED','IN_PROGRESS','WITHDRAWN','RECOGNIZED'].includes(a.status)) issues.push(`LEGACY_RESULT_STATUS:${a.id}`);
    const key=canonical(a.courseId);if (key<0) continue;
    groups.set(key,[...(groups.get(key)??[]),a]);
  }
  const achieved=new Set([...groups].filter(([,rows])=>rows.some(r=>['PASSED','RECOGNIZED'].includes(r.status))).map(([key])=>key));
  // Bipartite matching gives each achievement at most one curriculum requirement.
  // Higher-credit / required requirements are considered first; augmenting paths preserve earlier matches.
  const matched=new Map<number,Row>();
  const assign=(r:Row,seen:Set<number>):boolean=>{
    for (const course of r.choices as number[]) {
      if (!achieved.has(course) || seen.has(course)) continue;
      seen.add(course);
      const previous=matched.get(course);
      if (!previous || assign(previous,seen)) {matched.set(course,r);return true;}
    }
    return false;
  };
  [...requirements].sort((a,b)=>Number(b.required===true)-Number(a.required===true)||(b.credits??0)-(a.credits??0)).forEach(r=>assign(r,new Set()));
  const byRequirement=new Map([...matched].map(([course,r])=>[r.id,course]));
  let earned=0;const weights=new Map<number,number>();
  for (const r of requirements) {
    const key=byRequirement.get(r.id);
    r.completed=key!==undefined;r.matchedCourseId=key??null;
    if (key!==undefined && r.credits!==null) {earned+=r.credits;weights.set(key,r.credits);}
    if (r.kind==='COURSE' && r.credits!==null) weights.set(r.courseId,r.credits);
  }
  // Failed slot subjects still contribute to GPA when the approved slot supplies a unique credit weight.
  for (const key of groups.keys()) if (!weights.has(key)) {
    const possible=requirements.filter(r=>r.choices.includes(key) && r.credits!==null);
    if (new Set(possible.map(r=>r.credits)).size===1) weights.set(key,possible[0].credits);
  }
  // Completed subjects from a previous combo retain their confirmed curriculum GPA weights.
  // This does not make them fulfill the newly selected combo's credit slots.
  for (const key of groups.keys()) if (!weights.has(key)) {
    const known=curriculumGradeWeights.filter(r=>canonical(r.CourseID)===key && r.Credits!==null).map(r=>Number(r.Credits));
    if(new Set(known).size===1) weights.set(key,known[0]);
  }
  const gpaIssues:string[]=[];
  if (!policy) gpaIssues.push('GPA_SCALE_NOT_CONFIGURED');
  const scale=policy?.GpaScale;
  let numerator=0,denominator=0;
  const gpaCourses:Row[]=[];
  for (const [key,rows] of groups) {
    const graded=rows.filter(r=>['PASSED','FAILED'].includes(r.status));
    if (!graded.length) continue;
    if (graded.some(r=>!r.periodStartDate)) {gpaIssues.push(`RESULT_PERIOD_MISSING:${key}`);continue;}
    graded.sort((a,b)=>new Date(b.periodStartDate).getTime()-new Date(a.periodStartDate).getTime()||b.attemptNumber-a.attemptNumber||b.id-a.id);
    // In-progress and recognized records do not replace a completed graded attempt.
    const latest=graded[0],value=scale===4?latest.gradePoints:latest.score,credit=weights.get(key);
    if (credit===undefined) {gpaIssues.push(`GPA_CREDIT_UNMAPPED:${key}`);continue;}
    if (value===null || value===undefined || !Number.isFinite(Number(value))) {gpaIssues.push(`GPA_SCORE_MISSING:${latest.id}`);continue;}
    numerator+=Number(value)*credit;denominator+=credit;
    gpaCourses.push({courseId:key,resultId:latest.id,score:value,credits:credit});
  }
  const total=program.TotalCredits==null?null:Number(program.TotalCredits);
  if (total===null || total<=0) issues.push('PROGRAM_TOTAL_CREDITS_MISSING');
  if (total!==null && earned>total) issues.push('EARNED_CREDITS_EXCEED_PROGRAM_TOTAL');
  const allIssues=[...new Set([...issues,...gpaIssues])];
  return {program:{id:program.ProgramID,code:program.ProgramCode,version:program.Version},status:allIssues.length?'INSUFFICIENT_CONFIGURATION':'CALCULATED',retakePolicy:'LATEST',gpa:gpaIssues.length || issues.length || !denominator?null:Math.round(numerator/denominator*100)/100,gpaScale:scale??null,gpaCredits:denominator,gpaCourses,credits:{earned,total,remaining:total===null || issues.length?null:Math.max(0,total-earned),completeConfiguration:issues.length===0},issues:allIssues,requirements,unmappedAchievements:[...achieved].filter(id=>!matched.has(id)),computedAt:new Date().toISOString()};
}
export async function academicProgressWithClient(client:PoolClient, studentId:number) {
    const s=(await client.query('SELECT * FROM "Students" WHERE "StudentID"=$1',[studentId])).rows[0];
    if (!s) throw invalid('Student not found.',404,'STUDENT_NOT_FOUND');
    const program=(await client.query('SELECT * FROM "TrainingPrograms" WHERE "ProgramID"=$1',[s.ProgramID])).rows[0];
    const courses=(await client.query('SELECT pc.*,c."CourseCode" FROM "ProgramCourses" pc JOIN "Courses" c ON c."CourseID"=pc."CourseID" WHERE pc."ProgramID"=$1 ORDER BY pc."ProgramCourseID"',[s.ProgramID])).rows;
    const attempts=(await client.query(`${resultSelect} WHERE r."StudentID"=$1`,[studentId])).rows;
    const aliases=(await client.query('SELECT * FROM "ProgramCourseEquivalences" WHERE "ProgramID"=$1',[s.ProgramID])).rows;
    const policy=(await client.query('SELECT * FROM "AcademicGradingPolicies" WHERE "ProgramID"=$1',[s.ProgramID])).rows[0];
    const options=(await client.query(`SELECT opt."ProgramCourseID",cc."CourseID",cc."Credits" FROM "StudentComboSelections" sc JOIN "StudentComboCourseSelections" choice ON choice."SelectionID"=sc."SelectionID" JOIN "ComboCourses" cc ON cc."ComboCourseID"=choice."ComboCourseID" JOIN "ProgramSlotOptions" opt ON opt."ProgramID"=sc."ProgramID" AND opt."ProgramComboID"=sc."ProgramComboID" AND opt."ComboCourseID"=cc."ComboCourseID" WHERE sc."StudentID"=$1 AND sc."ProgramID"=$2 AND sc."ConfirmedAt" IS NOT NULL`,[studentId,s.ProgramID])).rows;
    const invalidGroups=(await client.query(`SELECT g."ChoiceGroupID" FROM "StudentComboSelections" sc JOIN "ComboCourseChoiceGroups" g ON g."ProgramComboID"=sc."ProgramComboID" LEFT JOIN "ComboCourseChoiceMembers" m ON m."ChoiceGroupID"=g."ChoiceGroupID" LEFT JOIN "StudentComboCourseSelections" c ON c."SelectionID"=sc."SelectionID" AND c."ComboCourseID"=m."ComboCourseID" WHERE sc."StudentID"=$1 AND sc."ConfirmedAt" IS NOT NULL GROUP BY g."ChoiceGroupID",g."MinCourses",g."MaxCourses" HAVING count(c."ComboCourseID")<g."MinCourses" OR count(c."ComboCourseID")>g."MaxCourses"`,[studentId])).rows;
    const issues=invalidGroups.map(r=>`COMBO_CHOICE_GROUP_INVALID:${r.ChoiceGroupID}`);
    const gradeWeights=(await client.query(`SELECT cc."CourseID",cc."Credits" FROM "ComboCourses" cc JOIN "ProgramCombos" c ON c."ProgramComboID"=cc."ProgramComboID" WHERE c."ProgramID"=$1 AND c."CoursesReviewed"=true`,[s.ProgramID])).rows;
    const output=calculateProgress(program,courses,attempts,aliases,invalidGroups.length?[]:options,policy,issues,gradeWeights);
    return {studentId,...output};
}
export async function academicProgress(studentId:number) {
  if (!pool) throw invalid('Database is unavailable.',503);
  const client=await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const output=await academicProgressWithClient(client,studentId);
    await client.query('COMMIT');return output;
  } catch(error) {await client.query('ROLLBACK');throw error;} finally {client.release();}
}
