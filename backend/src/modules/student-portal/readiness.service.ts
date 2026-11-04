import { readTransaction } from '../qhdn/read.repository';
import { studentProfile } from '../students/student-profile.service';
import { ownStudent, type Actor } from './shared';

export async function readiness(actor:Actor) {
  return readTransaction(async c=>{
    const student=await ownStudent(c,actor);
    const p=await studentProfile(student.StudentID,{include:'academic,academicProgress'},actor,c);
    return {student:{id:p.id,studentCode:p.studentCode,fullName:p.fullName,currentSemester:p.currentSemester,programName:p.program?.name??null},
      ojtSemesterId:p.ojtSemesterId??null,academic:p.academic??null,academicProgress:p.academicProgress??null};
  });
}
