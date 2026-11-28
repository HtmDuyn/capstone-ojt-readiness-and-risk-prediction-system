const PREFIX='ojt_education_read_v1:';
const MAX_ENTRIES=80;
const MAX_ITEM_CHARS=240_000;
const DEFAULT_TTL=60_000;
type Entry<T>={value:T;savedAt:number};
const inFlight=new Map<string,Promise<unknown>>();
let generation=0;

function sessionPrefix(){
  let token='anonymous';try{token=localStorage.getItem('ojt_auth_token')||token;}catch{/* Cache is optional. */}
  let hash=2166136261;
  for(let i=0;i<token.length;i++){hash^=token.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `${PREFIX}${(hash>>>0).toString(36)}:`;
}

function storageKey(key:string){return `${sessionPrefix()}${key}`;}

function read<T>(key:string):Entry<T>|null{
  try{
    const raw=localStorage.getItem(storageKey(key));
    if(!raw)return null;
    const entry=JSON.parse(raw) as Entry<T>;
    return entry&&typeof entry.savedAt==='number'&&'value' in entry?entry:null;
  }catch{return null;}
}

function save<T>(key:string,value:T){
  try{
    const item=JSON.stringify({value,savedAt:Date.now()} satisfies Entry<T>);
    if(item.length>MAX_ITEM_CHARS)return;
    const prefix=sessionPrefix(),keys:string[]=[];
    for(let i=0;i<localStorage.length;i++){const current=localStorage.key(i);if(current?.startsWith(prefix))keys.push(current);}
    if(keys.length>=MAX_ENTRIES){
      const oldest=keys.map(current=>{try{return {key:current,savedAt:(JSON.parse(localStorage.getItem(current)||'{}') as Entry<unknown>).savedAt||0};}catch{return {key:current,savedAt:0};}}).sort((a,b)=>a.savedAt-b.savedAt)[0];
      if(oldest)localStorage.removeItem(oldest.key);
    }
    localStorage.setItem(storageKey(key),item);
  }catch{/* Storage quotas and private browsing must not block API reads. */}
}

export function invalidateEducationReadCache(){
  try{
    const prefix=sessionPrefix(),keys:string[]=[];
    for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(prefix))keys.push(key);}
    keys.forEach(key=>localStorage.removeItem(key));
  }catch{/* Storage is an optional performance layer. */}
  inFlight.clear();
  generation++;
}

export function educationRead<T>(key:string,load:(signal?:AbortSignal)=>Promise<T>,signal?:AbortSignal,ttlMs=DEFAULT_TTL):Promise<T>{
  signal?.throwIfAborted();
  const cache=read<T>(key),keyScoped=storageKey(key);
  const refresh=()=>{
    const existing=inFlight.get(keyScoped) as Promise<T>|undefined;
    if(existing)return existing;
    const startedAt=generation;
    const request=Promise.resolve().then(()=>load()).then(value=>{
      if(startedAt===generation){
        save(key,value);
        if(cache&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('education:read-cache-updated',{detail:{key}}));
      }
      return value;
    }).finally(()=>{if(inFlight.get(keyScoped)===request)inFlight.delete(keyScoped);});
    inFlight.set(keyScoped,request);
    return request;
  };
  if(cache){
    if(Date.now()-cache.savedAt>ttlMs)void refresh().catch(()=>undefined);
    return Promise.resolve(cache.value);
  }
  const request=refresh();
  if(!signal)return request;
  return new Promise<T>((resolve,reject)=>{
    const abort=()=>{cleanup();reject(signal.reason??new DOMException('Aborted','AbortError'));};
    const cleanup=()=>signal.removeEventListener('abort',abort);
    if(signal.aborted){abort();return;}
    signal.addEventListener('abort',abort,{once:true});
    request.then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
  });
}

export function educationReadKey(path:string,params:unknown={}){
  return `${path}:${JSON.stringify(params)}`;
}
