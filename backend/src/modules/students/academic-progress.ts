import type { PoolClient } from 'pg';
import { invalid } from './student.validation';
import { resultSelect } from './student.service';

type Row=Record<string,any>;
const excludedOjtCredit = /(?:\bGDTC\b|\bGDQP\b|\bQPAN\b|\bPE\b|PHE[_ -]?COM|\bphysical\s+education\b|\bmilitary\b|quoc\s+phong|giao\s+duc\s+the\s+chat|the\s+duc|nhac\s+cu|musical\s+instrument)/i;
const normalizedCourseText=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d');
// Pure calculation: no guessed passing threshold, conversion scale, or legacy global course credits.
export function calculateProgress(program:Row|undefined,courses:Row[],attempts:Row[],aliases:Row[],options:Row[],policy:Row|undefined,configurationIssues:string[]=[],curriculumGradeWeights:Row[]=[],requireConfirmedSlotChoices=true) {
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
      if (requireConfirmedSlotChoices && !choices.length) issues.push(`SLOT_CHOICES_UNCONFIRMED:${c.ProgramCourseID}`);
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
  let earned=0,ojtEarned=0;const weights=new Map<number,number>();
  for (const r of requirements) {
    const key=byRequirement.get(r.id);
    r.completed=key!==undefined;r.matchedCourseId=key??null;
    const selected=key===undefined?null:[...courses,...options].find(course=>Number(course.CourseID)===key);
    const courseDescription=`${selected?.CourseCatalogName??''} ${selected?.ChosenCourseName??''} ${selected?.CourseName??r.name??''} ${selected?.CourseCode??r.courseCode??''}`;
    r.excludedFromOjtCredits=excludedOjtCredit.test(normalizedCourseText(courseDescription))||/(?:^|[\s._-])PE\s*\d+\b/i.test(courseDescription);
    if (key!==undefined && r.credits!==null) {earned+=r.credits;if(!r.excludedFromOjtCredits)ojtEarned+=r.credits;weights.set(key,r.credits);}
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
  // OJT credits come from passed course history, including combo courses whose
  // curriculum slot option was never mapped. Unknown course weights are omitted.
  const physicalEducationCourses=new Set<number>(curriculumGradeWeights
    .filter(r=>/^PHE_COM/i.test(String(r.ComboCode??'')))
    .map(r=>canonical(Number(r.CourseID))).filter(id=>id>0));
  let historyOjtEarned=0;
  for (const key of achieved) {
    const credit=weights.get(key);
    if (credit===undefined) continue;
    const description=(groups.get(key)??[]).map(r=>`${r.courseName??''} ${r.courseCode??''}`).join(' ');
    if (physicalEducationCourses.has(key) || excludedOjtCredit.test(normalizedCourseText(description)) || /(?:^|[\s._-])PE\s*\d+\b/i.test(description)) continue;
    historyOjtEarned+=credit;
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
    // Scores and credits are stored to two decimal places. Integer accumulation
    // prevents a mathematical 7.305 GPA from rounding down to 7.30 in binary floats.
    numerator+=Math.round(Number(value)*100)*Math.round(credit*100);denominator+=Math.round(credit*100);
    gpaCourses.push({courseId:key,resultId:latest.id,score:value,credits:credit});
  }
  const total=program.TotalCredits==null?null:Number(program.TotalCredits);
  if (total===null || total<=0) issues.push('PROGRAM_TOTAL_CREDITS_MISSING');
  if (total!==null && earned>total) issues.push('EARNED_CREDITS_EXCEED_PROGRAM_TOTAL');
  const allIssues=[...new Set([...issues,...gpaIssues])];
  return {program:{id:program.ProgramID,code:program.ProgramCode,version:program.Version},status:allIssues.length?'INSUFFICIENT_CONFIGURATION':'CALCULATED',retakePolicy:'LATEST',gpa:gpaIssues.length || issues.length || !denominator?null:Math.round(numerator/denominator)/100,gpaScale:scale??null,gpaCredits:denominator/100,gpaCourses,credits:{earned,total,remaining:total===null || issues.length?null:Math.max(0,total-earned),ojtEarned:Math.round(ojtEarned*100)/100,historyOjtEarned:Math.round(historyOjtEarned*100)/100,completeConfiguration:issues.length===0},issues:allIssues,requirements,unmappedAchievements:[...achieved].filter(id=>!matched.has(id)),computedAt:new Date().toISOString()};
}
export async function loadAcademicProgress(client:PoolClient, studentId:number,prospective?:{comboId:number;courseIds:number[]},studyCutoff?:string) {
    const {rows:[curriculum]}=await client.query<{
      program: Row | null; policy: Row | null; courses: Row[]; aliases: Row[];
      options: Row[]; invalidGroups: number[]; gradeWeights: Row[];
    }>(`WITH curriculum AS (
      SELECT "ProgramID" FROM "Students" WHERE "StudentID"=$1
    ), courses AS (
      SELECT pc.*, c."CourseCode",c."CourseName" AS "CourseCatalogName" FROM "ProgramCourses" pc JOIN curriculum USING ("ProgramID")
      JOIN "Courses" c USING ("CourseID")
    ), selections AS (
      SELECT "SelectionID","SelectionPurpose","ProgramID","ProgramComboID"
      FROM "StudentComboSelections" WHERE "StudentID"=$1 AND "ConfirmedAt" IS NOT NULL
        AND ($2::int IS NULL OR "SelectionPurpose"<>'SPECIALIZATION')
        AND ($4::timestamp IS NULL OR "ConfirmedAt" AT TIME ZONE 'Asia/Ho_Chi_Minh'<=$4::timestamp)
    ), options AS (
      SELECT sc."SelectionPurpose", opt."ProgramCourseID", cc."CourseID", cc."Credits"::text AS "Credits",course."CourseCode",course."CourseName" AS "CourseCatalogName",cc."CourseName" AS "ChosenCourseName"
      FROM selections sc JOIN "StudentComboCourseSelections" choice USING ("SelectionID")
      JOIN "ComboCourses" cc USING ("ComboCourseID")
      JOIN "Courses" course USING ("CourseID")
      JOIN "ProgramSlotOptions" opt ON opt."ProgramID"=sc."ProgramID"
        AND opt."ProgramComboID"=sc."ProgramComboID" AND opt."ComboCourseID"=cc."ComboCourseID"
      WHERE sc."ProgramID"=(SELECT "ProgramID" FROM curriculum)
      UNION ALL
      SELECT 'SPECIALIZATION', opt."ProgramCourseID",cc."CourseID",cc."Credits"::text,course."CourseCode",course."CourseName",cc."CourseName"
      FROM "ProgramSlotOptions" opt JOIN "ComboCourses" cc USING ("ComboCourseID")
      JOIN "Courses" course USING ("CourseID")
      WHERE opt."ProgramID"=(SELECT "ProgramID" FROM curriculum) AND opt."ProgramComboID"=$2 AND cc."CourseID"=ANY($3::int[])
    ), invalid_groups AS (
      SELECT g."ChoiceGroupID" FROM selections sc
      JOIN "ComboCourseChoiceGroups" g USING ("ProgramComboID")
      LEFT JOIN "ComboCourseChoiceMembers" m USING ("ChoiceGroupID")
      LEFT JOIN "StudentComboCourseSelections" choice ON choice."SelectionID"=sc."SelectionID" AND choice."ComboCourseID"=m."ComboCourseID"
      GROUP BY g."ChoiceGroupID",g."MinCourses",g."MaxCourses"
      HAVING count(choice."ComboCourseID") NOT BETWEEN g."MinCourses" AND g."MaxCourses"
    ), slot_families AS (
      SELECT pc."ProgramID",pc."RecommendedSemester",pc."Credits",
        CASE WHEN left(upper(c."CourseCode"),11)='SE-2026_COM' THEN 'SE_COM'
             ELSE regexp_replace(upper(c."CourseCode"),'\\*.*$','') END AS "Family"
      FROM "ProgramCourses" pc JOIN "Courses" c USING ("CourseID")
      WHERE pc."EntryKind"='COMBO_SLOT'
    ), slot_weights AS (
      SELECT "ProgramID","RecommendedSemester","Family",min("Credits") AS "Credits",
        count(DISTINCT "Credits") AS "CreditVariants"
      FROM slot_families GROUP BY "ProgramID","RecommendedSemester","Family"
    ), weights AS (
      SELECT cc."CourseID",coalesce(cc."Credits",CASE WHEN sw."CreditVariants"=1 THEN sw."Credits" END)::text AS "Credits",pcmb."ComboCode"
      FROM "ComboCourses" cc JOIN "ProgramCombos" pcmb USING ("ProgramComboID")
      LEFT JOIN slot_weights sw ON sw."ProgramID"=pcmb."ProgramID" AND sw."RecommendedSemester"=cc."Semester"
        AND sw."Family"=CASE WHEN left(upper(pcmb."ComboCode"),11)='SE-2026_COM' THEN 'SE_COM'
          ELSE split_part(upper(pcmb."ComboCode"),'_COM',1)||'_COM' END
      WHERE pcmb."ProgramID"=(SELECT "ProgramID" FROM curriculum) AND pcmb."CoursesReviewed"=true
    )
    SELECT (SELECT row_to_json(p) FROM "TrainingPrograms" p WHERE p."ProgramID"=curriculum."ProgramID") AS program,
      (SELECT row_to_json(p) FROM "AcademicGradingPolicies" p WHERE p."ProgramID"=curriculum."ProgramID") AS policy,
      coalesce((SELECT json_agg(courses ORDER BY "ProgramCourseID") FROM courses),'[]') AS courses,
      coalesce((SELECT json_agg(eq ORDER BY eq."SourceCourseID") FROM "ProgramCourseEquivalences" eq
        WHERE eq."ProgramID"=curriculum."ProgramID"),'[]') AS aliases,
      coalesce((SELECT json_agg(options) FROM options),'[]') AS options,
      ARRAY(SELECT "ChoiceGroupID" FROM invalid_groups ORDER BY "ChoiceGroupID") AS "invalidGroups",
      coalesce((SELECT json_agg(weights) FROM weights),'[]') AS "gradeWeights" FROM curriculum`,
      [studentId,prospective?.comboId??null,prospective?.courseIds??[],studyCutoff??null]);
    if (!curriculum) throw invalid('Student not found.',404,'STUDENT_NOT_FOUND');
    const {courses,aliases,options,invalidGroups,gradeWeights}=curriculum;
    const program=curriculum.program??undefined, policy=curriculum.policy??undefined;
    const attempts=(await client.query(`${resultSelect} WHERE r."StudentID"=$1${studyCutoff ? ' AND p."StartDate"<=$2::timestamp' : ''}`,studyCutoff ? [studentId,studyCutoff] : [studentId])).rows;
    const issues=invalidGroups.map(id=>`COMBO_CHOICE_GROUP_INVALID:${id}`);
    if (studyCutoff && (await client.query(`SELECT EXISTS(SELECT 1 FROM "StudentCourseResults" r
      LEFT JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=r."AcademicPeriodID"
      WHERE r."StudentID"=$1 AND p."AcademicPeriodID" IS NULL) AS missing`, [studentId])).rows[0].missing)
      issues.push('STUDY_RESULT_PERIOD_MISSING');
    return {studentId,program,courses,attempts,aliases,options:invalidGroups.length?[]:options,policy,issues,gradeWeights};
}

export type AcademicProgressData = Awaited<ReturnType<typeof loadAcademicProgress>>;
export function progressFromData(data:AcademicProgressData,assumeInProgressPassed=false,requireConfirmedSlotChoices=true) {
  const {studentId,program,courses,attempts,aliases,options,policy,issues,gradeWeights}=data;
  const grades=assumeInProgressPassed?attempts.map(r=>r.status==='IN_PROGRESS'?{...r,status:'RECOGNIZED'}:r):attempts;
  return {studentId,...calculateProgress(program,courses,grades,aliases,options,policy,issues,gradeWeights,requireConfirmedSlotChoices)};
}
export async function academicProgressWithClient(client:PoolClient,studentId:number,prospective?:{comboId:number;courseIds:number[]},assumeInProgressPassed=false) {
  return progressFromData(await loadAcademicProgress(client,studentId,prospective),assumeInProgressPassed);
}
