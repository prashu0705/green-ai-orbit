import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Leaf, Mail, ArrowLeft, Zap, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSubmitted(true);
      toast.success('Password reset email sent!');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-eco relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        {/* Decorative vertical bar */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/50" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3 opacity-60">
            <span className="text-sm">© 2024 EcoCompute Visuals</span>
          </div>
          
          <div className="space-y-6">
            {/* Animated Elements */}
            <div className="relative">
              <div className="flex items-center gap-2 absolute -top-16 left-24 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 animate-float">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Saving Energy...</span>
              </div>
              
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse-eco" />
                <div className="absolute inset-4 rounded-full bg-white/20 flex items-center justify-center">
                  <MapPin className="h-10 w-10" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 absolute -top-8 right-20 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-2 h-2 rounded-full bg-eco-green" />
                <span className="text-sm">Optimized</span>
              </div>
            </div>
            
            <div className="space-y-4 mt-20">
              <h1 className="text-4xl font-bold leading-tight">
                Sustainable Computing<br />Power.
              </h1>
              <p className="text-lg text-white/80 max-w-md">
                Join the platform that reduces your digital carbon footprint while maximizing performance.
              </p>
            </div>
          </div>
          
          <div />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-primary-foreground mb-4">
              <Leaf className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">EcoCompute</h2>
            <p className="text-muted-foreground mt-1">Reset your password</p>
          </div>

          {submitted ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <CheckCircle className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Check your email</h3>
                <p className="text-muted-foreground text-sm">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Button variant="outline" asChild className="w-full h-12">
                <Link to="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-muted-foreground text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              {/* Back to login link */}
              <div className="text-center">
                <Link to="/login" className="inline-flex items-center text-sm text-primary hover:underline font-medium">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
