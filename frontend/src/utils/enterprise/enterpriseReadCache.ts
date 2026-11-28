const PREFIX='ojt_enterprise_read_v1:';
const MAX_ENTRIES=80,MAX_ITEM_CHARS=240_000,DEFAULT_TTL=60_000;
type Entry<T>={value:T;savedAt:number};
const inFlight=new Map<string,Promise<unknown>>();
let generation=0;

function sessionPrefix(){let token='anonymous';try{token=localStorage.getItem('ojt_auth_token')||token;}catch{/* Optional cache. */}let hash=2166136261;for(let i=0;i<token.length;i++){hash^=token.charCodeAt(i);hash=Math.imul(hash,16777619);}return `${PREFIX}${(hash>>>0).toString(36)}:`;}
const storageKey=(key:string)=>`${sessionPrefix()}${key}`;
function read<T>(key:string):Entry<T>|null{try{const raw=localStorage.getItem(storageKey(key));if(!raw)return null;const entry=JSON.parse(raw) as Entry<T>;return entry&&typeof entry.savedAt==='number'&&'value'in entry?entry:null;}catch{return null;}}
function save<T>(key:string,value:T){try{const serialized=JSON.stringify({value,savedAt:Date.now()} satisfies Entry<T>);if(serialized.length>MAX_ITEM_CHARS)return;const prefix=sessionPrefix(),keys:string[]=[];for(let i=0;i<localStorage.length;i++){const item=localStorage.key(i);if(item?.startsWith(prefix))keys.push(item);}if(keys.length>=MAX_ENTRIES){const oldest=keys.map(item=>{try{return {key:item,savedAt:(JSON.parse(localStorage.getItem(item)||'{}') as Entry<unknown>).savedAt||0};}catch{return {key:item,savedAt:0};}}).sort((a,b)=>a.savedAt-b.savedAt)[0];if(oldest)localStorage.removeItem(oldest.key);}localStorage.setItem(storageKey(key),serialized);}catch{/* Cache must not block API reads. */}}
export function enterpriseReadKey(path:string,params:unknown={}){return `${path}:${JSON.stringify(params)}`;}
export function invalidateEnterpriseReadCache(){try{const prefix=sessionPrefix(),keys:string[]=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(prefix))keys.push(key);}keys.forEach(key=>localStorage.removeItem(key));}catch{/* Optional cache. */}inFlight.clear();generation++;}
export function enterpriseRead<T>(key:string,load:(signal?:AbortSignal)=>Promise<T>,signal?:AbortSignal,ttlMs=DEFAULT_TTL):Promise<T>{
 signal?.throwIfAborted();const cached=read<T>(key),scoped=storageKey(key);
 const refresh=()=>{const existing=inFlight.get(scoped) as Promise<T>|undefined;if(existing)return existing;const startedAt=generation;const request=Promise.resolve().then(()=>load()).then(value=>{if(startedAt===generation){save(key,value);if(cached&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('enterprise:read-cache-updated',{detail:{key}}));}return value;}).finally(()=>{if(inFlight.get(scoped)===request)inFlight.delete(scoped);});inFlight.set(scoped,request);return request;};
 if(cached){if(Date.now()-cached.savedAt>ttlMs)void refresh().catch(()=>undefined);return Promise.resolve(cached.value);}
 const request=refresh();if(!signal)return request;return new Promise<T>((resolve,reject)=>{const abort=()=>{cleanup();reject(signal.reason??new DOMException('Aborted','AbortError'));};const cleanup=()=>signal.removeEventListener('abort',abort);if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});request.then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});});
}
