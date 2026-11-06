// Date-only arithmetic avoids local timezone and daylight-saving shifts.
export function previewBlockCalendar(startDate:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate))throw new Error('Invalid semester start date');
  const start=Date.parse(startDate+'T00:00:00Z');
  if(!Number.isFinite(start)||new Date(start).toISOString().slice(0,10)!==startDate)throw new Error('Invalid semester start date');
  const day=(offset:number)=>new Date(start+offset*86400000).toISOString().slice(0,10);
  return {mainSemester:{startDate:day(0),endDate:day(69)},break:{startDate:day(70),endDate:day(76)},
    block:{startDate:day(77),endDate:day(97)},policy:{mainSemesterWeeks:10,breakWeeks:1,blockWeeks:3}};
}
