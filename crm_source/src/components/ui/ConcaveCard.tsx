'use client';

import React from 'react';

interface ConcaveCardProps {
  children: React.ReactNode;
  className?: string;
  bgColor?: string;
  notchWidth?: number;
  notchHeight?: number;
  actionButton?: React.ReactNode;
}

export const ConcaveCard: React.FC<ConcaveCardProps> = ({
  children,
  className = '',
  actionButton,
}) => {
  return (
    <div
      className={`relative rounded-md bg-[#1C1B1B] border border-white/10 p-6 shadow-none transition-all hover:bg-[#2A2A2A] flex flex-col justify-between ${className}`}
    >
      {actionButton && (
        <div className="absolute top-4 right-4 z-20 flex items-center justify-end gap-2">
          {actionButton}
        </div>
      )}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
