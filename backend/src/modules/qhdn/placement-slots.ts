// Prefer positions with fewer confirmed/pending referrals. This is a sorting
// preference, not a limit: QHDN may coordinate beyond the advertised capacity.
export const coordinationSlotsSql = `GREATEST(0,COALESCE(p."Capacity",0)-public."RecruitmentOccupiedSlots"(p."PositionID")-
 (SELECT count(*)::int FROM "StudentEnterpriseCoordination" pending WHERE pending."PositionID"=p."PositionID"
  AND pending."Decision"='PENDING' AND pending."Source" IN ('QHDN_COORDINATION','QHDN_APPLICATION')))`;

export function coordinationCompanies(positions:{companyId:number;companyName:string;capacity:number|null;actualCount:number}[],confirmedCounts?:{id:number;name:string;actualCount:number}[]) {
 const companies=new Map<number,{id:number;name:string;capacity:number;actualCount:number;availableSlots:number}>();
 for(const position of positions){
  const company=companies.get(position.companyId)??{id:position.companyId,name:position.companyName,capacity:0,actualCount:0,availableSlots:0};
  company.capacity+=Number(position.capacity)||0;
  company.actualCount+=Number(position.actualCount)||0;
  company.availableSlots=Math.max(0,company.capacity-company.actualCount);
  companies.set(position.companyId,company);
 }
 if(confirmedCounts){
  for(const company of companies.values())company.actualCount=0;
  for(const confirmed of confirmedCounts){
   const company=companies.get(confirmed.id)??{id:confirmed.id,name:confirmed.name,capacity:0,actualCount:0,availableSlots:0};
   company.actualCount=Number(confirmed.actualCount)||0;
   companies.set(company.id,company);
  }
  for(const company of companies.values())company.availableSlots=Math.max(0,company.capacity-company.actualCount);
 }
 return [...companies.values()].sort((a,b)=>a.name.localeCompare(b.name));
}
