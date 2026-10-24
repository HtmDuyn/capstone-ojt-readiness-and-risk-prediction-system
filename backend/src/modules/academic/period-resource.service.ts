import { academicTransaction,findRecord,resources } from './academic.repository';
import { inputObject,positiveId,academicError } from './academic.schema';
import { saveResource } from './academic.service';
import { saveComboSchedule } from './workflow-policy';
import { schedule } from '../student-portal/advisory.service';
import type { Actor } from '../student-portal/shared';
import type { PoolClient } from 'pg';
import { enrichListRows } from '../../shared/list-context';

export async function periodConfiguration(c:PoolClient,id:number){
  const schedules=(await c.query(`SELECT "Phase" AS phase,"StartsAt" AS "startsAt","EndsAt" AS "endsAt", "Reason" AS reason,
    "ConfirmedBy" AS "confirmedBy","ConfirmedAt" AS "confirmedAt" FROM "ComboPhaseSchedules" WHERE "AcademicPeriodID"=$1 ORDER BY "Phase"`,[id])).rows;
  const advisory=(await c.query(`SELECT "OJTSemesterID" AS "ojtSemesterId","SendAt" AS "sendAt","AssessmentDeadline" AS "assessmentDeadline", "Scope" AS scope,
    "Enabled" AS enabled,"Version" AS version,"UpdatedBy" AS "updatedBy","UpdatedAt" AS "updatedAt" FROM "OJTAdvisorySchedules" WHERE "AcademicPeriodID"=$1`,[id])).rows;
  return {comboPhaseSchedules:await enrichListRows(c,schedules),advisorySchedule:(await enrichListRows(c,advisory))[0]??null};
}
export async function savePeriodResource(body:unknown,actor:Actor,id?:number){
  const input=inputObject(body,[...Object.keys(resources['academic-periods'].fields),'ojt','comboPhaseSchedules','advisorySchedule']);
  const {comboPhaseSchedules,advisorySchedule,...metadata}=input;
  if(comboPhaseSchedules!==undefined&&(!Array.isArray(comboPhaseSchedules)||!comboPhaseSchedules.length||comboPhaseSchedules.length>2))throw academicError('comboPhaseSchedules must contain 1–2 schedules.');
  if(Array.isArray(comboPhaseSchedules)&&new Set(comboPhaseSchedules.map(s=>(s as any)?.phase)).size!==comboPhaseSchedules.length)throw academicError('Duplicate combo phases.');
  return academicTransaction(async c=>{
    const period=Object.keys(metadata).length||id===undefined?await saveResource('academic-periods',metadata,actor.userId,id,c):await findRecord(c,'academic-periods',positiveId(id));
    if(Array.isArray(comboPhaseSchedules))for(const entry of comboPhaseSchedules)await saveComboSchedule(period.id,entry,actor.userId,c);
    if(advisorySchedule!==undefined)await schedule(period.id,actor,advisorySchedule,c);
    return {...(await enrichListRows(c,[period]))[0],...await periodConfiguration(c,period.id)};
  });
}
