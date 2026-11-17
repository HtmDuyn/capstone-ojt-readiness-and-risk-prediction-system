type Company={id:number;name:string;capacity:number;actualCount:number};
type Position={id:number;companyId?:number;companyName:string;capacity:number|null};
type Student={id:number;companyId?:number;companyName?:string;positionId?:number;decision?:string;receivedAt?:string;hasAssignment?:boolean};
export type CompanySummary={key:string;id:number|null;name:string;capacity:number;actualCount:number;availableSlots:number};

// Support list responses without companies. The same accepted students shown
// in the roster must also be represented in the company summary.
export function summarizePlacementCompanies(board:{companies?:Company[];positions?:Position[];items:Student[]}):CompanySummary[]{
 const groups=new Map<string,CompanySummary&{positionIds:Set<number>;studentIds:Set<number>;positionCapacity:number}>();
 const get=(name:string,id?:number)=>{
  const key=id?`id:${id}`:`name:${name.trim().toLocaleLowerCase()}`;
  const matches=[...groups.values()].filter(group=>group.name.trim().toLocaleLowerCase()===name.trim().toLocaleLowerCase());
  const existing=groups.get(key)??(matches.length===1&&(!id||matches[0].id===null)?matches[0]:undefined);
  if(existing){
   if(id&&existing.id===null){groups.delete(existing.key);existing.key=key;existing.id=id;groups.set(key,existing);}
   return existing;
  }
  const group={key,id:id??null,name,capacity:0,actualCount:0,availableSlots:0,positionIds:new Set<number>(),studentIds:new Set<number>(),positionCapacity:0};
  groups.set(key,group);return group;
 };
 for(const company of board.companies??[]){
  const group=get(company.name,company.id);
  group.capacity=Number(company.capacity)||0;group.actualCount=Number(company.actualCount)||0;
 }
 for(const position of board.positions??[]){
  const group=get(position.companyName,position.companyId);
  if(!group.positionIds.has(position.id)){
   group.positionIds.add(position.id);group.positionCapacity+=Number(position.capacity)||0;
  }
 }
 for(const student of board.items){
  if(student.decision!=='ACCEPTED'&&!student.hasAssignment&&!student.receivedAt)continue;
  const position=board.positions?.find(item=>item.id===student.positionId);
  const companyId=student.companyId??position?.companyId;
  const name=student.companyName??position?.companyName??board.companies?.find(company=>company.id===companyId)?.name??'Chưa xác định doanh nghiệp';
  get(name,companyId).studentIds.add(student.id);
 }
 return [...groups.values()].map(group=>{
  const capacity=group.positionIds.size?group.positionCapacity:group.capacity;
  const actualCount=Math.max(group.actualCount,group.studentIds.size);
  return {key:group.key,id:group.id,name:group.name,capacity,actualCount,availableSlots:Math.max(0,capacity-actualCount)};
 }).sort((a,b)=>a.name.localeCompare(b.name));
}
