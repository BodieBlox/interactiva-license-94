
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bot, Lock, Shield, User, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center pb-16 md:pb-24">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Advanced AI <span className="text-primary">Chat Platform</span>
            </h1>
            <p className="text-xl mt-6 text-muted-foreground">
              A secure, license-based AI system with powerful admin controls and natural language chat capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link to="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 transition-apple flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link to="/admin">
                <Button size="lg" variant="outline" className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>Admin Access</span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div
              className="w-full h-80 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <Bot 
                className={`h-20 w-20 text-primary transition-all duration-700 ${isHovering ? 'scale-110' : ''}`}
              />
              
              {isHovering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white transition-opacity duration-300">
                  <p className="text-xl">Ready to assist you</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="glass-panel border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">License Activation</h3>
              <p className="text-muted-foreground">
                Access the platform with a valid license key provided by an administrator.
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-panel border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">AI Conversations</h3>
              <p className="text-muted-foreground">
                Chat with advanced AI to get answers, generate content, solve problems and more.
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-panel border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Admin Controls</h3>
              <p className="text-muted-foreground">
                Administrators can generate licenses, manage users, and monitor conversations.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-24 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} AI Chat Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
