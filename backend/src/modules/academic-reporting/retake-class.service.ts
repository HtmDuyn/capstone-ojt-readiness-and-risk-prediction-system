import { readTransaction } from '../qhdn/read.repository';
import { invalid,pagination,positiveId } from '../students/student.validation';
import { readReports } from './read-scope';
import { collectRetakeDemand,RETAKE_CLASS_POLICY } from './retake-class-proposals';
import type { Row } from './report.repository';
import { previewBlockCalendar } from './block-calendar';

export async function retakeClassProposals(params:Row){
  const paging=pagination(params,['blockPeriodId','semesterPeriodId','ojtSemesterId','cohortId','programId','courseId']);
  if((params.blockPeriodId===undefined)===(params.semesterPeriodId===undefined))throw invalid('Provide exactly one of blockPeriodId or semesterPeriodId.',400,'PERIOD_SELECTION_REQUIRED');
  const preview=params.semesterPeriodId!==undefined;
  const periodId=positiveId(preview?params.semesterPeriodId:params.blockPeriodId,preview?'semesterPeriodId':'blockPeriodId');
  const courseId=params.courseId===undefined?null:positiveId(params.courseId,'courseId');
  return readTransaction(async c=>{
    let block=(await c.query('SELECT *,to_char("StartDate",\'YYYY-MM-DD\') AS "CalendarStart",to_char("EndDate",\'YYYY-MM-DD\') AS "CalendarEnd" FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[periodId])).rows[0];
    if(!block)throw invalid('Block period not found.',404,'BLOCK_PERIOD_NOT_FOUND');
    let calendarPreview:Row|null=null;
    if(preview){
      if(block.Kind!=='SEMESTER')throw invalid('semesterPeriodId must reference a regular semester.',400,'SEMESTER_REQUIRED');
      if(!['PLANNED','ACTIVE'].includes(block.Status))throw invalid('Select a planned or active semester.',409,'BLOCK_NOT_OPEN_FOR_PLANNING');
      let dates;try{dates=previewBlockCalendar(block.CalendarStart);}catch{throw invalid('Semester start date is invalid.',409,'BLOCK_DATES_INVALID');}
      const year=(await c.query('SELECT to_char("StartDate",\'YYYY-MM-DD\') AS start,to_char("EndDate",\'YYYY-MM-DD\') AS end FROM "AcademicYears" WHERE "AcademicYearID"=$1',[block.AcademicYearID])).rows[0];
      const next=(await c.query('SELECT to_char("StartDate",\'YYYY-MM-DD\') AS start FROM "AcademicPeriods" WHERE "Kind"=\'SEMESTER\' AND "StartDate">$1::date ORDER BY "StartDate" LIMIT 1',[dates.mainSemester.startDate])).rows[0];
      if(!year||dates.mainSemester.startDate<year.start||dates.block.endDate>year.end||next&&dates.block.endDate>=next.start)
        throw invalid('Calculated Block overlaps the next semester or leaves the academic year. Review the calendar.',409,'CALCULATED_BLOCK_CONFLICT');
      calendarPreview={...dates,source:'CALCULATED',sourceSemesterId:periodId,storedSemesterEndDate:block.CalendarEnd,
        requiresCalendarReview:block.CalendarEnd!==dates.mainSemester.endDate};
      block={...block,AcademicPeriodID:null,ParentPeriodID:periodId,Kind:'BLOCK3',Status:'PLANNED',
        PeriodCode:`${block.PeriodCode}-BLOCK3-PREVIEW`,Name:`Block 3 - ${block.Name}`,StartDate:dates.block.startDate,EndDate:dates.block.endDate};
    }
    if(block.Kind!=='BLOCK3')throw invalid('Select an academic period of kind BLOCK3.',400,'BLOCK3_REQUIRED');
    const parent=(await c.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[block.ParentPeriodID])).rows[0];
    if(!parent||parent.Kind!=='SEMESTER'||parent.AcademicYearID!==block.AcademicYearID)
      throw invalid('Block 3 must have a valid parent semester.',409,'BLOCK_PARENT_INVALID');
    if(!['PLANNED','ACTIVE'].includes(block.Status))throw invalid('Select a planned or active Block 3.',409,'BLOCK_NOT_OPEN_FOR_PLANNING');
    if(!block.StartDate||!block.EndDate||new Date(block.EndDate)<new Date(block.StartDate))throw invalid('Block dates need review.',409,'BLOCK_DATES_INVALID');
    if(!preview&&(!parent.EndDate||new Date(block.StartDate)<=new Date(parent.EndDate)))
      throw invalid('Block 3 must start after its parent semester ends.',409,'BLOCK_BEFORE_PARENT_END');
    if(new Date(block.EndDate).getTime()+86400000<=Date.now())throw invalid('Select a Block 3 that has not ended.',409,'BLOCK_ALREADY_ENDED');
    if(courseId&&!(await c.query('SELECT 1 FROM "Courses" WHERE "CourseID"=$1',[courseId])).rowCount)throw invalid('Course not found.',404);
    const {requested,data}=await readReports(c,{...params,academicPeriodId:periodId},['blockPeriodId','semesterPeriodId','courseId'],false);
    const demand=collectRetakeDemand(data);
    const items=demand.items.filter(r=>!courseId||r.courseId===courseId);
    return {scope:requested,calendarPreview,block:{id:preview?null:periodId,source:preview?'CALCULATED':'CONFIGURED',periodCode:block.PeriodCode,name:block.Name,parentPeriodId:block.ParentPeriodID,
      startDate:block.StartDate,endDate:block.EndDate,status:preview?'PREVIEW':block.Status},policy:RETAKE_CLASS_POLICY,
      summary:{courseCount:items.length,proposedClassCount:items.reduce((n,r)=>n+r.proposedClassCount,0),
        waitingStudentCourseCount:items.reduce((n,r)=>n+r.waitingStudentCount,0)},
      excludedStudentCount:demand.excludedStudentCount,
      unresolvedAlternativeStudentCount:new Set(data.flatMap(d=>d.rows.filter((r:Row)=>r.alternativeRequirements.length).map((r:Row)=>r.studentId))).size,
      limitations:['Đề xuất chuẩn bị mở lớp, không tự tạo lớp hoặc xác nhận đăng ký của sinh viên.',
        'Mỗi sinh viên chỉ được đếm một lần cho cùng môn trong Block đã chọn. Không tính môn đã đạt hoặc môn học lại đang học.',
        'Chỉ tính môn chưa đạt đã đến hạn trong lộ trình; trường hợp chưa xác định môn lựa chọn cần được đối soát riêng.',
        'Phòng đào tạo cần đối chiếu lớp đã tổ chức, điều kiện tiên quyết, lịch học và nhu cầu đăng ký thực tế trước khi quyết định.',
        'Số lượng được tính lại khi tải báo cáo; chưa có thông báo tự động khi vượt ngưỡng.'],
      total:items.length,page:paging.page,limit:paging.limit,items:items.slice(paging.offset,paging.offset+paging.limit),computedAt:new Date().toISOString()};
  });
}
