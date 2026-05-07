'use client';

interface MoodSelectorProps {
  moods: Array<{ emoji: string; label: string; value: string }>;
  selectedMood: string;
  onMoodChange: (value: string) => void;
}

export default function MoodSelector({
  moods,
  selectedMood,
  onMoodChange,
}: MoodSelectorProps) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {moods.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onMoodChange(mood.value)}
          className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
            selectedMood === mood.value
              ? 'bg-primary text-primary-foreground shadow-lg scale-110'
              : 'bg-muted hover:bg-muted/80 text-foreground'
          }`}
        >
          <span className="text-3xl">{mood.emoji}</span>
          <span className="text-xs font-medium">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
