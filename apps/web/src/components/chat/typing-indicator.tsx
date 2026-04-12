'use client';

export function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-white/55">
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ember [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ember [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ember" />
      </div>
      <span>{names.join(', ')} typing...</span>
    </div>
  );
}
