interface PendingRead {
  controller: AbortController;
  promise: Promise<unknown>;
  readers: number;
  settled: boolean;
}

interface StoredRead { data: unknown; savedAt: number }
const STORAGE_PREFIX='ojt_student_read_v1:';
const MAX_CACHE_ENTRIES=100,MAX_CACHE_CHARS=240_000,DEFAULT_TTL=60_000;
function storagePrefix(scope:string|null){let hash=2166136261;for(let i=0;i<(scope??'anonymous').length;i++){hash^=(scope??'anonymous').charCodeAt(i);hash=Math.imul(hash,16777619);}return `${STORAGE_PREFIX}${(hash>>>0).toString(36)}:`;}
function readStored<T>(scope:string|null,key:string):StoredRead&{data:T}|null{try{const value=localStorage.getItem(storagePrefix(scope)+key);if(!value)return null;const parsed=JSON.parse(value) as StoredRead;return parsed&&typeof parsed.savedAt==='number'&&'data'in parsed?parsed as StoredRead&{data:T}:null;}catch{return null;}}
function writeStored(scope:string|null,key:string,data:unknown){try{const value=JSON.stringify({data,savedAt:Date.now()} satisfies StoredRead);if(value.length>MAX_CACHE_CHARS)return;const prefix=storagePrefix(scope),keys:string[]=[];for(let i=0;i<localStorage.length;i++){const item=localStorage.key(i);if(item?.startsWith(prefix))keys.push(item);}if(keys.length>=MAX_CACHE_ENTRIES){const oldest=keys.map(item=>{try{return {key:item,savedAt:(JSON.parse(localStorage.getItem(item)||'{}') as StoredRead).savedAt||0};}catch{return {key:item,savedAt:0};}}).sort((a,b)=>a.savedAt-b.savedAt)[0];if(oldest)localStorage.removeItem(oldest.key);}localStorage.setItem(prefix+key,value);}catch{/* Cache is optional and must never block API reads. */}}
function clearStored(scope:string|null|undefined){if(scope==null)return;try{const prefix=storagePrefix(scope),keys:string[]=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key?.startsWith(prefix))keys.push(key);}keys.forEach(key=>localStorage.removeItem(key));}catch{/* Cache is optional. */}}

// Share only requests still in flight. Completed responses are never cached.
// Each screen owns its cancellation; the HTTP request stops when its last reader leaves.
export function createStudentReads() {
  const pending = new Map<string, PendingRead>();
  const active = new Set<PendingRead>();
  let currentScope: string | null | undefined;
  let generation=0;
  return {
    invalidate() { pending.clear();clearStored(currentScope);generation++; },
    read<T>(scope: string | null, key: string, load: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal, ttlMs=DEFAULT_TTL, forceNetwork=false): Promise<T> {
      signal?.throwIfAborted();
      if (scope !== currentScope) {
        for (const entry of active) entry.controller.abort();
        pending.clear();
        currentScope = scope;
        generation++;
      }
      const cached=forceNetwork?null:readStored<T>(scope,key);
      if(cached){if(Date.now()-cached.savedAt>ttlMs)void this.read(scope,key,load,undefined,ttlMs,true).catch(()=>undefined);return Promise.resolve(cached.data);}
      let entry = pending.get(key);
      if (!entry) {
        const controller = new AbortController();
        const created: PendingRead = { controller, readers: 0, settled: false, promise: Promise.resolve() };
        const requestGeneration=generation;
        created.promise = Promise.resolve().then(() => {
          controller.signal.throwIfAborted();
          return load(controller.signal);
        }).finally(() => {
          created.settled = true;
          active.delete(created);
          if (pending.get(key) === created) pending.delete(key);
        }).then(value=>{if(requestGeneration===generation){writeStored(scope,key,value);if(forceNetwork&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('student:read-cache-updated',{detail:{key}}));}return value;});
        pending.set(key, created);
        active.add(created);
        entry = created;
      }
      const shared = entry;
      shared.readers++;
      return new Promise<T>((resolve, reject) => {
        let finished = false;
        const finish = (callback: () => void) => {
          if (finished) return;
          finished = true;
          signal?.removeEventListener('abort', abort);
          shared.controller.signal.removeEventListener('abort', sharedAbort);
          shared.readers--;
          if (!shared.readers && !shared.settled) {
            if (pending.get(key) === shared) pending.delete(key);
            shared.controller.abort();
          }
          callback();
        };
        const abort = () => finish(() => reject(signal?.reason ?? new DOMException('Aborted', 'AbortError')));
        const sharedAbort = () => finish(() => reject(new DOMException('Aborted', 'AbortError')));
        signal?.addEventListener('abort', abort, { once: true });
        shared.controller.signal.addEventListener('abort', sharedAbort, { once: true });
        shared.promise.then(value => finish(() => resolve(value as T)), error => finish(() => reject(error)));
      });
    },
  };
}

export const studentReads = createStudentReads();
export const invalidateStudentReadCache=()=>studentReads.invalidate();
