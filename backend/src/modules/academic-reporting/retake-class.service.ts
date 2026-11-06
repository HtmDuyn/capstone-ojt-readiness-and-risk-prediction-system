import { readTransaction } from '../qhdn/read.repository';
import { invalid,pagination,positiveId } from '../students/student.validation';
import { readReports } from './read-scope';
import { collectRetakeDemand,RETAKE_CLASS_POLICY } from './retake-class-proposals';
import type { Row } from './report.repository';

export async function retakeClassProposals(params:Row){
  const paging=pagination(params,['blockPeriodId','ojtSemesterId','cohortId','programId','courseId']);
  const blockId=positiveId(params.blockPeriodId,'blockPeriodId');
  const courseId=params.courseId===undefined?null:positiveId(params.courseId,'courseId');
  return readTransaction(async c=>{
    const block=(await c.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[blockId])).rows[0];
    if(!block)throw invalid('Block period not found.',404,'BLOCK_PERIOD_NOT_FOUND');
    if(block.Kind!=='BLOCK3')throw invalid('Select an academic period of kind BLOCK3.',400,'BLOCK3_REQUIRED');
    const parent=(await c.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[block.ParentPeriodID])).rows[0];
    if(!parent||parent.Kind!=='SEMESTER'||parent.AcademicYearID!==block.AcademicYearID)
      throw invalid('Block 3 must have a valid parent semester.',409,'BLOCK_PARENT_INVALID');
    if(!['PLANNED','ACTIVE'].includes(block.Status))throw invalid('Select a planned or active Block 3.',409,'BLOCK_NOT_OPEN_FOR_PLANNING');
    if(!block.StartDate||!block.EndDate||new Date(block.EndDate)<new Date(block.StartDate))throw invalid('Block dates need review.',409,'BLOCK_DATES_INVALID');
    if(!parent.EndDate||new Date(block.StartDate)<=new Date(parent.EndDate))
      throw invalid('Block 3 must start after its parent semester ends.',409,'BLOCK_BEFORE_PARENT_END');
    if(new Date(block.EndDate).getTime()+86400000<=Date.now())throw invalid('Select a Block 3 that has not ended.',409,'BLOCK_ALREADY_ENDED');
    if(courseId&&!(await c.query('SELECT 1 FROM "Courses" WHERE "CourseID"=$1',[courseId])).rowCount)throw invalid('Course not found.',404);
    const {requested,data}=await readReports(c,{...params,academicPeriodId:blockId},['blockPeriodId','courseId']);
    const demand=collectRetakeDemand(data);
    const items=demand.items.filter(r=>!courseId||r.courseId===courseId);
    return {scope:requested,block:{id:blockId,periodCode:block.PeriodCode,name:block.Name,parentPeriodId:block.ParentPeriodID,
      startDate:block.StartDate,endDate:block.EndDate,status:block.Status},policy:RETAKE_CLASS_POLICY,
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
