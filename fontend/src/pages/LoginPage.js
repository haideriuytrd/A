import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Globe, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      // Don't navigate here - let PublicRoute handle it when user state updates
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to home</span>
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <span className="font-heading font-extrabold text-3xl text-slate-800">Stratos</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl text-slate-800 mb-2">
            Welcome back!
          </h1>
          <p className="text-slate-500 mb-8">
            Continue your language learning journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="stratos-input"
                data-testid="login-email-input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="stratos-input pr-12"
                  data-testid="login-password-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="stratos-btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Logging in...
                </span>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-sky-600 font-semibold hover:text-sky-700 transition-colors"
              data-testid="login-signup-link"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-sky-400 to-indigo-500 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <img 
            src="https://images.unsplash.com/photo-1713811978849-414ce73e4d3c?w=500&h=400&fit=crop"
            alt="Happy learner"
            className="rounded-3xl shadow-2xl mb-8"
          />
          <h2 className="font-heading font-extrabold text-3xl text-white mb-4">
            Learn Anywhere, Anytime
          </h2>
          <p className="text-white/90 text-lg">
            Pick up where you left off and continue your journey to fluency.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
