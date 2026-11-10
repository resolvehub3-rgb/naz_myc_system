import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CrestLogo } from '../components/CrestLogo';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, loginWithDemoStaff } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegisteringAdmin) {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name');
          setIsSubmitting(false);
          return;
        }
        const res = await signUp(email, password, fullName, 'admin');
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to register administrator');
        }
      } else {
        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid credentials or user not registered');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B2345] via-[#123B70] to-[#0A1E38] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Top Header with Crest & Branding */}
        <div className="bg-[#0B2345] p-6 text-center text-white relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#38BDF8] via-[#F59E0B] to-[#DC2626]" />

          <div className="flex justify-center mb-2">
            <CrestLogo className="w-14 h-16 drop-shadow-md" />
          </div>

          <h1 className="text-base font-black tracking-wider uppercase leading-tight font-sans text-white">
            METHODIST CHURCH GHANA
          </h1>
          <p className="text-xs font-bold tracking-widest text-[#38BDF8] uppercase mt-0.5">
            MYC – METHODIST YOUTH CLUB
          </p>
          <p className="text-[11px] italic font-medium text-slate-300 mt-1">
            Faith • Hope • Love | Digital Attendance Management
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <div className="mb-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#0B2345]">
              {isRegisteringAdmin ? 'Register First Administrator' : 'Staff Login'}
            </h2>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-tight">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisteringAdmin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rev. Kwesi Mensah"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@methodistchurch.org.gh"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B70]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#123B70] hover:bg-[#0B2345] text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Authenticating...' : (isRegisteringAdmin ? 'Register Administrator' : 'Sign In to System')}</span>
              <ArrowRight className="w-4 h-4 text-[#38BDF8]" />
            </button>
          </form>

          {/* Toggle between Login and Register Admin */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsRegisteringAdmin(!isRegisteringAdmin);
                setErrorMsg(null);
              }}
              className="text-[#123B70] hover:underline font-bold"
            >
              {isRegisteringAdmin ? 'Back to Sign In' : 'Setup First Church Admin'}
            </button>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Role Protected
            </span>
          </div>

          {/* Quick Evaluation / Staff Preview Shortcuts */}
          <div className="mt-4 pt-3 border-t border-slate-100/80 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-3xl">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-2 text-center">
              Evaluation & Staff Preview
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginWithDemoStaff('admin')}
                className="py-2 px-2.5 bg-white border border-slate-200 hover:border-[#123B70] text-[#123B70] font-bold text-[11px] rounded-xl text-center shadow-2xs hover:bg-[#EAF6FF] transition-all"
              >
                Enter as Administrator
              </button>
              <button
                type="button"
                onClick={() => loginWithDemoStaff('attendance_officer')}
                className="py-2 px-2.5 bg-white border border-slate-200 hover:border-sky-500 text-sky-800 font-bold text-[11px] rounded-xl text-center shadow-2xs hover:bg-sky-50 transition-all"
              >
                Enter as Scanner Officer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-white/70">
        Methodist Church Ghana • MYC Attendance Management • Ghana Data Protection Act Compliant
      </div>
    </div>
  );
};
