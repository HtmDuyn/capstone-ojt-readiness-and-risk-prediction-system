import type { PoolClient } from 'pg';
import { academicProgressWithClient } from '../students/academic-progress';
import { performEligibilityCheck } from '../eligibility/eligibility.service';
export async function recalculateAcademicState(client:PoolClient,studentId:number,semesterId:number,actorId:number,eventId:number) {
 const progress=await academicProgressWithClient(client,studentId);
 const eligibility=await performEligibilityCheck(client,studentId,semesterId,actorId,'COMBO_CHANGE',null,eventId);
 const id=(await client.query(`INSERT INTO "StudentAcademicRecalculations" ("EventID","StudentID","Progress","Eligibility") VALUES ($1,$2,$3,$4) RETURNING "RecalculationID"`,[eventId,studentId,JSON.stringify(progress),JSON.stringify(eligibility)])).rows[0].RecalculationID;
 return {recalculationId:id,progress,eligibility};
}
