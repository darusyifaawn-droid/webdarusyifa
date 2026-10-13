import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const KemenagLogo: React.FC<LogoProps> = ({ className = '', size = 180 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Kementerian Agama Republik Indonesia"
    >
      {/* Pentagon Outer Base */}
      <polygon
        points="150,15 285,112 233,268 67,268 15,112"
        fill="#047857"
        stroke="#F59E0B"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Pentagon Inner Border */}
      <polygon
        points="150,28 270,115 224,256 76,256 30,115"
        fill="#059669"
        stroke="#D97706"
        strokeWidth="2"
      />

      {/* Radiant Rays */}
      <circle cx="150" cy="140" r="85" fill="#10B981" opacity="0.4" />

      {/* Central Shield / Perisai */}
      <path
        d="M150,60 C210,60 215,90 215,150 C215,200 150,225 150,225 C150,225 85,200 85,150 C85,90 90,60 150,60 Z"
        fill="#15803D"
        stroke="#FBBF24"
        strokeWidth="4"
      />

      {/* Golden Star at Apex */}
      <polygon
        points="150,68 154,80 166,80 156,88 160,100 150,92 140,100 144,88 134,80 146,80"
        fill="#FDE047"
        stroke="#B45309"
        strokeWidth="1"
      />

      {/* Padi & Kapas (Wreath on Left and Right) */}
      <path
        d="M100,195 C88,160 90,115 130,85"
        stroke="#FCD34D"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M200,195 C212,160 210,115 170,85"
        stroke="#FCD34D"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Grains / Cotton Nodes */}
      <circle cx="102" cy="175" r="4" fill="#FEF08A" />
      <circle cx="95" cy="155" r="4" fill="#FEF08A" />
      <circle cx="95" cy="135" r="4" fill="#FEF08A" />
      <circle cx="102" cy="115" r="4" fill="#FEF08A" />
      <circle cx="115" cy="98" r="4" fill="#FEF08A" />

      <circle cx="198" cy="175" r="4" fill="#FEF08A" />
      <circle cx="205" cy="155" r="4" fill="#FEF08A" />
      <circle cx="205" cy="135" r="4" fill="#FEF08A" />
      <circle cx="198" cy="115" r="4" fill="#FEF08A" />
      <circle cx="185" cy="98" r="4" fill="#FEF08A" />

      {/* Scales of Justice (Timbangan) */}
      <line x1="120" y1="122" x2="180" y2="122" stroke="#FDE047" strokeWidth="4" />
      <line x1="150" y1="105" x2="150" y2="148" stroke="#FDE047" strokeWidth="3" />
      {/* Left Pan */}
      <line x1="125" y1="122" x2="118" y2="138" stroke="#FDE047" strokeWidth="2" />
      <line x1="125" y1="122" x2="132" y2="138" stroke="#FDE047" strokeWidth="2" />
      <path d="M115,138 Q125,145 135,138 Z" fill="#FDE047" />
      {/* Right Pan */}
      <line x1="175" y1="122" x2="168" y2="138" stroke="#FDE047" strokeWidth="2" />
      <line x1="175" y1="122" x2="182" y2="138" stroke="#FDE047" strokeWidth="2" />
      <path d="M165,138 Q175,145 185,138 Z" fill="#FDE047" />

      {/* Open Holy Book (Kitab Suci / Al-Qur'an) */}
      <g transform="translate(112, 145)">
        <path
          d="M38,18 C28,12 12,12 0,16 L0,42 C12,38 28,38 38,44 C48,38 64,38 76,42 L76,16 C64,12 48,12 38,18 Z"
          fill="#FEF3C7"
          stroke="#92400E"
          strokeWidth="2.5"
        />
        {/* Book Spine & Lines */}
        <line x1="38" y1="18" x2="38" y2="44" stroke="#78350F" strokeWidth="2" />
        <line x1="10" y1="24" x2="30" y2="24" stroke="#D97706" strokeWidth="1.5" />
        <line x1="10" y1="30" x2="30" y2="30" stroke="#D97706" strokeWidth="1.5" />
        <line x1="46" y1="24" x2="66" y2="24" stroke="#D97706" strokeWidth="1.5" />
        <line x1="46" y1="30" x2="66" y2="30" stroke="#D97706" strokeWidth="1.5" />
      </g>

      {/* Ribbon Banner at Bottom with "IKHLAS BERAMAL" */}
      <g transform="translate(0, 5)">
        <path
          d="M65,225 L95,215 L205,215 L235,225 L215,248 L150,242 L85,248 Z"
          fill="#FFFFFF"
          stroke="#1E293B"
          strokeWidth="3"
        />
        <path d="M65,225 L50,238 L72,246 L65,225 Z" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2" />
        <path d="M235,225 L250,238 L228,246 L235,225 Z" fill="#E2E8F0" stroke="#1E293B" strokeWidth="2" />
        <text
          x="150"
          y="235"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fontFamily="sans-serif"
          letterSpacing="1.5"
          fill="#0F172A"
        >
          IKHLAS BERAMAL
        </text>
      </g>
    </svg>
  );
};
