
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, LogIn, ShieldCheck, Sparkles, Zap, Globe } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Welcome to <span className="text-primary">AppName</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Powerful platform for your business needs with AI-powered conversations,
            team management, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 backdrop-blur-sm dark:bg-black/10">
            <CardContent className="pt-8 pb-8">
              <div className="mb-5 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">AI Conversations</h3>
              <p className="text-muted-foreground text-center">
                Engage with our AI assistant to get answers, generate content, and solve problems quickly.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 backdrop-blur-sm dark:bg-black/10">
            <CardContent className="pt-8 pb-8">
              <div className="mb-5 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Secure Licensing</h3>
              <p className="text-muted-foreground text-center">
                Enterprise-grade licensing system to manage user access and protect your content.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 backdrop-blur-sm dark:bg-black/10">
            <CardContent className="pt-8 pb-8">
              <div className="mb-5 flex justify-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground text-center">
                Invite team members, share resources, and maintain consistent branding across your organization.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <Card className="border-0 shadow-xl bg-primary/10 dark:bg-primary/5 backdrop-blur-sm">
          <CardContent className="p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of businesses that trust our platform for their daily operations.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="flex items-center gap-2">
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
