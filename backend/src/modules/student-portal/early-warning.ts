type WarningInput = {
  currentSemester: number | null;
  earnedCredits: number | null;
  completeConfiguration: boolean;
  issues: string[];
  eligibilityStatus: string;
  missingCredits: number | null;
  failedCourseCount: number;
};

// Early monitoring is separate from the official OJT decision and is not a risk model.
export function earlyWarning(input: WarningInput) {
  const reasons: string[] = [];
  const semesterValid = Number.isInteger(input.currentSemester) && input.currentSemester! >= 0 && input.currentSemester! <= 9;
  if (!semesterValid) reasons.push('CURRENT_SEMESTER_UNAVAILABLE');
  else if (input.currentSemester! < 2) reasons.push('BEFORE_SEMESTER_2');
  const creditsValid = typeof input.earnedCredits === 'number' && Number.isFinite(input.earnedCredits) && input.earnedCredits >= 0;
  if (!creditsValid) reasons.push('EARNED_CREDITS_UNAVAILABLE');
  else if (input.earnedCredits === 0) reasons.push('NO_EARNED_CREDITS');
  if (!input.completeConfiguration || input.issues.length || !['ELIGIBLE', 'NOT_ELIGIBLE'].includes(input.eligibilityStatus)) {
    reasons.push('ACADEMIC_DATA_INVALID');
  }
  const available = reasons.length === 0;
  let message: string;
  if (!available) {
    const descriptions: Record<string,string> = {
      CURRENT_SEMESTER_UNAVAILABLE:'Chưa xác định được kỳ học hiện tại theo lộ trình.',
      BEFORE_SEMESTER_2:'Theo dõi sớm chỉ bắt đầu từ kỳ 2.',
      EARNED_CREDITS_UNAVAILABLE:'Dữ liệu tín chỉ tích lũy chưa hợp lệ.',
      NO_EARNED_CREDITS:'Bạn chưa có tín chỉ tích lũy để theo dõi sớm.',
      ACADEMIC_DATA_INVALID:'Dữ liệu học vụ hoặc quy tắc xét OJT cần được kiểm tra, đối soát trước khi tư vấn.',
    };
    message=reasons.map(reason=>descriptions[reason]).join(' ');
  } else if (input.eligibilityStatus === 'ELIGIBLE') {
    message=`Bạn đã tích lũy ${input.earnedCredits} tín chỉ và còn ${input.failedCourseCount} môn chưa đạt, hiện đáp ứng ngưỡng tín chỉ và số môn nợ để xét OJT. Kết quả chính thức phụ thuộc đợt xét và xác nhận của nhà trường.`;
  } else {
    const details=[`Bạn đang ở kỳ ${input.currentSemester}, đã tích lũy ${input.earnedCredits} tín chỉ.`];
    if(input.missingCredits!==null && input.missingCredits>0)details.push(`Bạn còn thiếu ${input.missingCredits} tín chỉ so với ngưỡng xét OJT.`);
    if(input.failedCourseCount>2)details.push(`Bạn còn ${input.failedCourseCount} môn chưa đạt, vượt giới hạn 2 môn còn nợ.`);
    else details.push(`Số môn chưa đạt hiện tại là ${input.failedCourseCount}, trong giới hạn tối đa 2 môn còn nợ.`);
    details.push('Đây là tiến độ hiện tại, chưa phải kết luận nguy cơ trễ OJT.');
    message=details.join(' ');
  }
  const recommendations: string[] = [];
  if (available) {
    if (input.missingCredits !== null && input.missingCredits > 0) recommendations.push(`Bạn còn thiếu ${input.missingCredits} tín chỉ so với ngưỡng OJT. Tiếp tục hoàn thành các môn theo lộ trình.`);
    if (input.failedCourseCount > 0) recommendations.push(`Bạn còn ${input.failedCourseCount} môn chưa đạt. Ưu tiên lập kế hoạch học lại và kiểm tra môn tiên quyết.`);
    recommendations.push('Theo dõi tiến độ học tập và thời hạn xét OJT; kết quả hiện tại có thể thay đổi khi có điểm mới.');
  }
  return {
    available, status: available ? 'PROGRESS_ONLY' : 'NOT_AVAILABLE',
    currentSemester: semesterValid ? input.currentSemester : null,
    reasons, riskLevel: null, riskScore: null, isAiPrediction: false,
    message,
    recommendations,
  };
}
