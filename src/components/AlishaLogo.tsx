interface AlishaLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AlishaLogo({ className = "", size = "md" }: AlishaLogoProps) {
  // Set dimensions based on size prop
  let height = 48;
  if (size === "sm") height = 36;
  if (size === "lg") height = 64;

  return (
    <div id="alisha-brand-logo" className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Dynamic inline SVG based Alisha logo for extreme clarity and precision */}
      <svg
        viewBox="0 0 350 140"
        height={height}
        className="w-auto drop-shadow-sm transition-transform duration-200 hover:scale-102"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Red & Orange flame above 'o' in Food */}
        <g transform="translate(262, 18) scale(1.1)">
          {/* Outer Orange Flame */}
          <path
            d="M24 38C24 38 31 34 31 24C31 14 18 4 18 4C18 4 17 12 11 16C5 20 2 26 2 32C2 38.6 7.4 44 14 44C20.6 44 24 38 24 38Z"
            fill="url(#orange-flame-grad)"
          />
          {/* Inner Red Flame */}
          <path
            d="M19.5 39C19.5 39 24 36 24 29C24 22 15 15 15 15C15 15 14.5 20 11 23C7.5 26 6 30 6 34.5C6 39 10 43 14 43C18 43 19.5 39 19.5 39Z"
            fill="url(#red-flame-grad)"
          />
        </g>

        {/* Brand Text: Alisha (Red) */}
        <text
          x="12"
          y="85"
          fill="#D31D1D"
          fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="800"
          fontSize="56"
          letterSpacing="-1.5px"
        >
          Alisha
        </text>

        {/* Brand Text: Food (Orange) */}
        <text
          x="192"
          y="85"
          fill="#F5821F"
          fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="800"
          fontSize="56"
          letterSpacing="-1.5px"
        >
          Food
        </text>

        {/* Brand Subtext: & Beverage (Deep gray with spacing) */}
        <text
          x="175"
          y="125"
          fill="#4B5563"
          fontFamily="'Inter', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="500"
          fontSize="23"
          letterSpacing="11px"
          textAnchor="middle"
        >
          & Beverage
        </text>

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="orange-flame-grad" x1="2" y1="24" x2="31" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5821F" />
            <stop offset="100%" stopColor="#FF9F43" />
          </linearGradient>
          <linearGradient id="red-flame-grad" x1="6" y1="29" x2="24" y2="29" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D31D1D" />
            <stop offset="100%" stopColor="#FF4757" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
