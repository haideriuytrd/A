import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import { 
  Flame, Zap, Heart, Globe, Trophy, BookOpen, 
  LogOut, ChevronRight, Star, Target, Layers
} from 'lucide-react';

// API_URL provided by ../lib/api (uses window.__API_ORIGIN at runtime or env)

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const langRes = await axios.get(`${API_URL}/languages`);
        setLanguages(langRes.data);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const currentLanguage = user?.current_language;
  // Guard against non-array responses from the API (prevents "filter is not a function" crash)
  if (!Array.isArray(languages) && languages) {
    // eslint-disable-next-line no-console
    console.warn('Unexpected languages response (expected array):', languages);
  }
  const learningLanguages = Array.isArray(languages)
    ? languages.filter(l => user?.languages_learning?.includes(l.code))
    : [];

  // Calculate level progress
  const xpForCurrentLevel = ((user?.level || 1) - 1) * 100;
  const xpForNextLevel = (user?.level || 1) * 100;
  const levelProgress = ((user?.xp || 0) - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-slate-800">Stratos</span>
          </Link>

          {/* Stats */}
          <div className="flex items-center gap-6">
            {/* Streak */}
            <div className="flex items-center gap-2 streak-fire" data-testid="user-streak">
              <Flame className="w-6 h-6" />
              <span className="font-heading font-bold text-lg">{user?.streak || 0}</span>
            </div>
            
            {/* XP */}
            <div className="flex items-center gap-2 xp-zap" data-testid="user-xp">
              <Zap className="w-6 h-6" />
              <span className="font-heading font-bold text-lg">{user?.xp || 0}</span>
            </div>
            
            {/* Hearts */}
            <div className="flex items-center gap-2 hearts-display" data-testid="user-hearts">
              <Heart className="w-6 h-6 fill-current" />
              <span className="font-heading font-bold text-lg">{user?.hearts || 0}</span>
            </div>

            {/* Profile menu */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
              <Link 
                to="/profile" 
                className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-3 py-2 transition-colors"
                data-testid="nav-profile-link"
              >
                <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-3xl text-slate-800 mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Learner'}!
          </h1>
          <p className="text-slate-500">Keep up the great work on your language journey.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Language Card */}
            {currentLanguage && learningLanguages.length > 0 ? (
              <div className="stratos-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-bold text-xl text-slate-800">Continue Learning</h2>
                  <Link 
                    to="/languages"
                    className="text-sky-600 font-semibold hover:text-sky-700 flex items-center gap-1"
                  >
                    All Languages <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {learningLanguages.slice(0, 2).map(lang => (
                    <Link
                      key={lang.code}
                      to={`/learn/${lang.code}`}
                      className="stratos-card-interactive p-5 flex items-center gap-4"
                      data-testid={`continue-${lang.code}`}
                    >
                      <span className="text-5xl">{lang.flag}</span>
                      <div className="flex-1">
                        <div className="font-heading font-bold text-lg text-slate-800">{lang.name}</div>
                        <div className="text-sm text-slate-500">{lang.lessons_count} lessons</div>
                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all"
                            style={{ width: `${lang.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="stratos-card text-center py-12">
                <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-10 h-10 text-sky-500" />
                </div>
                <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">
                  Start Your Journey
                </h2>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Choose a language to begin your learning adventure!
                </p>
                <Link 
                  to="/languages" 
                  className="stratos-btn-primary inline-flex items-center gap-2"
                  data-testid="choose-language-btn"
                >
                  Choose a Language
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                to="/languages"
                className="stratos-card-interactive p-5 flex flex-col items-center text-center"
                data-testid="quick-languages"
              >
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
                  <Layers className="w-7 h-7 text-indigo-500" />
                </div>
                <span className="font-heading font-bold text-slate-800">Languages</span>
                <span className="text-sm text-slate-500">Browse all</span>
              </Link>

              <Link
                to="/leaderboard"
                className="stratos-card-interactive p-5 flex flex-col items-center text-center"
                data-testid="quick-leaderboard"
              >
                <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-3">
                  <Trophy className="w-7 h-7 text-yellow-500" />
                </div>
                <span className="font-heading font-bold text-slate-800">Leaderboard</span>
                <span className="text-sm text-slate-500">See rankings</span>
              </Link>

              <Link
                to="/profile"
                className="stratos-card-interactive p-5 flex flex-col items-center text-center"
                data-testid="quick-profile"
              >
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                  <Star className="w-7 h-7 text-green-500" />
                </div>
                <span className="font-heading font-bold text-slate-800">Achievements</span>
                <span className="text-sm text-slate-500">View badges</span>
              </Link>
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Level Progress */}
            <div className="stratos-card">
              <h3 className="font-heading font-bold text-lg text-slate-800 mb-4">Your Level</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <span className="font-heading font-extrabold text-2xl text-white">{user?.level || 1}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-800">Level {user?.level || 1}</div>
                  <div className="text-sm text-slate-500">{user?.xp || 0} XP total</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Progress to Level {(user?.level || 1) + 1}</span>
                  <span className="font-medium text-slate-700">{Math.round(levelProgress)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${levelProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="stratos-card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center">
                  <Flame className="w-9 h-9 text-white" />
                </div>
                <div>
                  <div className="font-heading font-extrabold text-3xl text-orange-600">{user?.streak || 0}</div>
                  <div className="text-orange-700 font-medium">Day Streak</div>
                </div>
              </div>
              <p className="mt-4 text-orange-700 text-sm">
                {user?.streak > 0 
                  ? "Keep it going! Practice today to maintain your streak."
                  : "Start your streak by completing a lesson today!"
                }
              </p>
            </div>

            {/* Hearts Card */}
            <div className="stratos-card bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`w-6 h-6 ${i < (user?.hearts || 0) ? 'text-red-500 fill-red-500' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="font-heading font-bold text-xl text-red-600">{user?.hearts || 0}/5</span>
              </div>
              <p className="mt-3 text-red-700 text-sm">
                Hearts protect you from mistakes. They refill over time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
