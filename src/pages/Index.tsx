
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Globe, 
  MessageSquare, 
  Bot, 
  Users,
  Lightbulb,
  Lock,
  Rocket,
  ArrowRight
} from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-primary/5 to-background dark:from-slate-950 dark:via-primary/10 dark:to-background/80">
      {/* Header */}
      <header className="py-6 px-6 shadow-sm border-b border-border/30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Sparkles className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">LicenseAI</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="sm" className="flex items-center gap-1 border-primary/30 text-primary hover:bg-primary/5">
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-primary/10 animate-pulse">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Welcome to <span className="font-extrabold">LicenseAI</span>
          </h1>
          <p className="text-xl text-foreground/80 mb-8 leading-relaxed max-w-2xl mx-auto">
            Enterprise-grade licensing system with AI-powered conversations,
            team management, and customizable branding.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="flex items-center gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <LogIn className="h-5 w-5" />
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                size="lg" 
                variant="outline" 
                className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
              >
                <UserPlus className="h-5 w-5" />
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/30">
        <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent flex items-center justify-center">
          <Lightbulb className="h-6 w-6 mr-2 text-primary" />
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="border border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500 
            bg-gradient-to-br from-white/80 via-white/70 to-primary/5 backdrop-blur-sm 
            dark:from-gray-900/80 dark:via-gray-900/70 dark:to-primary/10
            hover:-translate-y-1 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
            <CardContent className="pt-8 pb-8">
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-500">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">AI Conversations</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                Engage with our powerful AI assistant to get answers, generate content, and solve problems quickly.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border border-amber-500/10 shadow-xl hover:shadow-2xl transition-all duration-500 
            bg-gradient-to-br from-white/80 via-white/70 to-amber-500/5 backdrop-blur-sm 
            dark:from-gray-900/80 dark:via-gray-900/70 dark:to-amber-500/10
            hover:-translate-y-1 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-500"></div>
            <CardContent className="pt-8 pb-8">
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-all duration-500">
                  <Lock className="h-10 w-10 text-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Secure Licensing</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                Enterprise-grade licensing system to manage user access and protect your content with advanced security.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border border-teal-500/10 shadow-xl hover:shadow-2xl transition-all duration-500 
            bg-gradient-to-br from-white/80 via-white/70 to-teal-500/5 backdrop-blur-sm 
            dark:from-gray-900/80 dark:via-gray-900/70 dark:to-teal-500/10
            hover:-translate-y-1 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-teal-500"></div>
            <CardContent className="pt-8 pb-8">
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-full bg-teal-500/10 group-hover:bg-teal-500/20 transition-all duration-500">
                  <Users className="h-10 w-10 text-teal-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Team Collaboration</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                Invite team members, share resources, and maintain consistent branding across your entire organization.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits Section - New Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
          Why Choose LicenseAI?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left column - image or illustration */}
          <div className="rounded-xl overflow-hidden shadow-2xl border border-primary/10">
            <img 
              src="/lovable-uploads/bc5ad575-6834-4d61-93cd-0a3b288aee9a.png" 
              alt="Dashboard preview" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Right column - benefits */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="flex gap-4 items-start animate-fade-in" style={{animationDelay: "0.1s"}}>
              <div className="bg-blue-500/10 p-3 rounded-full">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
                <p className="text-muted-foreground">Bank-level encryption and secure license management for all your sensitive data.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start animate-fade-in" style={{animationDelay: "0.2s"}}>
              <div className="bg-purple-500/10 p-3 rounded-full">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Powerful Automation</h3>
                <p className="text-muted-foreground">Streamline workflows and eliminate repetitive tasks with intelligent automation.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start animate-fade-in" style={{animationDelay: "0.3s"}}>
              <div className="bg-amber-500/10 p-3 rounded-full">
                <Globe className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Global Accessibility</h3>
                <p className="text-muted-foreground">Access your license dashboard from anywhere in the world, on any device.</p>
              </div>
            </div>
            
            <Link to="/register" className="w-fit animate-fade-in" style={{animationDelay: "0.4s"}}>
              <Button className="mt-4 group" size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 md:py-24 bg-slate-50/50 dark:bg-slate-900/30">
        <Card className="border border-primary/10 shadow-2xl 
          bg-gradient-to-br from-primary/15 via-primary/10 to-transparent backdrop-blur-sm animate-scale-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500"></div>
          <CardContent className="p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="p-3 rounded-full bg-primary/10 animate-pulse">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Join thousands of businesses that trust our platform for their daily operations.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="flex items-center gap-2 bg-primary hover:bg-primary shadow-lg shadow-primary/10">
                    <Zap className="h-5 w-5" />
                    Create Your Account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5">
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 shadow-md border-t border-border/40">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              <span className="font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">LicenseAI</span>
            </div>
            <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} LicenseAI. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Terms</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Privacy</Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Contact</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
