import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import { Globe, ArrowLeft, ChevronRight, Check, BookOpen } from 'lucide-react';

const LanguageSelect = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API_URL}/languages`);
        setLanguages(response.data);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        toast.error('Failed to load languages');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const handleSelectLanguage = async (langCode) => {
    setSelecting(langCode);
    try {
      await axios.post(`${API_URL}/languages/${langCode}/start`);
      await refreshUser();
      toast.success("Language selected! Let's start learning!");
      navigate(`/learn/${langCode}`);
    } catch (error) {
      console.error('Failed to select language:', error);
      toast.error('Failed to select language');
    } finally {
      setSelecting(null);
    }
  };

  const isLearning = (code) => user?.languages_learning?.includes(code);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-slate-800">Choose a Language</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="font-heading font-extrabold text-4xl text-slate-800 mb-4">What do you want to learn?</h1>
          <p className="text-xl text-slate-500">Choose a language and start your journey to fluency</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(languages)
              ? languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    disabled={selecting !== null}
                    className={`stratos-card-interactive p-6 text-left relative overflow-hidden group ${
                      isLearning(lang.code) ? 'ring-2 ring-sky-400' : ''
                    }`}
                    data-testid={`select-language-${lang.code}`}>
                    {isLearning(lang.code) && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-6xl group-hover:scale-110 transition-transform">{lang.flag}</span>
                      <div>
                        <h3 className="font-heading font-bold text-xl text-slate-800">{lang.name}</h3>
                        <p className="text-slate-500">{lang.lessons_count} lessons</p>
                      </div>
                    </div>

                    {isLearning(lang.code) && lang.progress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-medium text-slate-700">{lang.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full"
                            style={{ width: `${lang.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {selecting === lang.code && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-sky-600 font-semibold">
                      <span>{isLearning(lang.code) ? 'Continue' : 'Start Learning'}</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))
              : null}
          </div>
        )}

        <div className="mt-12 stratos-card bg-gradient-to-br from-indigo-50 to-sky-50 border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-800 mb-1">Learn Multiple Languages</h3>
              <p className="text-slate-600">
                You can learn as many languages as you want! Switch between them anytime from the dashboard.
                Earn the Polyglot badge by learning 3 or more languages.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LanguageSelect;
