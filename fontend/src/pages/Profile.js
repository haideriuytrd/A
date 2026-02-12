import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, Flame, Zap, Heart, Trophy, Target, Star,
  Award, Baby, Calendar, Crown, Globe, Sparkles, LogOut
} from 'lucide-react';

// API_URL moved to ../lib/api

const ACHIEVEMENT_ICONS = {
  'baby': Baby,
  'flame': Flame,
  'calendar': Calendar,
  'trophy': Trophy,
  'zap': Zap,
  'star': Star,
  'crown': Crown,
  'target': Target,
  'globe': Globe,
  'sparkles': Sparkles,
  'award': Award,
};

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const response = await axios.get(`${API_URL}/achievements`);
        setAchievements(response.data);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const xpForCurrentLevel = ((user?.level || 1) - 1) * 100;
  const xpForNextLevel = (user?.level || 1) * 100;
  const levelProgress = ((user?.xp || 0) - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-500 to-indigo-500">
        <div className="max-w-4xl mx-auto px-6 pt-6 pb-24">
          <div className="flex items-center justify-between mb-8">
            <Link 
              to="/dashboard"
              className="text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <button
              onClick={handleLogout}
              className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
              data-testid="profile-logout-btn"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
          
          {/* Profile info */}
          <div className="text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-sky-500 font-heading font-bold text-4xl shadow-lg">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <h1 className="font-heading font-extrabold text-3xl text-white mb-1">
              {user?.name || 'Learner'}
            </h1>
            <p className="text-white/80">{user?.email}</p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <main className="max-w-4xl mx-auto px-6 -mt-16">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="stratos-card text-center">
            <div className="flex justify-center mb-2">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <div className="font-heading font-extrabold text-2xl text-slate-800">{user?.streak || 0}</div>
            <div className="text-sm text-slate-500">Day Streak</div>
          </div>
          
          <div className="stratos-card text-center">
            <div className="flex justify-center mb-2">
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="font-heading font-extrabold text-2xl text-slate-800">{user?.xp || 0}</div>
            <div className="text-sm text-slate-500">Total XP</div>
          </div>
          
          <div className="stratos-card text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="font-heading font-extrabold text-2xl text-slate-800">{user?.level || 1}</div>
            <div className="text-sm text-slate-500">Level</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="stratos-card mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-lg text-slate-800">Level Progress</h3>
            <span className="text-sm text-slate-500">
              {user?.xp || 0} / {xpForNextLevel} XP
            </span>
          </div>
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all"
              style={{ width: `${levelProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {Math.ceil(xpForNextLevel - (user?.xp || 0))} XP until Level {(user?.level || 1) + 1}
          </p>
        </div>

        {/* Languages Learning */}
        {user?.languages_learning?.length > 0 && (
          <div className="stratos-card mb-8">
            <h3 className="font-heading font-bold text-lg text-slate-800 mb-4">Languages</h3>
            <div className="flex flex-wrap gap-3">
              {user.languages_learning.map(code => {
                const flags = {
                  es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', ja: '🇯🇵', zh: '🇨🇳',
                  it: '🇮🇹', pt: '🇧🇷', ko: '🇰🇷', ru: '🇷🇺', ar: '🇸🇦'
                };
                const names = {
                  es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', zh: 'Chinese',
                  it: 'Italian', pt: 'Portuguese', ko: 'Korean', ru: 'Russian', ar: 'Arabic'
                };
                return (
                  <Link
                    key={code}
                    to={`/learn/${code}`}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-sky-100 px-4 py-2 rounded-xl transition-colors"
                  >
                    <span className="text-2xl">{flags[code] || '🌍'}</span>
                    <span className="font-medium text-slate-700">{names[code] || code}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="stratos-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-lg text-slate-800">Achievements</h3>
            <span className="text-sm text-slate-500">{unlockedCount} / {achievements.length} unlocked</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {achievements.map(achievement => {
                const IconComponent = ACHIEVEMENT_ICONS[achievement.icon] || Award;
                return (
                  <div
                    key={achievement.id}
                    className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'} text-center p-4 rounded-2xl border-2 ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' 
                        : 'bg-slate-50 border-slate-100'
                    }`}
                    data-testid={`achievement-${achievement.id}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                        : 'bg-slate-200'
                    }`}>
                      <IconComponent className={`w-7 h-7 ${
                        achievement.unlocked ? 'text-white' : 'text-slate-400'
                      }`} />
                    </div>
                    <h4 className={`font-heading font-bold text-sm ${
                      achievement.unlocked ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{achievement.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hearts */}
        <div className="stratos-card bg-gradient-to-br from-red-50 to-pink-50 border-red-200 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-800 mb-1">Hearts</h3>
              <p className="text-sm text-slate-500">Hearts protect you from mistakes</p>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-7 h-7 ${i < (user?.hearts || 0) ? 'text-red-500 fill-red-500' : 'text-slate-300'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Member since */}
        <div className="text-center text-slate-400 text-sm pb-8">
          Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          }) : 'recently'}
        </div>
      </main>
    </div>
  );
};

export default Profile;
