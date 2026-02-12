import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, Lock, Check, Star, BookOpen, Layers
} from 'lucide-react';

// API_URL moved to ../lib/api

const LANGUAGES = {
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  it: { name: 'Italian', flag: '🇮🇹' },
  pt: { name: 'Portuguese', flag: '🇧🇷' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  ar: { name: 'Arabic', flag: '🇸🇦' },
};

const LessonPath = () => {
  const { language } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const langInfo = LANGUAGES[language] || { name: 'Language', flag: '🌍' };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await axios.get(`${API_URL}/lessons/${language}`);
        setLessons(response.data);
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
        toast.error('Failed to load lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [language]);

  const handleStartLesson = (lesson) => {
    if (lesson.locked) {
      toast.error('Complete the previous lesson first!');
      return;
    }
    navigate(`/lesson/${language}/${lesson.id}`);
  };

  // Find the current (next uncompleted) lesson
  const currentLessonIndex = lessons.findIndex(l => !l.completed && !l.locked);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{langInfo.flag}</span>
              <span className="font-heading font-bold text-xl text-slate-800">{langInfo.name}</span>
            </div>
          </div>
          
          <Link
            to={`/flashcards/${language}`}
            className="stratos-btn-secondary flex items-center gap-2"
            data-testid="flashcards-link"
          >
            <Layers className="w-5 h-5" />
            <span>Flashcards</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
          </div>
        ) : lessons.length === 0 ? (
          <div className="stratos-card text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">
              Coming Soon!
            </h2>
            <p className="text-slate-500 mb-6">
              Lessons for {langInfo.name} are being prepared. Check back soon!
            </p>
            <Link 
              to="/languages" 
              className="stratos-btn-primary inline-block"
            >
              Try Another Language
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Path line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2 z-0"></div>

            {/* Lessons */}
            <div className="relative z-10 space-y-8">
              {lessons.map((lesson, index) => {
                const isCompleted = lesson.completed;
                const isCurrent = index === currentLessonIndex;
                const isLocked = lesson.locked;

                return (
                  <div 
                    key={lesson.id}
                    className={`flex items-center gap-6 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Lesson Card */}
                    <button
                      onClick={() => handleStartLesson(lesson)}
                      disabled={isLocked}
                      className={`flex-1 stratos-card transition-all ${
                        isLocked 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:-translate-y-1 hover:shadow-lg cursor-pointer'
                      } ${isCurrent ? 'ring-2 ring-sky-400 ring-offset-2' : ''}`}
                      data-testid={`lesson-${lesson.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-500' 
                            : isCurrent 
                              ? 'bg-sky-500 animate-pulse' 
                              : 'bg-slate-200'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-6 h-6 text-white" />
                          ) : isLocked ? (
                            <Lock className="w-5 h-5 text-slate-400" />
                          ) : (
                            <Star className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-heading font-bold text-lg text-slate-800">
                            {lesson.title}
                          </h3>
                          <p className="text-slate-500 text-sm">{lesson.description}</p>
                          <div className="mt-2 flex items-center gap-3 text-sm">
                            <span className="text-yellow-600 font-medium">+{lesson.xp_reward} XP</span>
                            {isCompleted && lesson.score > 0 && (
                              <span className="text-green-600 font-medium">Score: {lesson.score}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Node on path */}
                    <div className={`w-8 h-8 rounded-full border-4 flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-green-500 border-green-300' 
                        : isCurrent 
                          ? 'bg-sky-500 border-sky-300 animate-pulse' 
                          : 'bg-slate-200 border-slate-100'
                    }`}></div>

                    {/* Spacer */}
                    <div className="flex-1"></div>
                  </div>
                );
              })}
            </div>

            {/* End trophy */}
            <div className="flex justify-center mt-12">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl">🏆</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LessonPath;
