export const BREATHING_PATTERN = {
  inhale: 4,    // 4 seconds
  hold: 7,      // 7 seconds
  exhale: 8,    // 8 seconds
};

export const calculateBreathingPhase = (
  elapsed: number
): { phase: 'inhale' | 'hold' | 'exhale'; progress: number } => {
  const cycleLength =
    BREATHING_PATTERN.inhale +
    BREATHING_PATTERN.hold +
    BREATHING_PATTERN.exhale;
  const timeInCycle = elapsed % cycleLength;

  if (timeInCycle < BREATHING_PATTERN.inhale) {
    return {
      phase: 'inhale',
      progress: timeInCycle / BREATHING_PATTERN.inhale,
    };
  }

  if (
    timeInCycle <
    BREATHING_PATTERN.inhale + BREATHING_PATTERN.hold
  ) {
    return {
      phase: 'hold',
      progress: 1,
    };
  }

  return {
    phase: 'exhale',
    progress: 1 - (timeInCycle - BREATHING_PATTERN.inhale - BREATHING_PATTERN.hold) / BREATHING_PATTERN.exhale,
  };
};
