import { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

export default function Signup() {
  const { signUp, session } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get('redirect') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(false);

  if (session?.user) return <Navigate to={redirectTo} replace />;

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Enter your full name';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error, needsEmailConfirm } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) {
      push(error, 'error');
      return;
    }
    if (needsEmailConfirm) {
      push('Account created. Check your email to confirm, then sign in.', 'info');
      navigate('/login');
      return;
    }
    push('Account created. Welcome to PriceHub!');
    navigate(redirectTo);
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900" />
      <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-extrabold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">Join PriceHub and start shopping</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Full Name</label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-field !pl-10" placeholder="John Doe" />
              </div>
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field !pl-10" placeholder="you@example.com" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-10" placeholder="8+ chars" />
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Confirm</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field !pl-10" placeholder="Repeat" />
                </div>
                {errors.confirm && <p className="mt-1 text-xs text-rose-600">{errors.confirm}</p>}
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-accent w-full !py-3">
              {loading ? 'Creating account…' : <>Create Account <ArrowRight width={18} height={18} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-bold text-emerald-600 hover:text-emerald-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
