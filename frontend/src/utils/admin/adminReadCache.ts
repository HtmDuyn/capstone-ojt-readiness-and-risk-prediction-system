const PREFIX='ojt_admin_read_v1:';
type CachedValue<T>={value:T;savedAt:number};
const inFlight=new Map<string,Promise<unknown>>();
const listeners=new Map<string,Set<(value:unknown)=>void>>();

function scopedKey(key:string){
  const token=localStorage.getItem('ojt_auth_token')||'anonymous';
  let hash=2166136261;
  for(let i=0;i<token.length;i++){hash^=token.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `${PREFIX}${(hash>>>0).toString(36)}:${key}`;
}

export function readAdminCache<T>(key:string):T|null{
  try{
    const raw=localStorage.getItem(scopedKey(key));
    if(!raw)return null;
    const cached=JSON.parse(raw) as CachedValue<T>;
    return cached&&typeof cached.savedAt==='number'&&'value' in cached?cached.value:null;
  }catch{return null;}
}

export function subscribeAdminCache<T>(key:string,listener:(value:T)=>void){
  const storageKey=scopedKey(key),set=listeners.get(storageKey)??new Set<(value:unknown)=>void>();
  set.add(listener as (value:unknown)=>void);listeners.set(storageKey,set);
  return()=>{set.delete(listener as (value:unknown)=>void);if(!set.size)listeners.delete(storageKey);};
}

export function invalidateAdminCache(key:string){
  try{localStorage.removeItem(scopedKey(key));}catch{/* Storage can be unavailable in private browsing. */}
}

export function adminRead<T>(key:string,load:()=>Promise<T>,ttlMs:number):Promise<T>{
  const storageKey=scopedKey(key);
  let cached:CachedValue<T>|null=null;
  try{const raw=localStorage.getItem(storageKey);cached=raw?JSON.parse(raw) as CachedValue<T>:null;}catch{cached=null;}
  const refresh=()=>{
    const existing=inFlight.get(storageKey) as Promise<T>|undefined;
    if(existing)return existing;
    const request=Promise.resolve().then(load).then(value=>{
      try{localStorage.setItem(storageKey,JSON.stringify({value,savedAt:Date.now()} satisfies CachedValue<T>));}catch{/* Cache is an enhancement; API success must still be returned. */}
      for(const listener of listeners.get(storageKey)??[])listener(value);
      return value;
    }).finally(()=>inFlight.delete(storageKey));
    inFlight.set(storageKey,request);
    return request;
  };
  if(cached&&typeof cached.savedAt==='number'){
    if(Date.now()-cached.savedAt>ttlMs)void refresh().catch(()=>undefined);
    return Promise.resolve(cached.value);
  }
  return refresh();
}
