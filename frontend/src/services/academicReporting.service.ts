import type { Cohort, CourseDemand, DemandReport, ReportPeriod, ReportScope,RetakeClassReport } from '@/types/education/reporting.types';
import API from './api';
import { cleanQuery, getAllItems, getPage } from './educationApi';

export const academicReportingService = {
  retakeClassProposals:async(blockPeriodId:number,scope:ReportScope,page:number,signal?:AbortSignal):Promise<RetakeClassReport>=>{
    const {academicPeriodId,...filters}=scope;
    void academicPeriodId;
    try{
      return (await API.get('/retake-class-proposals',{params:{...filters,blockPeriodId,page,limit:20},signal,timeout:30000})).data.data;
    }catch(error){
      const body=(error as {response?:{data?:{errorCode?:string}}}).response?.data;
      if(body?.errorCode==='BLOCK_BEFORE_PARENT_END')throw new Error('Block 3 phải bắt đầu sau khi kỳ học chính kết thúc. Vui lòng kiểm tra lịch đã cấu hình.');
      const messages:Record<string,string>={BLOCK3_REQUIRED:'Vui lòng chọn kỳ học loại Block 3.',BLOCK_PERIOD_NOT_FOUND:'Không tìm thấy kỳ Block 3 đã chọn.',BLOCK_PARENT_INVALID:'Kỳ Block 3 chưa được gắn đúng với học kỳ chính. Vui lòng đối soát cấu hình.',BLOCK_NOT_OPEN_FOR_PLANNING:'Kỳ Block 3 này không còn ở trạng thái có thể lập kế hoạch.',BLOCK_ALREADY_ENDED:'Kỳ Block 3 đã kết thúc. Vui lòng chọn kỳ sắp tới hoặc đang diễn ra.',BLOCK_DATES_INVALID:'Ngày bắt đầu và kết thúc Block 3 chưa hợp lệ.'};
      throw new Error(messages[body?.errorCode??'']??'Không tải được đề xuất mở lớp. Vui lòng kiểm tra kết nối và thử lại.');
    }
  },
  cohorts: (signal?: AbortSignal) => getAllItems<Cohort>('/cohorts', {}, signal),
  periods: (signal?: AbortSignal) => getAllItems<ReportPeriod>('/academic-periods', {}, signal),
  courseDemand: (scope: ReportScope, page: number, includeInProgress: boolean, signal?: AbortSignal) =>
    getPage<CourseDemand>('/course-demands', {
      ...scope, page, limit: 20, includeInProgress: String(includeInProgress),
    }, signal) as Promise<DemandReport>,
  exportCourseDemand: async (scope: ReportScope, includeInProgress = false) => {
    try {
      const response = await API.get<Blob>('/course-demands/export', {
        params: cleanQuery({ ...scope, includeInProgress: String(includeInProgress), format: 'csv' }),
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      // Axios returns JSON error bodies as blobs for a file download request.
      const body = (error as { response?: { data?: unknown } }).response?.data;
      if (body instanceof Blob) {
        let message: string | undefined;
        try { message = JSON.parse(await body.text()).message; } catch { /* Use the original HTTP error. */ }
        if (message) throw new Error(message);
      }
      throw error;
    }
  },
};

