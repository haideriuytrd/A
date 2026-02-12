import { Link } from 'react-router-dom';
import { Flame, Zap, Heart, Globe, Trophy, BookOpen, Sparkles, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-extrabold text-2xl text-slate-800">Stratos</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              data-testid="nav-login-btn"
              className="px-6 py-2.5 text-slate-600 font-semibold hover:text-sky-600 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              data-testid="nav-signup-btn"
              className="stratos-btn-primary text-base py-2.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-transparent"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-sky-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute top-60 right-10 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-30"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-100">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-slate-600">Learn 10+ languages for free</span>
              </div>

              <h1 className="font-heading font-extrabold text-5xl lg:text-6xl xl:text-7xl text-slate-800 leading-tight">
                Elevate Your
                <span className="block bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                  Language Skills
                </span>
              </h1>

              <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                Join millions of learners worldwide. Master new languages through fun,
                bite-sized lessons, flashcards, and interactive quizzes.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/signup"
                  data-testid="hero-get-started-btn"
                  className="stratos-btn-primary text-lg flex items-center gap-2"
                >
                  Start Learning Free
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  data-testid="hero-login-btn"
                  className="stratos-btn-secondary text-lg"
                >
                  I have an account
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <div className="font-heading font-extrabold text-3xl text-slate-800">10+</div>
                  <div className="text-slate-500 font-medium">Languages</div>
                </div>
                <div>
                  <div className="font-heading font-extrabold text-3xl text-slate-800">500K+</div>
                  <div className="text-slate-500 font-medium">Learners</div>
                </div>
                <div>
                  <div className="font-heading font-extrabold text-3xl text-slate-800">50M+</div>
                  <div className="text-slate-500 font-medium">Lessons Completed</div>
                </div>
              </div>
            </div>

            {/* Right content - Hero Image */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1668106576752-f049d50680bb?w=600&h=500&fit=crop"
                  alt="Language learning adventure"
                  className="rounded-3xl shadow-2xl w-full max-w-lg mx-auto"
                />
              </div>

              {/* Floating cards */}
              <div className="absolute -left-4 top-20 bg-white rounded-2xl p-4 shadow-xl animate-float z-20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Flame className="w-7 h-7 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-800">7 Day Streak!</div>
                    <div className="text-sm text-slate-500">Keep it going!</div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-20 bg-white rounded-2xl p-4 shadow-xl animate-float z-20" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-7 h-7 text-yellow-500" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-800">+150 XP</div>
                    <div className="text-sm text-slate-500">Lesson complete!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-extrabold text-4xl text-slate-800 mb-4">
              Learning Made Fun
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Our bite-sized lessons fit into your busy schedule, while gamification keeps you motivated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: 'Interactive Lessons', desc: 'Learn through writing, listening, and speaking exercises', color: 'sky' },
              { icon: Flame, title: 'Daily Streaks', desc: 'Build habits with streak tracking and reminders', color: 'orange' },
              { icon: Trophy, title: 'Leaderboards', desc: 'Compete with friends and climb the ranks', color: 'yellow' },
              { icon: Heart, title: 'Hearts System', desc: 'Learn from mistakes without losing progress', color: 'red' },
            ].map((feature, i) => (
              <div
                key={i}
                className="stratos-card-interactive p-6 group"
              >
                <div className={`w-14 h-14 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-500`} />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-extrabold text-4xl text-slate-800 mb-4">
              Choose Your Language
            </h2>
            <p className="text-xl text-slate-500">
              Start learning any of our 10+ languages today
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              { flag: '🇪🇸', name: 'Spanish' },
              { flag: '🇫🇷', name: 'French' },
              { flag: '🇩🇪', name: 'German' },
              { flag: '🇯🇵', name: 'Japanese' },
              { flag: '🇨🇳', name: 'Chinese' },
              { flag: '🇮🇹', name: 'Italian' },
              { flag: '🇧🇷', name: 'Portuguese' },
              { flag: '🇰🇷', name: 'Korean' },
              { flag: '🇷🇺', name: 'Russian' },
              { flag: '🇸🇦', name: 'Arabic' },
            ].map((lang, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm border-2 border-slate-100 hover:border-sky-300 hover:-translate-y-1 transition-all cursor-pointer"
              >
                <span className="text-4xl">{lang.flag}</span>
                <span className="font-semibold text-slate-700">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-sky-500 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading font-extrabold text-4xl lg:text-5xl text-white mb-6">
            Ready to Elevate Your Language Skills?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the Stratos community today and start your language learning journey.
          </p>
          <Link
            to="/signup"
            data-testid="cta-signup-btn"
            className="inline-flex items-center gap-2 bg-white text-sky-600 font-extrabold text-lg px-8 py-4 rounded-2xl hover:bg-sky-50 transition-colors shadow-xl"
          >
            Get Started for Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-extrabold text-2xl text-white">Stratos</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 Stratos. Elevate Your Language Skills.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
