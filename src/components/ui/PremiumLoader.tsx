import React from 'react';

interface PremiumLoaderProps {
  text?: string;
  isFullScreen?: boolean;
}

export default function PremiumLoader({ text = 'Loading', isFullScreen = false }: PremiumLoaderProps) {
  return (
    <div
      className={`${
        isFullScreen ? 'fixed inset-0 z-[9999]' : 'absolute inset-0 z-50 rounded-md'
      } flex items-center justify-center bg-white/70 backdrop-blur-md transition-all duration-300`}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Sleek multi-ring spinner */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute h-full w-full animate-spin rounded-full border-[3px] border-transparent border-t-primary border-l-primary" style={{ animationDuration: '1.5s' }}></div>
          <div className="absolute h-14 w-14 animate-spin rounded-full border-[3px] border-transparent border-b-secondary border-r-secondary" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}></div>
          <div className="absolute h-8 w-8 animate-spin rounded-full border-[3px] border-transparent border-t-primary border-l-primary" style={{ animationDuration: '1s' }}></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_15px_rgba(166,60,113,0.5)]"></div>
        </div>

        {/* Text with glowing dot animation */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold tracking-[0.2em] text-primary uppercase drop-shadow-sm">
              {text}
            </p>
            <div className="flex gap-1 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce shadow-[0_0_8px_rgba(166,60,113,0.3)]" style={{ animationDelay: '0s' }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce shadow-[0_0_8px_rgba(166,60,113,0.3)]" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce shadow-[0_0_8px_rgba(166,60,113,0.3)]" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-[0.3em] mt-2 drop-shadow-sm">
            Please Wait
          </p>
        </div>
      </div>
    </div>
  );
}
