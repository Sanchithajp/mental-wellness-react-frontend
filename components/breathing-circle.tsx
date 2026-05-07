'use client';

interface BreathingCircleProps {
  isActive: boolean;
}

const BREATHING_PHASES = [
  { phase: 'Inhale', duration: 4000, min: 1, max: 1.3 },
  { phase: 'Hold', duration: 7000, min: 1.3, max: 1.3 },
  { phase: 'Exhale', duration: 8000, min: 1.3, max: 1 },
];

export default function BreathingCircle({ isActive }: BreathingCircleProps) {
  const getTotalCycleDuration = () => {
    return BREATHING_PHASES.reduce((sum, phase) => sum + phase.duration, 0);
  };

  const getCyclePercentage = () => {
    if (!isActive) return 0;
    // This is a simplified version; for production, use useEffect with animation frames
    return 50;
  };

  const animationStyle = isActive ? 'animate-breathe' : '';

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ${animationStyle}`}
      ></div>
      <div className="relative text-center">
        <div className="text-5xl text-primary font-light">●</div>
        <div className="mt-4 text-sm font-medium text-foreground">Follow the circle</div>
      </div>
    </div>
  );
}
