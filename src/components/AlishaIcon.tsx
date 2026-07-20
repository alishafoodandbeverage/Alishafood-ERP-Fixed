import React from "react";

export default function AlishaIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 35 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(1, 0) scale(1.1)">
        <path
          d="M24 38C24 38 31 34 31 24C31 14 18 4 18 4C18 4 17 12 11 16C5 20 2 26 2 32C2 38.6 7.4 44 14 44C20.6 44 24 38 24 38Z"
          fill="url(#orange-flame-grad-icon)"
        />
        <path
          d="M19.5 39C19.5 39 24 36 24 29C24 22 15 15 15 15C15 15 14.5 20 11 23C7.5 26 6 30 6 34.5C6 39 10 43 14 43C18 43 19.5 39 19.5 39Z"
          fill="url(#red-flame-grad-icon)"
        />
      </g>
      <defs>
        <linearGradient id="orange-flame-grad-icon" x1="16.5" y1="4" x2="16.5" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5821F" />
          <stop offset="1" stopColor="#D31D1D" />
        </linearGradient>
        <linearGradient id="red-flame-grad-icon" x1="15" y1="15" x2="15" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D31D1D" />
          <stop offset="1" stopColor="#9C1010" />
        </linearGradient>
      </defs>
    </svg>
  );
}
