import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, RotateCcw, Volume2, ChevronLeft, ChevronRight, Check
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

const Flashcards = () => {
  const { language } = useParams();
  const { user } = useAuth();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSet, setCurrentSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState([]);

  const langInfo = LANGUAGES[language] || { name: 'Language', flag: '🌍' };

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await axios.get(`${API_URL}/flashcards/${language}`);
        setSets(response.data);
        if (response.data.length > 0) {
          setCurrentSet(response.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch flashcards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [language]);

  const currentCard = currentSet?.cards?.[currentCardIndex];
  const totalCards = currentSet?.cards?.length || 0;
  const progress = totalCards > 0 ? ((currentCardIndex + 1) / totalCards) * 100 : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleKnown = () => {
    if (!knownCards.includes(currentCardIndex)) {
      setKnownCards([...knownCards, currentCardIndex]);
    }
    handleNext();
  };

  const handleReset = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
  };

  const handlePlayVoice = () => {
    if ('speechSynthesis' in window && currentCard) {
      const text = currentCard.back;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'es' ? 'es-ES' : 
                       language === 'fr' ? 'fr-FR' : 
                       language === 'de' ? 'de-DE' : 
                       language === 'ja' ? 'ja-JP' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={`/learn/${language}`}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{langInfo.flag}</span>
              <div>
                <span className="font-heading font-bold text-lg text-slate-800">Flashcards</span>
                <span className="text-slate-400 mx-2">•</span>
                <span className="text-slate-500">{currentSet?.title || 'Practice'}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="stratos-btn-secondary flex items-center gap-2"
            data-testid="reset-flashcards"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {!currentSet || totalCards === 0 ? (
          <div className="stratos-card text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="font-heading font-bold text-2xl text-slate-800 mb-2">
              No Flashcards Yet
            </h2>
            <p className="text-slate-500 mb-6">
              Flashcards for {langInfo.name} are coming soon!
            </p>
            <Link 
              to={`/learn/${language}`}
              className="stratos-btn-primary inline-block"
            >
              Back to Lessons
            </Link>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Card {currentCardIndex + 1} of {totalCards}</span>
                <span className="text-green-600 font-medium">{knownCards.length} known</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Flashcard */}
            <div 
              onClick={handleFlip}
              className="relative h-72 cursor-pointer perspective-1000 mb-8"
              data-testid="flashcard"
            >
              <div className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}>
                {/* Front */}
                <div className={`absolute inset-0 stratos-card flex flex-col items-center justify-center backface-hidden ${
                  knownCards.includes(currentCardIndex) ? 'border-green-300 bg-green-50' : ''
                }`}>
                  {knownCards.includes(currentCardIndex) && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <p className="text-slate-400 text-sm mb-2">English</p>
                  <h2 className="font-heading font-bold text-3xl text-slate-800 text-center">
                    {currentCard?.front}
                  </h2>
                  <p className="text-slate-400 text-sm mt-6">Tap to flip</p>
                </div>

                {/* Back */}
                <div className={`absolute inset-0 stratos-card flex flex-col items-center justify-center backface-hidden rotate-y-180 bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-200 ${
                  knownCards.includes(currentCardIndex) ? 'border-green-300 bg-green-50' : ''
                }`}>
                  <p className="text-sky-600 text-sm mb-2">{langInfo.name}</p>
                  <h2 className="font-heading font-bold text-3xl text-slate-800 text-center">
                    {currentCard?.back}
                  </h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayVoice();
                    }}
                    className="mt-4 w-12 h-12 bg-sky-500 hover:bg-sky-400 rounded-full flex items-center justify-center transition-colors"
                    data-testid="play-pronunciation"
                  >
                    <Volume2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePrev}
                disabled={currentCardIndex === 0}
                className="stratos-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="prev-card"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleKnown}
                className="stratos-btn-success flex items-center gap-2"
                data-testid="mark-known"
              >
                <Check className="w-5 h-5" />
                I Know This
              </button>

              <button
                onClick={handleNext}
                disabled={currentCardIndex === totalCards - 1}
                className="stratos-btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="next-card"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Keyboard hint */}
            <p className="text-center text-slate-400 text-sm mt-6">
              Use arrow keys to navigate, spacebar to flip
            </p>
          </>
        )}
      </main>

      {/* CSS for 3D flip effect */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default Flashcards;
