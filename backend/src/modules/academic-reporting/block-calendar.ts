// Date-only arithmetic avoids local timezone and daylight-saving shifts.
export function previewBlockCalendar(startDate:string, savedBlock10?: { startDate: string; endDate: string }){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate))throw new Error('Invalid semester start date');
  const start=Date.parse(startDate+'T00:00:00Z');
  if(!Number.isFinite(start)||new Date(start).toISOString().slice(0,10)!==startDate)throw new Error('Invalid semester start date');
  const day=(offset:number)=>new Date(start+offset*86400000).toISOString().slice(0,10);
  const mainSemester = savedBlock10 ?? { startDate: day(0), endDate: day(69) };
  const end = Date.parse(mainSemester.endDate + 'T00:00:00Z');
  const after = (offset: number) => new Date(end + offset * 86400000).toISOString().slice(0, 10);
  return {mainSemester,block:{startDate:after(1),endDate:after(21)},policy:{mainSemesterWeeks:10,blockWeeks:3}};
}
