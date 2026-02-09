import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loginWithOAuth } from '../api/auth';
import OAuthButton from '../components/auth/OAuthButton';
import { Layers, Zap, Shield, Users, Sparkles } from 'lucide-react';

// Unique value propositions
const highlights = [
  { icon: Layers, title: 'Structured Knowledge', description: 'Organize ideas into connected spaces' },
  { icon: Zap, title: 'Lightning Fast', description: 'Real-time sync, instant search' },
  { icon: Users, title: 'Built for Teams', description: 'Collaborate with granular permissions' },
  { icon: Shield, title: 'Enterprise Ready', description: 'Your data stays yours, always' },
];

function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(errorMsg);
    }
  }, [searchParams]);

  const handleLogin = async (provider) => {
    setLoadingProvider(provider);
    setError(null);
    try {
      await loginWithOAuth(provider);
    } catch (err) {
      setError(err.message);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-[55%] bg-[var(--color-bg-tertiary)] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-32 h-32 border border-[var(--color-accent)]/20 rounded-3xl rotate-12" />
          <div className="absolute bottom-32 right-40 w-20 h-20 border border-[var(--color-accent)]/15 rounded-2xl -rotate-6" />
          <div className="absolute top-40 left-16 w-24 h-24 bg-[var(--color-accent)]/10 rounded-full blur-xl" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-48 -left-32 w-72 h-72 bg-[var(--color-accent)]/5 rounded-full blur-3xl" />
        </div>
        
        {/* Logo */}
        <div className={`flex items-center gap-3 relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-accent)] to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <span className="text-[var(--color-text-primary)] font-bold text-lg tracking-tight">E-Docs</span>
            <span className="text-[var(--color-accent)] text-[10px] block -mt-0.5">Knowledge Platform</span>
          </div>
        </div>

        {/* Main Message */}
        <div className={`relative z-10 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] leading-tight mb-4">
            Your ideas,<br />
            <span className="text-[var(--color-accent)]">
              beautifully organized.
            </span>
          </h1>
          <p className="text-[var(--color-text-muted)] text-base max-w-md">
            The modern way to create, organize, and share documentation with your team.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            {highlights.map((item, index) => (
              <div 
                key={index}
                className={`
                  p-4 rounded-xl bg-[var(--color-bg-primary)]/50 border border-[var(--color-border-secondary)]
                  hover:bg-[var(--color-bg-primary)]/70 hover:border-[var(--color-accent)]/20
                  transition-all duration-300 group
                  ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <item.icon size={18} className="text-[var(--color-accent)] mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-[var(--color-text-primary)] text-sm">{item.title}</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className={`text-[var(--color-text-muted)] text-xs relative z-10 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          Trusted by teams worldwide
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--color-bg-primary)] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-accent)_0%,transparent_70%)] opacity-5" />

        <div className={`w-full max-w-sm relative z-10 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-[var(--color-accent)] to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-[var(--color-text-primary)] font-bold text-lg">E-Docs</h2>
          </div>

          {/* Card */}
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border-primary)]">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
                Get Started
              </h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                Sign in to access your workspaces
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <OAuthButton 
                provider="google"
                onLogin={handleLogin}
                isLoading={loadingProvider === 'google'}
              />
              <OAuthButton 
                provider="github"
                onLogin={handleLogin}
                isLoading={loadingProvider === 'github'}
              />
            </div>

            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
              <span className="text-[10px] text-[var(--color-text-muted)]">Secure & Encrypted</span>
              <div className="flex-1 h-px bg-[var(--color-border-primary)]" />
            </div>

            <p className="text-[10px] text-center text-[var(--color-text-muted)]">
              By continuing, you agree to our{' '}
              <a href="#" className="text-[var(--color-accent)] hover:underline">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-[var(--color-accent)] hover:underline">Privacy Policy</a>
            </p>
          </div>

          <p className="text-center text-xs text-[var(--color-text-muted)] mt-5">
            First time? No worries, just sign in!
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
