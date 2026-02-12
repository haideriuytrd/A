import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../lib/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, X, Volume2, Check, ChevronRight, Zap, Flame, Trophy, Heart
} from 'lucide-react';
import { Progress } from '../components/ui/progress';

// API_URL moved to ../lib/api

const LessonPlayer = () => {
  const { language, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await axios.get(`${API_URL}/lessons/${language}/${lessonId}`);
        setLesson(response.data);
        setAnswers(new Array(response.data.content.length).fill(''));
      } catch (error) {
        console.error('Failed to fetch lesson:', error);
        toast.error('Failed to load lesson');
        navigate(`/learn/${language}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [language, lessonId, navigate]);

  const currentQuestion = lesson?.content?.[currentIndex];
  const progress = lesson ? ((currentIndex) / lesson.content.length) * 100 : 0;
  const isLastQuestion = currentIndex === (lesson?.content?.length || 0) - 1;

  const handlePlayVoice = () => {
    // In a real app, this would play the audio file
    // For now, we'll use the Web Speech API as a fallback
    if ('speechSynthesis' in window) {
      const text = currentQuestion?.correct_answer || '';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'es' ? 'es-ES' : 
                       language === 'fr' ? 'fr-FR' : 
                       language === 'de' ? 'de-DE' : 
                       language === 'ja' ? 'ja-JP' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const checkAnswer = () => {
    const userAnswer = currentQuestion?.type === 'written' || currentQuestion?.type === 'voice'
      ? writtenAnswer.toLowerCase().trim()
      : selectedOption;
    
    const correctAnswer = currentQuestion?.correct_answer?.toLowerCase().trim();
    const correct = userAnswer === correctAnswer;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    // Save answer
    const newAnswers = [...answers];
    newAnswers[currentIndex] = userAnswer;
    setAnswers(newAnswers);

    if (!correct) {
      toast.error('Not quite right!');
    } else {
      toast.success('Correct!');
    }
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      // Submit lesson
      setSubmitting(true);
      try {
        const response = await axios.post(`${API_URL}/lessons/${language}/${lessonId}/complete`, {
          lesson_id: lessonId,
          answers: answers
        });
        setResult(response.data);
        await refreshUser();
      } catch (error) {
        console.error('Failed to submit lesson:', error);
        toast.error('Failed to complete lesson');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Move to next question
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setWrittenAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      
      // Focus input for written questions
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
      navigate(`/learn/${language}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full stratos-card text-center">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
            result.passed ? 'bg-green-500' : 'bg-orange-500'
          }`}>
            {result.passed ? (
              <Trophy className="w-12 h-12 text-white" />
            ) : (
              <span className="text-5xl">💪</span>
            )}
          </div>
          
          <h1 className="font-heading font-extrabold text-3xl text-slate-800 mb-2">
            {result.passed ? 'Lesson Complete!' : 'Keep Practicing!'}
          </h1>
          
          <p className="text-slate-500 mb-6">
            {result.passed 
              ? 'Great job! You\'ve mastered this lesson.'
              : 'You need 70% to pass. Try again!'}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="stratos-card bg-slate-50">
              <div className="font-heading font-bold text-2xl text-slate-800">{result.correct}/{result.total}</div>
              <div className="text-sm text-slate-500">Correct</div>
            </div>
            <div className="stratos-card bg-yellow-50 border-yellow-200">
              <div className="font-heading font-bold text-2xl text-yellow-600 flex items-center justify-center gap-1">
                <Zap className="w-5 h-5" />
                {result.xp_earned}
              </div>
              <div className="text-sm text-yellow-700">XP Earned</div>
            </div>
          </div>

          {result.streak_bonus > 0 && (
            <div className="stratos-card bg-orange-50 border-orange-200 mb-6">
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <Flame className="w-5 h-5" />
                <span className="font-bold">+{result.streak_bonus} Streak Bonus!</span>
              </div>
            </div>
          )}

          {result.new_level && (
            <div className="stratos-card bg-indigo-50 border-indigo-200 mb-6">
              <div className="font-heading font-bold text-xl text-indigo-600">
                🎉 Level Up! You're now Level {result.new_level}!
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link 
              to={`/learn/${language}`}
              className="flex-1 stratos-btn-secondary"
              data-testid="back-to-lessons"
            >
              Back to Lessons
            </Link>
            <Link 
              to="/dashboard"
              className="flex-1 stratos-btn-primary"
              data-testid="go-dashboard"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button 
            onClick={handleExit}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            data-testid="exit-lesson-btn"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex-1">
            <Progress value={progress} className="h-3" />
          </div>
          
          <div className="flex items-center gap-2 hearts-display">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-bold">{user?.hearts || 0}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          {/* Question */}
          <div className="mb-8">
            {currentQuestion?.type === 'voice' && (
              <button
                onClick={handlePlayVoice}
                className="w-24 h-24 bg-sky-500 hover:bg-sky-400 rounded-full flex items-center justify-center mx-auto mb-6 transition-all hover:scale-105 active:scale-95"
                data-testid="play-voice-btn"
              >
                <Volume2 className="w-12 h-12 text-white" />
              </button>
            )}
            
            <h2 className="font-heading font-bold text-2xl text-slate-800 text-center mb-2">
              {currentQuestion?.question}
            </h2>
            
            {currentQuestion?.hint && !showResult && (
              <p className="text-slate-500 text-center text-sm">
                Hint: {currentQuestion.hint}
              </p>
            )}
          </div>

          {/* Answer Input */}
          {currentQuestion?.type === 'multiple_choice' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedOption(option)}
                  disabled={showResult}
                  className={`w-full lesson-option text-left ${
                    selectedOption === option ? 'selected' : ''
                  } ${
                    showResult && option === currentQuestion.correct_answer ? 'correct' : ''
                  } ${
                    showResult && selectedOption === option && option !== currentQuestion.correct_answer ? 'incorrect' : ''
                  }`}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="font-medium text-slate-700">{option}</span>
                    {showResult && option === currentQuestion.correct_answer && (
                      <Check className="w-5 h-5 text-green-500 ml-auto" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {(currentQuestion?.type === 'written' || currentQuestion?.type === 'voice') && (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={writtenAnswer}
                onChange={(e) => setWrittenAnswer(e.target.value)}
                placeholder="Type your answer..."
                disabled={showResult}
                className={`stratos-input text-center text-xl ${
                  showResult && isCorrect ? 'border-green-400 bg-green-50' : ''
                } ${
                  showResult && !isCorrect ? 'border-red-400 bg-red-50' : ''
                }`}
                data-testid="written-answer-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && writtenAnswer && !showResult) {
                    checkAnswer();
                  }
                }}
              />
              
              {showResult && !isCorrect && (
                <p className="text-center mt-3 text-green-600 font-medium">
                  Correct answer: {currentQuestion.correct_answer}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8">
            {!showResult ? (
              <button
                onClick={checkAnswer}
                disabled={!selectedOption && !writtenAnswer}
                className="stratos-btn-primary w-full text-lg disabled:opacity-50"
                data-testid="check-answer-btn"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={submitting}
                className={`w-full text-lg font-extrabold rounded-2xl border-b-4 px-8 py-4 transition-all ${
                  isCorrect 
                    ? 'bg-green-500 hover:bg-green-400 text-white border-green-700' 
                    : 'bg-orange-500 hover:bg-orange-400 text-white border-orange-700'
                }`}
                data-testid="continue-btn"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isLastQuestion ? 'Complete Lesson' : 'Continue'}
                    <ChevronRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LessonPlayer;
