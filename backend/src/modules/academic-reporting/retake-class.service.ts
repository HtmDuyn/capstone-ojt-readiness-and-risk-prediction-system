import { pool } from '../../config/database';
import { fingerprint } from '../eligibility/eligibility.service';
import { invalid,pagination,positiveId } from '../students/student.validation';
import { readReports } from './read-scope';
import { collectRetakeDemand,planRetakeClasses,RETAKE_CLASS_POLICY } from './retake-class-proposals';
import type { Row } from './report.repository';
import { previewBlockCalendar } from './block-calendar';

export async function retakeClassProposals(params:Row){
  const paging=pagination(params,['blockPeriodId','semesterPeriodId','ojtSemesterId','cohortId','programId','courseId']);
  if((params.blockPeriodId===undefined)===(params.semesterPeriodId===undefined))throw invalid('Provide exactly one of blockPeriodId or semesterPeriodId.',400,'PERIOD_SELECTION_REQUIRED');
  const preview=params.semesterPeriodId!==undefined;
  const periodId=positiveId(preview?params.semesterPeriodId:params.blockPeriodId,preview?'semesterPeriodId':'blockPeriodId');
  const courseId=params.courseId===undefined?null:positiveId(params.courseId,'courseId');
  const cacheable=['ojtSemesterId','programId','cohortId','comboId','groupCode','courseId'].every(key=>params[key]===undefined);
  if(!pool)throw invalid('Database is not configured.',503,'DATABASE_UNAVAILABLE');
  const client=await pool.connect();
  try{
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    // Serialize cache refreshes with academic writes; database invalidation triggers use the same lock.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('retake-class-proposal-snapshots'))");
    const c=client;
    let block=(await c.query('SELECT *,to_char("StartDate",\'YYYY-MM-DD\') AS "CalendarStart",to_char("EndDate",\'YYYY-MM-DD\') AS "CalendarEnd" FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[periodId])).rows[0];
    if(!block)throw invalid('Block period not found.',404,'BLOCK_PERIOD_NOT_FOUND');
    let calendarPreview:Row|null=null;
    if(preview){
      if(block.Kind!=='SEMESTER')throw invalid('semesterPeriodId must reference a regular semester.',400,'SEMESTER_REQUIRED');
      if(!['PLANNED','ACTIVE'].includes(block.Status))throw invalid('Select a planned or active semester.',409,'BLOCK_NOT_OPEN_FOR_PLANNING');
      let dates;try{dates=previewBlockCalendar(block.CalendarStart);}catch{throw invalid('Semester start date is invalid.',409,'BLOCK_DATES_INVALID');}
      const year=(await c.query('SELECT to_char("StartDate",\'YYYY-MM-DD\') AS start,to_char("EndDate",\'YYYY-MM-DD\') AS end FROM "AcademicYears" WHERE "AcademicYearID"=$1',[block.AcademicYearID])).rows[0];
      const next=(await c.query('SELECT to_char("StartDate",\'YYYY-MM-DD\') AS start FROM "AcademicPeriods" WHERE "Kind"=\'SEMESTER\' AND "StartDate">$1::date ORDER BY "StartDate" LIMIT 1',[dates.mainSemester.startDate])).rows[0];
      if(!year||dates.mainSemester.startDate<year.start||dates.block.endDate>year.end||dates.block.endDate>block.CalendarEnd||next&&dates.block.endDate>=next.start)
        throw invalid('Calculated Block must fit within the selected semester and academic year.',409,'CALCULATED_BLOCK_CONFLICT');
      calendarPreview={...dates,source:'CALCULATED',sourceSemesterId:periodId,storedSemesterEndDate:block.CalendarEnd,
        requiresCalendarReview:false};
      block={...block,AcademicPeriodID:null,ParentPeriodID:periodId,Kind:'BLOCK3',Status:'PLANNED',
        PeriodCode:`${block.PeriodCode}-BLOCK3-PREVIEW`,Name:`Block 3 - ${block.Name}`,StartDate:dates.block.startDate,EndDate:dates.block.endDate};
    }
    if(block.Kind!=='BLOCK3')throw invalid('Select an academic period of kind BLOCK3.',400,'BLOCK3_REQUIRED');
    const parent=(await c.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[block.ParentPeriodID])).rows[0];
    if(!parent||parent.Kind!=='SEMESTER'||parent.AcademicYearID!==block.AcademicYearID)
      throw invalid('Block 3 must have a valid parent semester.',409,'BLOCK_PARENT_INVALID');
    if(parent.Status!=='PLANNED'||new Date(parent.StartDate).toISOString().slice(0,10)<=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}))
      throw invalid('Select an upcoming semester.',409,'UPCOMING_SEMESTER_REQUIRED');
    if(block.Status!=='PLANNED')throw invalid('Select a planned Block 3.',409,'BLOCK_NOT_OPEN_FOR_PLANNING');
    if(!block.StartDate||!block.EndDate||new Date(block.EndDate)<new Date(block.StartDate))throw invalid('Block dates need review.',409,'BLOCK_DATES_INVALID');
    if(!preview&&(new Date(block.StartDate)<new Date(parent.StartDate)||new Date(block.EndDate)>new Date(parent.EndDate)))
      throw invalid('Block 3 must be within its parent semester.',409,'BLOCK_OUTSIDE_PARENT_SEMESTER');
    if(new Date(block.EndDate).getTime()+86400000<=Date.now())throw invalid('Select a Block 3 that has not ended.',409,'BLOCK_ALREADY_ENDED');
    if(courseId&&!(await c.query('SELECT 1 FROM "Courses" WHERE "CourseID"=$1',[courseId])).rowCount)throw invalid('Course not found.',404);
    const majorId=params.majorId===undefined?null:positiveId(params.majorId,'majorId');
    if(cacheable){
      const snapshot=(await c.query(`SELECT * FROM "RetakeClassProposalSnapshots"
        WHERE "AcademicPeriodID"=$1 AND "SpecializationID" IS NOT DISTINCT FROM $2 AND "Status"='CURRENT'
        ORDER BY "ComputedAt" DESC,"SnapshotID" DESC LIMIT 1`,[periodId,majorId])).rows[0];
      if(snapshot){
        const saved=(await c.query(`SELECT row."CourseID" AS "courseId",course."CourseCode" AS "courseCode",course."CourseName" AS "courseName",
          row."DemandStudentCount" AS "demandStudentCount",row."ProposedClassCount" AS "proposedClassCount"
          FROM "RetakeClassProposalSnapshotCourses" row JOIN "Courses" course ON course."CourseID"=row."CourseID"
          WHERE row."SnapshotID"=$1 ORDER BY row."ProposedClassCount" DESC,row."DemandStudentCount" DESC,course."CourseCode"`,[snapshot.SnapshotID])).rows;
        const items=saved.map((row:Row)=>({...row,...planRetakeClasses(Number(row.demandStudentCount))}));
        await c.query('COMMIT');
        return makeProposalResponse({params,paging,preview,periodId,block,calendarPreview,items,
          excludedStudentCount:snapshot.ExcludedStudentCount,unresolvedAlternativeStudentCount:snapshot.UnresolvedAlternativeStudentCount,
          page:paging.page,limit:paging.limit,computedAt:new Date(snapshot.ComputedAt).toISOString()});
      }
    }
    const {requested,data}=await readReports(c,{...params,academicPeriodId:periodId},['blockPeriodId','semesterPeriodId','courseId'],false,true);
    const demand=collectRetakeDemand(data);
    const items=demand.items.filter(r=>r.proposedClassCount>0&&(!courseId||r.courseId===courseId));
    const unresolvedAlternativeStudentCount=new Set(data.flatMap(d=>d.rows.filter((r:Row)=>r.alternativeRequirements.length).map((r:Row)=>r.studentId))).size;
    const computedAt=new Date();
    if(cacheable){
      const sourceFingerprint=fingerprint({periodId,majorId,sourceRows:data.map(report=>report.rows.map((row:Row)=>[row.studentId,row.sourceHash]))});
      const snapshot=(await c.query(`INSERT INTO "RetakeClassProposalSnapshots"
        ("AcademicPeriodID","SpecializationID","SourceFingerprint","ExcludedStudentCount","UnresolvedAlternativeStudentCount","ComputedAt")
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING "SnapshotID"`,[periodId,majorId,sourceFingerprint,demand.excludedStudentCount,unresolvedAlternativeStudentCount,computedAt])).rows[0];
      for(const item of items)await c.query(`INSERT INTO "RetakeClassProposalSnapshotCourses"
        ("SnapshotID","CourseID","DemandStudentCount","ProposedClassCount") VALUES ($1,$2,$3,$4)`,
        [snapshot.SnapshotID,item.courseId,item.demandStudentCount,item.proposedClassCount]);
    }
    const response=makeProposalResponse({params,paging,preview,periodId,block,calendarPreview,items,
      excludedStudentCount:demand.excludedStudentCount,unresolvedAlternativeStudentCount,page:paging.page,limit:paging.limit,computedAt:computedAt.toISOString(),scope:requested});
    await c.query('COMMIT');
    return response;
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{client.release();}
}

function makeProposalResponse(input:{params:Row;paging:Row;preview:boolean;periodId:number;block:Row;calendarPreview:Row|null;items:Row[];excludedStudentCount:number;unresolvedAlternativeStudentCount:number;page:number;limit:number;computedAt:string;scope?:Row}){
  const {params,paging,preview,periodId,block,calendarPreview,items,excludedStudentCount,unresolvedAlternativeStudentCount,page,limit,computedAt}=input;
  const courseId=params.courseId===undefined?null:Number(params.courseId);
  const filtered=courseId?items.filter(item=>item.courseId===courseId):items;
  return {scope:input.scope??{academicPeriodId:periodId,...(params.majorId===undefined?{}:{majorId:Number(params.majorId)})},calendarPreview,
    block:{id:preview?null:periodId,source:preview?'CALCULATED':'CONFIGURED',periodCode:block.PeriodCode,name:block.Name,parentPeriodId:block.ParentPeriodID,
      startDate:block.StartDate,endDate:block.EndDate,status:preview?'PREVIEW':block.Status},policy:RETAKE_CLASS_POLICY,
    summary:{courseCount:filtered.length,demandStudentCount:filtered.reduce((n,item)=>n+item.demandStudentCount,0),proposedClassCount:filtered.reduce((n,item)=>n+item.proposedClassCount,0),
      waitingStudentCourseCount:filtered.reduce((n,item)=>n+item.waitingStudentCount,0)},
    excludedStudentCount,unresolvedAlternativeStudentCount,
    limitations:['Số lớp đề xuất: 1 lớp khi nhu cầu từ 1–35 sinh viên; 2 lớp khi trên 35 sinh viên. Đây là số liệu tham khảo, không tự tạo lớp hoặc xác nhận đăng ký.',
      'Mỗi sinh viên chỉ được đếm một lần cho cùng môn trong Block đã chọn. Không tính môn đã đạt hoặc môn học lại đang học.',
      'Chỉ tính môn chưa đạt đã đến hạn trong lộ trình; trường hợp chưa xác định môn lựa chọn cần được đối soát riêng.',
      'Phòng đào tạo cần đối chiếu lớp đã tổ chức, điều kiện tiên quyết, lịch học và nhu cầu đăng ký thực tế trước khi quyết định.',
      'Kết quả được lưu làm bản chụp và tự đánh dấu cần tính lại khi dữ liệu học vụ nguồn thay đổi.'],
    total:filtered.length,page,limit,items:filtered.slice(paging.offset,paging.offset+paging.limit),computedAt};
}
