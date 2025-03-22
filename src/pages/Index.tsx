
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, LogIn, ShieldCheck, Sparkles, Zap, Globe, MessageSquare, Bot, Users } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/5 dark:from-background dark:to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to <span className="font-extrabold">AppName</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Powerful platform for your business needs with AI-powered conversations,
            team management, and more.
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
      <div className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 
            bg-gradient-to-br from-white/80 via-white/70 to-primary/5 backdrop-blur-sm 
            dark:from-gray-900/80 dark:via-gray-900/70 dark:to-primary/10
            hover:-translate-y-1 overflow-hidden group">
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
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 
            bg-gradient-to-br from-white/80 via-white/70 to-amber-500/5 backdrop-blur-sm 
            dark:from-gray-900/80 dark:via-gray-900/70 dark:to-amber-500/10
            hover:-translate-y-1 overflow-hidden group">
            <CardContent className="pt-8 pb-8">
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-all duration-500">
                  <ShieldCheck className="h-10 w-10 text-amber-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Secure Licensing</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                Enterprise-grade licensing system to manage user access and protect your content with advanced security.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 
            bg-gradient-to-br from-white/80 via-white/70 to-teal-500/5 backdrop-blur-sm 
            dark:from-gray-900/80 dark:via-gray-900/70 dark:to-teal-500/10
            hover:-translate-y-1 overflow-hidden group">
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

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <Card className="border-0 shadow-2xl 
          bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
          <CardContent className="p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Join thousands of businesses that trust our platform for their daily operations.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="flex items-center gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/10">
                    <Zap className="h-5 w-5" />
                    Create Your Account
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border mt-16 text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} AppName. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
