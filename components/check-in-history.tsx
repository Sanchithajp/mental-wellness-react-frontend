'use client';

interface CheckInEntry {
  id: string;
  mood: string;
  notes: string;
  timestamp: Date;
}

interface CheckInHistoryProps {
  history: CheckInEntry[];
}

export default function CheckInHistory({ history }: CheckInHistoryProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-3">
      {history.length === 0 ? (
        <div className="text-center p-8 bg-card rounded-2xl">
          <p className="text-muted-foreground">No check-ins yet. Start today!</p>
        </div>
      ) : (
        history.map((entry) => (
          <div
            key={entry.id}
            className="bg-card p-4 rounded-xl border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{entry.mood}</span>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{formatDate(entry.timestamp)}</p>
                <p className="text-foreground mt-1">{entry.notes}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
