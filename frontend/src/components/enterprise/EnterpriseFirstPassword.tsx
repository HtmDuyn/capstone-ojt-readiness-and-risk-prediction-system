import { FptLogoIcon } from '@/components/common/icons/AppIcons';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LoaderCircle, ShieldCheck, LockKeyhole, Eye, EyeOff, Check, ArrowRight, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/services/studentService';

export function EnterpriseFirstPassword() {
 const {logout}=useAuth();
 const navigate=useNavigate();
 const [passwords,setPasswords]=useState({currentPassword:'',newPassword:'',confirmation:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [visible,setVisible]=useState({currentPassword:false,newPassword:false,confirmation:false});
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(busy)return;setError('');
  if(passwords.newPassword!==passwords.confirmation){setError('Mật khẩu xác nhận không khớp.');return;}
  if(passwords.newPassword.length<12||new TextEncoder().encode(passwords.newPassword).length>72){setError('Mật khẩu mới cần ít nhất 12 ký tự và tối đa 72 byte UTF-8.');return;}
  setBusy(true);
  try{
   await apiRequest('/auth/change-password',{method:'POST',data:{currentPassword:passwords.currentPassword,newPassword:passwords.newPassword}});
   logout();navigate('/login',{replace:true,state:{message:'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'}});
  }catch(e){setError(e instanceof Error?e.message:'Không thể đổi mật khẩu. Vui lòng thử lại.');}
  finally{setBusy(false);}
 };
 const fields = [
  {key:'currentPassword' as const,label:'Mật khẩu tạm',hint:'Mật khẩu được gửi trong email mời đăng nhập.',autoComplete:'current-password'},
  {key:'newPassword' as const,label:'Mật khẩu mới',hint:'',autoComplete:'new-password'},
  {key:'confirmation' as const,label:'Xác nhận mật khẩu mới',hint:'',autoComplete:'new-password'},
 ];
 const requirements=[
  {label:'Ít nhất 12 ký tự',met:passwords.newPassword.length>=12},
  {label:'Tối đa 72 byte UTF-8',met:passwords.newPassword.length>0&&new TextEncoder().encode(passwords.newPassword).length<=72},
 ];
 return <main className="flex min-h-dvh items-center justify-center bg-orange-50/50 p-4 sm:p-6 lg:p-8">
  <div className="grid w-full max-w-5xl overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40 lg:grid-cols-[0.95fr_1.05fr]">
   <aside className="hidden flex-col justify-between gap-10 bg-orange-50 p-9 lg:flex xl:p-12" aria-label="Hướng dẫn thiết lập tài khoản">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"><FptLogoIcon size={30}/></span><div><p className="text-sm font-semibold tracking-wide text-slate-800">OJT CONNECT</p><p className="mt-0.5 text-xs text-slate-500">Cổng kết nối doanh nghiệp</p></div></div>
    <div><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-100 bg-white text-orange-500"><ShieldCheck size={34} strokeWidth={1.6}/></div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-700">Khởi đầu an toàn</p><h2 className="max-w-xs text-3xl font-semibold leading-tight tracking-tight text-slate-800">Bảo mật tài khoản<br/>của bạn</h2><p className="mt-4 text-sm leading-6 text-slate-600">Một bước thiết lập nhỏ để bảo vệ thông tin doanh nghiệp và sẵn sàng kết nối với sinh viên.</p>
     <ol className="mt-8 space-y-5">{[
      ['Nhập mật khẩu tạm','Sử dụng mật khẩu trong email đã nhận.'],
      ['Tạo mật khẩu của riêng bạn','Đặt mật khẩu mới đáp ứng các yêu cầu.'],
      ['Đăng nhập và bắt đầu','Đăng nhập lại để hoàn thiện hồ sơ doanh nghiệp.'],
     ].map(([title,description],index)=><li key={title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-white text-xs font-semibold text-orange-700">{index+1}</span><div><h3 className="text-sm font-semibold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></li>)}</ol>
    </div>
    <p className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole size={14}/>Bảo vệ thông tin, bắt đầu hợp tác bền vững.</p>
   </aside>
   <section className="min-w-0 p-6 sm:p-9 xl:p-12" aria-labelledby="first-password-title">
    <div className="mb-5 flex items-center gap-2 lg:hidden"><FptLogoIcon size={25}/><span className="text-sm font-semibold text-slate-800">OJT CONNECT</span></div>
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"><KeyRound size={13}/>Thiết lập tài khoản</span>
    <h1 id="first-password-title" className="mt-4 text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">Đổi mật khẩu lần đầu</h1>
    <p className="mt-3 text-sm leading-6 text-slate-500">Thay mật khẩu tạm bằng mật khẩu của bạn trước khi sử dụng tài khoản doanh nghiệp.</p>
    <form onSubmit={submit} className="mt-7 space-y-5" aria-busy={busy}>
     <fieldset disabled={busy} className="space-y-4">
      {fields.map(field=><div key={field.key}><label htmlFor={'enterprise-'+field.key} className="text-sm font-medium text-slate-700">{field.label}</label><div className="relative mt-2"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"/><input id={'enterprise-'+field.key} required type={visible[field.key]?'text':'password'} autoComplete={field.autoComplete} minLength={field.key==='newPassword'?12:undefined} className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-50 disabled:bg-slate-50" value={passwords[field.key]} placeholder={field.key==='currentPassword'?'Nhập mật khẩu trong email':'Nhập '+field.label.toLowerCase()} onChange={e=>setPasswords(p=>({...p,[field.key]:e.target.value}))} aria-describedby={field.key==='newPassword'?'enterprise-password-requirements':undefined}/><button type="button" aria-label={(visible[field.key]?'Ẩn ':'Hiện ')+field.label.toLowerCase()} aria-pressed={visible[field.key]} onClick={()=>setVisible(v=>({...v,[field.key]:!v[field.key]}))} className="absolute right-2 top-1.5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{visible[field.key]?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{field.hint&&<p className="mt-1.5 text-xs text-slate-500">{field.hint}</p>}{field.key==='newPassword'&&<ul id="enterprise-password-requirements" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{requirements.map(item=><li key={item.label} className={'flex items-center gap-1.5 text-xs '+(item.met?'text-emerald-700':'text-slate-500')}><Check size={13} className={item.met?'text-emerald-600':'text-slate-300'}/>{item.label}</li>)}</ul>}</div>)}
     </fieldset>
     {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/><p>{error}</p></div>}
     <button type="submit" disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-semibold text-white shadow-sm shadow-orange-100 transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-wait disabled:opacity-60">{busy?<LoaderCircle size={18} className="animate-spin"/>:<ShieldCheck size={18}/ >}{busy?'Đang đổi mật khẩu…':'Xác nhận đổi mật khẩu'}{!busy&&<ArrowRight size={16}/>}</button>
     <p className="text-center text-xs leading-5 text-slate-500">Sau khi đổi mật khẩu thành công, bạn sẽ đăng nhập lại bằng mật khẩu mới.</p>
     <div className="border-t border-slate-100 pt-4 text-center"><button type="button" disabled={busy} onClick={()=>{logout();navigate('/login',{replace:true});}} className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"><LogOut size={14}/>Đăng xuất</button></div>
    </form>
   </section>
  </div>
 </main>;
}