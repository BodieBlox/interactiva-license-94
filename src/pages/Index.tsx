
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { KeyRound } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Welcome to the App</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Get started by logging in or generating a license key
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/login">
            <Button size="lg">Login</Button>
          </Link>
          <Link to="/key-generator">
            <Button size="lg" variant="outline" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Generate License Key
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
