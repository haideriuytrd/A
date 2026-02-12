import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { 
  ArrowLeft, Trophy, Medal, Flame, Zap, Crown
} from 'lucide-react';

// API_URL moved to ../lib/api

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/leaderboard`);
        setLeaderboard(response.data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="font-bold text-slate-500">{rank}</span>;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return 'bg-white';
  };

  // Find user's rank
  const userRank = leaderboard.find(entry => entry.user_id === user?.id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-500 to-sky-500 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to="/dashboard"
              className="text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="font-heading font-extrabold text-3xl">Leaderboard</h1>
          </div>
          
          {/* Top 3 podium */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-4 pt-8">
              {/* 2nd place */}
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-heading font-bold text-2xl">{leaderboard[1]?.name?.[0]}</span>
                </div>
                <p className="font-bold truncate max-w-20">{leaderboard[1]?.name}</p>
                <p className="text-white/80 text-sm">{leaderboard[1]?.xp} XP</p>
                <div className="mt-2 bg-slate-300 rounded-t-lg h-24 w-20 flex items-center justify-center">
                  <span className="font-heading font-bold text-4xl text-slate-600">2</span>
                </div>
              </div>

              {/* 1st place */}
              <div className="text-center -mt-8">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2 ring-4 ring-yellow-300">
                  <span className="font-heading font-bold text-3xl text-yellow-800">{leaderboard[0]?.name?.[0]}</span>
                </div>
                <p className="font-bold truncate max-w-24">{leaderboard[0]?.name}</p>
                <p className="text-white/80 text-sm">{leaderboard[0]?.xp} XP</p>
                <div className="mt-2 bg-yellow-400 rounded-t-lg h-32 w-24 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-yellow-700" />
                </div>
              </div>

              {/* 3rd place */}
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-heading font-bold text-2xl">{leaderboard[2]?.name?.[0]}</span>
                </div>
                <p className="font-bold truncate max-w-20">{leaderboard[2]?.name}</p>
                <p className="text-white/80 text-sm">{leaderboard[2]?.xp} XP</p>
                <div className="mt-2 bg-amber-600 rounded-t-lg h-16 w-20 flex items-center justify-center">
                  <span className="font-heading font-bold text-4xl text-amber-200">3</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="stratos-card text-center py-12">
            <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">
              No Rankings Yet
            </h2>
            <p className="text-slate-500">
              Complete lessons to appear on the leaderboard!
            </p>
          </div>
        ) : (
          <>
            {/* Your rank */}
            {userRank && (
              <div className="stratos-card bg-sky-50 border-sky-200 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {userRank.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-lg text-slate-800">Your Rank</p>
                    <p className="text-slate-500">{userRank.xp} XP • Level {userRank.level}</p>
                  </div>
                  <div className="flex items-center gap-2 text-orange-500">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">{userRank.streak}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full list */}
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.user_id}
                  className={`stratos-card flex items-center gap-4 ${getRankStyle(entry.rank)} ${
                    entry.user_id === user?.id ? 'ring-2 ring-sky-400' : ''
                  }`}
                  data-testid={`leaderboard-entry-${entry.rank}`}
                >
                  {/* Rank */}
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getRankBadge(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    entry.rank === 1 ? 'bg-yellow-500' :
                    entry.rank === 2 ? 'bg-slate-400' :
                    entry.rank === 3 ? 'bg-amber-600' :
                    'bg-sky-500'
                  }`}>
                    {entry.name?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-heading font-bold text-slate-800">
                      {entry.name}
                      {entry.user_id === user?.id && (
                        <span className="text-sky-500 text-sm ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500">Level {entry.level}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-4 h-4" />
                      <span className="font-medium">{entry.streak}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Zap className="w-4 h-4" />
                      <span className="font-bold">{entry.xp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
