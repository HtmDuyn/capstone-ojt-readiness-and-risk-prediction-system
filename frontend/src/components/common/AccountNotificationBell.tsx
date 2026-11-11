import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import API from '@/services/api';
type Notification={id:number;title:string;content:string;isRead:boolean;sentAt:string};
export function AccountNotificationBell(){
 const [open,setOpen]=useState(false),[items,setItems]=useState<Notification[]>([]),[unread,setUnread]=useState(0);
 const [error,setError]=useState(''),[loading,setLoading]=useState(false);
 const reading=useRef(new Set<number>());
 const load=useCallback(async()=>{
  try{const r=await API.get('/accounts/me/notifications',{params:{page:1,limit:50}});setItems(r.data.data.items);setUnread(r.data.data.unreadCount);setError('');}
  catch{setError('Không tải được thông báo. Vui lòng thử lại.');}
 },[]);
 useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),60000);return()=>window.clearInterval(timer);},[load]);
 useEffect(()=>{if(!open)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[open]);
 const read=async(item:Notification)=>{
  if(item.isRead||reading.current.has(item.id))return;
  reading.current.add(item.id);
  try{await API.patch('/accounts/me/notifications/'+item.id,{isRead:true});setItems(rows=>rows.map(row=>row.id===item.id?{...row,isRead:true}:row));setUnread(n=>Math.max(0,n-1));}
  catch{setError('Không cập nhật được trạng thái thông báo.');}
  finally{reading.current.delete(item.id);}
 };
 return <>
  <button type="button" aria-label={`Thông báo${unread?' · '+unread+' chưa đọc':''}`} aria-expanded={open} onClick={()=>{setOpen(true);setLoading(true);void load().finally(()=>setLoading(false));}} className="relative rounded-full p-2 text-slate-600 hover:bg-orange-50"><Bell size={20}/>{unread>0&&<span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-orange-500 px-1 text-[10px] text-white">{unread>99?'99+':unread}</span>}</button>
  {open&&<div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/30 p-4 pt-20" onClick={()=>setOpen(false)}><section role="dialog" aria-modal="true" aria-label="Thông báo" className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
   <div className="flex items-center justify-between border-b border-slate-100 p-4"><h2 className="font-bold text-slate-800">Thông báo · {unread} chưa đọc</h2><button type="button" autoFocus aria-label="Đóng thông báo" onClick={()=>setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div>
   {error&&<div role="alert" className="p-4 text-sm text-red-600">{error}<button onClick={()=>void load()} className="ml-2 underline">Thử lại</button></div>}
   {loading?<p className="p-6 text-sm text-slate-500">Đang tải…</p>:!items.length?<p className="p-6 text-sm text-slate-500">Chưa có thông báo.</p>:items.map(item=><button type="button" key={item.id} onClick={()=>void read(item)} className={'block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 '+(!item.isRead?'bg-orange-50/50':'')}><p className="text-sm font-semibold text-slate-800">{item.title}{!item.isRead&&<span className="ml-2 text-xs text-orange-600">Mới</span>}</p><p className="mt-2 whitespace-pre-line text-sm text-slate-600">{item.content}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.sentAt).toLocaleString('vi-VN')}</p></button>)}
  </section></div>}
 </>;
}
