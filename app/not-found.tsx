'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-4xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          We couldn't find what you were looking for. Let's get you back to your wellness journey.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
