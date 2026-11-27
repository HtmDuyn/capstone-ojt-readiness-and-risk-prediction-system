import { FptLogoIcon } from '@/components/common/icons/AppIcons';
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LoaderCircle, ShieldCheck, LockKeyhole, Eye, EyeOff, Check, ArrowRight, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/shared/useAuth';
import { authService } from '@/services/authService';
import { AuthPageLayout } from '@/components/auth/AuthPageLayout';
import { isAxiosError } from 'axios';

export function FirstPasswordChangePage() {
 const {logout,user}=useAuth();
 const accountLabel=user?.role==='student'?'sinh viên':user?.role==='enterprise'?'doanh nghiệp':'của bạn';
 const lock=useRef(false);
 const navigate=useNavigate();
 const [passwords,setPasswords]=useState({currentPassword:'',newPassword:'',confirmation:''});
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [visible,setVisible]=useState({currentPassword:false,newPassword:false,confirmation:false});
 const submit=async(event:FormEvent)=>{
  event.preventDefault();if(lock.current)return;setError('');
  if(passwords.newPassword!==passwords.confirmation){setError('Mật khẩu xác nhận không khớp.');return;}
  if(passwords.newPassword.length<12||new TextEncoder().encode(passwords.newPassword).length>72){setError('Mật khẩu mới cần ít nhất 12 ký tự và tối đa 72 byte UTF-8.');return;}
  if(passwords.newPassword===passwords.currentPassword){setError('Mật khẩu mới phải khác mật khẩu tạm.');return;}
  lock.current=true;setBusy(true);
  try{
   await authService.changePassword(passwords.currentPassword,passwords.newPassword);
   sessionStorage.setItem('ojt_password_changed_notice','Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
   logout();navigate('/login',{replace:true,state:{message:'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'}});
  }catch(e){setError(isAxiosError(e)&&e.response?.data?.errorCode==='INVALID_CREDENTIALS'?'Mật khẩu tạm chưa chính xác. Vui lòng kiểm tra lại email.':e instanceof Error?e.message:'Không thể đổi mật khẩu. Vui lòng thử lại.');}
  finally{lock.current=false;setBusy(false);}
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
 return <AuthPageLayout>
   <aside className="left-panel relative hidden flex-col justify-between gap-10 border-r border-white/30 bg-gradient-to-br from-white/45 via-orange-50/25 to-amber-100/20 p-9 text-slate-900 backdrop-blur-2xl lg:flex lg:w-[45%] xl:p-10" aria-label="Hướng dẫn thiết lập tài khoản">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/80 bg-gradient-to-br from-orange-500 to-amber-600 font-extrabold text-white shadow-md shadow-orange-500/30">FPT</span><div><p className="text-sm font-extrabold uppercase tracking-widest text-orange-950">FPT University</p><p className="mt-0.5 text-xs font-semibold text-slate-600">OJT Management System</p></div></div>
    <div><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white/80 text-orange-600"><ShieldCheck size={34} strokeWidth={1.6}/></div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-orange-700">Khởi đầu an toàn</p><h2 className="max-w-xs text-3xl font-extrabold leading-tight tracking-tight text-slate-950">Bảo mật tài khoản<br/>của bạn</h2><p className="mt-4 text-sm leading-6 text-slate-700">Thiết lập mật khẩu riêng trước khi bắt đầu sử dụng tài khoản {accountLabel} trên hệ thống OJT.</p>
     <ol className="mt-8 space-y-5">{[
      ['Nhập mật khẩu tạm','Sử dụng mật khẩu trong email đã nhận.'],
      ['Tạo mật khẩu của riêng bạn','Đặt mật khẩu mới đáp ứng các yêu cầu.'],
      ['Đăng nhập và bắt đầu','Đăng nhập lại bằng mật khẩu mới để sử dụng hệ thống.'],
     ].map(([title,description],index)=><li key={title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-200 bg-white text-xs font-semibold text-orange-700">{index+1}</span><div><h3 className="text-sm font-semibold text-slate-800">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div></li>)}</ol>
    </div>
    <p className="flex items-center gap-2 text-xs text-slate-600"><LockKeyhole size={14}/>Kết nối sinh viên, nhà trường và doanh nghiệp.</p>
   </aside>
   <section className="right-panel relative min-w-0 w-full flex-1 bg-white/40 p-6 backdrop-blur-2xl sm:p-9 lg:w-[55%] xl:p-10" aria-labelledby="first-password-title">
    <div className="mb-5 flex items-center gap-2 lg:hidden"><FptLogoIcon size={25}/><span className="text-sm font-semibold text-slate-800">OJT CONNECT</span></div>
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"><KeyRound size={13}/>Thiết lập tài khoản</span>
    <h1 id="first-password-title" className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Đổi mật khẩu lần đầu</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">Thay mật khẩu tạm bằng mật khẩu riêng trước khi sử dụng tài khoản {accountLabel}.</p>
    <form onSubmit={submit} className="mt-7 space-y-5" aria-busy={busy}>
     <fieldset disabled={busy} className="space-y-4">
      {fields.map(field=><div key={field.key}><label htmlFor={'first-password-'+field.key} className="text-sm font-medium text-slate-700">{field.label}</label><div className="relative mt-2"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400"/><input id={'first-password-'+field.key} required type={visible[field.key]?'text':'password'} autoComplete={field.autoComplete} minLength={field.key==='newPassword'?12:undefined} className="w-full rounded-xl border border-slate-200 bg-white/90 py-3 pl-10 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-slate-50" value={passwords[field.key]} placeholder={field.key==='currentPassword'?'Nhập mật khẩu trong email':'Nhập '+field.label.toLowerCase()} onChange={e=>setPasswords(p=>({...p,[field.key]:e.target.value}))} aria-describedby={field.key==='newPassword'?'first-password-requirements':undefined}/><button type="button" aria-label={(visible[field.key]?'Ẩn ':'Hiện ')+field.label.toLowerCase()} aria-pressed={visible[field.key]} onClick={()=>setVisible(v=>({...v,[field.key]:!v[field.key]}))} className="absolute right-2 top-1.5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500">{visible[field.key]?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{field.hint&&<p className="mt-1.5 text-xs text-slate-500">{field.hint}</p>}{field.key==='newPassword'&&<ul id="first-password-requirements" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{requirements.map(item=><li key={item.label} className={'flex items-center gap-1.5 text-xs '+(item.met?'text-emerald-700':'text-slate-500')}><Check size={13} className={item.met?'text-emerald-600':'text-slate-300'}/>{item.label}</li>)}</ul>}</div>)}
     </fieldset>
     {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm leading-relaxed text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/><p>{error}</p></div>}
     <button type="submit" disabled={busy} className="btn-login inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-wait disabled:opacity-60">{busy?<LoaderCircle size={18} className="animate-spin"/>:<ShieldCheck size={18}/ >}{busy?'Đang đổi mật khẩu…':'Xác nhận đổi mật khẩu'}{!busy&&<ArrowRight size={16}/>}</button>
     <p className="text-center text-xs leading-5 text-slate-500">Sau khi đổi mật khẩu thành công, bạn sẽ đăng nhập lại bằng mật khẩu mới.</p>
     <div className="border-t border-slate-100 pt-4 text-center"><button type="button" disabled={busy} onClick={()=>{logout();navigate('/login',{replace:true});}} className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"><LogOut size={14}/>Đăng xuất</button></div>
    </form>
   </section>
 </AuthPageLayout>;
}
