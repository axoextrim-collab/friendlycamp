import React from 'react';

interface FriendlyCampLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'color';
}

export const FriendlyCampLogo: React.FC<FriendlyCampLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  variant = 'light'
}) => {
  // Dimensional dimensions based on size
  const logoSizes = {
    sm: { icon: 'w-7 h-7', text: 'text-base', subText: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', subText: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', subText: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', subText: 'text-sm' }
  };

  const currentSize = logoSizes[size];

  // Text color based on variant
  const textColor = variant === 'dark' ? 'text-[#044e42]' : 'text-white';
  const accentColor = 'text-[#f59e0b]';

  return (
    <div className={`flex items-center gap-2.5 cursor-pointer group ${className}`}>
      
      {/* SVG Icon matching Friendly Camp emblem */}
      <div className={`relative ${currentSize.icon} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <svg
          viewBox="0 0 100 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Outer Shield Outline */}
          <path
            d="M50 105 L10 25 L50 10 L90 25 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinejoin="round"
          />

          {/* Left Half (White Fold) */}
          <path
            d="M50 96 L18 28 L50 16 Z"
            fill="#FFFFFF"
          />

          {/* Right Half (Golden Amber / Orange Fold) */}
          <path
            d="M50 96 L50 16 L82 28 Z"
            fill="#F59E0B"
          />

          {/* Subtle Inner Highlight */}
          <path
            d="M50 96 L50 16"
            stroke="#D97706"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col text-right leading-tight select-none">
          <span className={`font-black tracking-wider uppercase font-sans ${textColor} ${currentSize.text} transition-colors`}>
            FRIENDLY <span className={accentColor}>CAMP</span>
          </span>
          <div className="flex items-center justify-between text-slate-300 gap-1">
            <span className={`font-bold tracking-widest text-[#f59e0b] ${currentSize.subText}`}>
              فرندلی کمپ
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
