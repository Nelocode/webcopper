'use client';

import React from 'react';

export const OutcropLogoSvg: React.FC<{ className?: string }> = ({ className = 'h-12 w-auto' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 80"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="svg-silver-face-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="svg-silver-face-2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="svg-silver-face-3" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Outer Metallic Circle Arcs */}
      <path
        d="M 40,8 A 32,32 0 1,1 12,48"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
      <path
        d="M 10,34 A 32,32 0 0,1 36,9"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />

      {/* 3D Pyramid Prism Emblem */}
      <polygon points="42,12 8,42 36,36" fill="url(#svg-silver-face-1)" />
      <polygon points="42,12 36,36 34,68" fill="url(#svg-silver-face-2)" />
      <polygon points="8,42 36,36 34,68" fill="url(#svg-silver-face-3)" />

      {/* Outcrop Silver Vector Text (Pure White #ffffff) */}
      <text
        x="82"
        y="36"
        fontFamily="'Urbanist', 'Plus Jakarta Sans', sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="4"
        fill="#ffffff"
      >
        OUTCROP
      </text>
      <text
        x="82"
        y="58"
        fontFamily="'Urbanist', 'Plus Jakarta Sans', sans-serif"
        fontWeight="600"
        fontSize="19"
        letterSpacing="7"
        fill="#ffffff"
        opacity="0.95"
      >
        SILVER
      </text>
    </svg>
  );
};
