import React from 'react';

interface LioraLogoProps {
  className?: string;
  size?: number;
}

export const LioraLogo: React.FC<LioraLogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      className={`${className} shrink-0`}
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="liora-bg-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1B4EF5" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="liora-facet-grad" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="liora-accent-grad" x1="18" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      
      {/* Base Rounded Hexagon Container */}
      <rect x="2" y="2" width="32" height="32" rx="9" fill="url(#liora-bg-grad)" />
      
      {/* Glass Inner Reflection */}
      <rect
        x="2.5"
        y="2.5"
        width="31"
        height="31"
        rx="8.5"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      
      {/* Isometric Knowledge Crystal / Deterministic Node */}
      {/* Top Facet */}
      <polygon
        points="18,8 26,13 18,17.5 10,13"
        fill="url(#liora-facet-grad)"
      />
      {/* Right Facet */}
      <polygon
        points="18,17.5 26,13 26,23 18,28"
        fill="url(#liora-accent-grad)"
        fillOpacity="0.9"
      />
      {/* Left Facet */}
      <polygon
        points="18,17.5 10,13 10,23 18,28"
        fill="#0C4A6E"
        fillOpacity="0.55"
      />
      
      {/* Central Radiance Core Spark */}
      <circle cx="18" cy="17.5" r="2.2" fill="#FFFFFF" />
      <circle cx="18" cy="17.5" r="4" stroke="white" strokeOpacity="0.45" strokeWidth="0.8" />
    </svg>
  );
};
