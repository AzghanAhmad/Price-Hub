import { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

export default function Login() {
  const { signIn, session } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  if (session?.user) return <Navigate to={redirectTo} replace />;

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      push(error, 'error');
    } else {
      push('Welcome back!');
      navigate(redirectTo);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to your PriceHub account</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-10"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pl-10"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-accent w-full !py-3">
              {loading ? 'Signing in…' : <>Sign In <ArrowRight width={18} height={18} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account? <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-700">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
