'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import BreathingCircle from '@/components/breathing-circle';

export default function BreathingPage() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [duration, setDuration] = useState(5); // 5 minutes

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isActive && timeLeft === 0 && duration > 0) {
      // Start the next cycle
      const cycle = 4 + 7 + 8; // Inhale + Hold + Exhale in seconds
      setTimeLeft(duration * 60);
    } else if (timeLeft === 0 && !isActive) {
      // Do nothing
    }

    return () => clearTimeout(timer);
  }, [isActive, timeLeft, duration]);

  const handleStart = () => {
    setTimeLeft(duration * 60);
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-12 flex flex-col items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Guided Breathing</h1>
          <p className="text-muted-foreground">
            A calming 4-7-8 breathing exercise to reduce stress and anxiety.
          </p>
        </div>

        <div className="bg-card rounded-2xl p-12 shadow-sm space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <BreathingCircle isActive={isActive} />

            {isActive && (
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-primary">
                  Time Remaining: {formatTime(timeLeft)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Breathe at your own pace. Follow the circle.
                </p>
              </div>
            )}

            {!isActive && timeLeft === 0 && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Start a guided breathing session to calm your mind and body.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Duration: {duration} minutes
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full rounded-full accent-primary"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">Enable subtle guidance sounds</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            {!isActive ? (
              <Button
                onClick={handleStart}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-12 py-6 text-base font-medium"
              >
                Begin Breathing
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 rounded-xl px-12 py-6 text-base font-medium"
              >
                Stop Session
              </Button>
            )}
          </div>
        </div>

        <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-3">About 4-7-8 Breathing</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Inhale</span> for 4 counts
            </p>
            <p>
              <span className="font-medium text-foreground">Hold</span> for 7 counts
            </p>
            <p>
              <span className="font-medium text-foreground">Exhale</span> for 8 counts
            </p>
            <p className="pt-2">Repeat this cycle to calm your nervous system.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
