import React, { useEffect, useRef, useState } from 'react';
import { BotSparkleIcon, CloseIcon } from './icons/AppIcons';
import type { StudentProfile } from '@/types/student/studentDashboardTypes';
import { useAuth } from '@/hooks/useAuth';
import { studentAcademic } from '@/services/studentAcademic.service';
interface AIConsultModalProps { isOpen:boolean;onClose:()=>void;student:StudentProfile;initialQuery?:string; }
type Message={sender:'ai'|'user';text:string};
export const AIConsultModal:React.FC<AIConsultModalProps>=({isOpen,onClose,initialQuery=''})=>{
  const {user,token}=useAuth();
  const [messages,setMessages]=useState<Message[]>([]);
  const [inputVal,setInputVal]=useState('');
  const [busy,setBusy]=useState(false);
  const pending=useRef<AbortController|null>(null);
  const bottom=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{pending.current?.abort();pending.current=null;setBusy(false);setInputVal('');setMessages([{sender:'ai',text:'Mình hỗ trợ môn nợ, tín chỉ, điều kiện OJT, môn tiên quyết và mô phỏng kế hoạch từ dữ liệu học vụ của bạn. Mỗi câu hỏi được xử lý độc lập; hãy ghi rõ mã môn khi cần tra cứu.'}]);return ()=>{pending.current?.abort();};},[token,user?.id]);
  useEffect(()=>{if(isOpen)setInputVal(initialQuery);else{pending.current?.abort();pending.current=null;setBusy(false);}},[isOpen,initialQuery]);
  useEffect(()=>{bottom.current?.scrollIntoView({block:'nearest'});},[messages,busy]);
  const send=async(preset?:string)=>{
    const question=(preset??inputVal).trim();
    if(!question||question.length>1000||pending.current)return;
    if(user?.role!=='student'){setMessages(m=>[...m,{sender:'ai',text:'Vui lòng đăng nhập tài khoản sinh viên để sử dụng hỏi đáp học vụ.'}]);return;}
    const controller=new AbortController();pending.current=controller;setBusy(true);
    setMessages(m=>[...m,{sender:'user',text:question}]);setInputVal('');
    try{
      const result=await studentAcademic.chat(question,controller.signal);
      const text=[result.answer,...result.recommendations.map(r=>'• '+r),result.adviceStatus==='FALLBACK'?'Tư vấn AI chưa khả dụng; đang dùng khuyến nghị theo quy tắc.':''].filter(Boolean).join('\n\n');
      if(!controller.signal.aborted)setMessages(m=>[...m,{sender:'ai',text}]);
    }catch(e){if(!controller.signal.aborted)setMessages(m=>[...m,{sender:'ai',text:e instanceof Error?e.message:'Không nhận được câu trả lời. Bạn hãy thử lại.'}]);}
    finally{if(pending.current===controller){pending.current=null;setBusy(false);}}
  };
  if(!isOpen)return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
    <section role="dialog" aria-modal="true" aria-labelledby="academic-chat-title" className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl text-slate-800">
      <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white"><div className="flex items-center gap-3"><BotSparkleIcon size={24}/><div><h2 id="academic-chat-title" className="font-bold">Trợ lý học vụ OJT</h2><p className="text-xs text-orange-50">Dựa trên hồ sơ của sinh viên đang đăng nhập</p></div></div><button type="button" aria-label="Đóng hỏi đáp" onClick={onClose} className="rounded-full p-2 hover:bg-white/20"><CloseIcon size={20}/></button></header>
      <div className="flex flex-wrap gap-2 border-b border-orange-100 bg-orange-50 p-3">{['Mình còn nợ môn nào?','Mình nên học lại môn nào trước?'].map(q=><button type="button" key={q} disabled={busy} onClick={()=>send(q)} className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs disabled:opacity-50">{q}</button>)}</div>
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6" aria-live="polite">{messages.map((m,i)=><div key={i} className={`flex ${m.sender==='user'?'justify-end':'justify-start'}`}><p className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.sender==='user'?'bg-orange-600 text-white':'border border-slate-200 bg-white'}`}>{m.text}</p></div>)}{busy&&<p role="status" className="text-sm text-slate-500">Đang kiểm tra dữ liệu và tạo câu trả lời…</p>}<div ref={bottom}/></div>
      <form onSubmit={e=>{e.preventDefault();send();}} className="flex gap-2 border-t border-slate-100 p-3"><label className="flex-1"><span className="sr-only">Câu hỏi học vụ</span><input autoFocus value={inputVal} onChange={e=>setInputVal(e.target.value)} maxLength={1000} placeholder="Hỏi về môn nợ, tín chỉ, mã môn…" className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm"/></label><button type="submit" disabled={busy||!inputVal.trim()} className="rounded-full bg-orange-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-50">Gửi</button></form>
    </section>
  </div>;
};
