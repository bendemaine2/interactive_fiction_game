'use client';

export default function LoadingState({ message = 'Building your world…' }: { message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        </div>
        <p className="text-accent/70 font-serif text-xl tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
