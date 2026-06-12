import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(formData.username, formData.password);

    if (success) {
      navigate('/');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#05070a] relative overflow-hidden p-4">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[150px] animate-[pulse_10s_ease-in-out_infinite_1s]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-card p-8 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10 group">
              <ChefHat className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
              Kitchen Hub
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">
              Order Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="group space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold ml-1 group-focus-within:text-primary transition-colors">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-secondary/50 transition-all font-medium"
                    placeholder="Enter ID"
                  />
                </div>
              </div>

              <div className="group space-y-2">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-bold ml-1 group-focus-within:text-primary transition-colors">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-secondary/30 border border-border/50 rounded-xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-secondary/50 transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 mt-8 group disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-widest text-sm">Access Kitchen</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground/50 font-medium">
              v2.0.0 • Pasmen Pasara POS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
