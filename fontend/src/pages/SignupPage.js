import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Globe, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Welcome to Stratos!');
      // Don't navigate here - let PublicRoute handle it when user state updates
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-500 to-sky-400 items-center justify-center p-12">
        <div className="max-w-lg">
          <h2 className="font-heading font-extrabold text-4xl text-white mb-6">
            Start Your Journey Today
          </h2>
          
          <div className="space-y-4">
            {[
              'Learn 10+ languages for free',
              'Fun, bite-sized lessons',
              'Track your progress with XP',
              'Compete on leaderboards',
              'Earn achievements and badges',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-lg">{item}</span>
              </div>
            ))}
          </div>
          
          <img 
            src="https://images.unsplash.com/photo-1634096996263-164e157c9099?w=500&h=300&fit=crop"
            alt="Diverse community"
            className="rounded-3xl shadow-2xl mt-8"
          />
        </div>
      </div>

      {/* Right side - Form */}
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
            Create your account
          </h1>
          <p className="text-slate-500 mb-8">
            Start learning a new language for free
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="stratos-input"
                data-testid="signup-name-input"
                autoComplete="name"
              />
            </div>

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
                data-testid="signup-email-input"
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
                  placeholder="At least 6 characters"
                  className="stratos-input pr-12"
                  data-testid="signup-password-input"
                  autoComplete="new-password"
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
              data-testid="signup-submit-btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-sky-600 font-semibold hover:text-sky-700 transition-colors"
              data-testid="signup-login-link"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
