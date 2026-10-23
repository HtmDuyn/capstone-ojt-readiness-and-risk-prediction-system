// Official reporting uses only results confirmed and recorded by ACADEMIC.
export const officialEvaluationRelation = `(SELECT "ResultID","AssignmentID","Status","Version","OfficialScore","Outcome","ConfirmedAt" FROM "OJTResults" WHERE "Status"='CONFIRMED')`;
