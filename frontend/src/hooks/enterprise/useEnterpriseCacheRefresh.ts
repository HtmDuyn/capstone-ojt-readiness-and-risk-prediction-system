import { useEffect, useRef } from 'react';

export function useEnterpriseCacheRefresh(prefixes:string[],refresh:()=>void,delayMs=180){
  const callback=useRef(refresh);callback.current=refresh;const dependencyKey=prefixes.join('|');
  useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;const onUpdate=(event:Event)=>{const key=(event as CustomEvent<{key?:string}>).detail?.key;if(!key||!prefixes.some(prefix=>key.startsWith(prefix)))return;if(timer)clearTimeout(timer);timer=setTimeout(()=>callback.current(),delayMs);};window.addEventListener('enterprise:read-cache-updated',onUpdate);return()=>{if(timer)clearTimeout(timer);window.removeEventListener('enterprise:read-cache-updated',onUpdate);};},[dependencyKey,delayMs]);
}
