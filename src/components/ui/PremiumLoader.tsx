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
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Clean, sleek modern spinner */}
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/10"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" style={{ animationDuration: '0.8s' }}></div>
          {/* Inner pulsing dot */}
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold tracking-wider text-gray-700 uppercase">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
