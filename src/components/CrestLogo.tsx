import React from 'react';

interface CrestLogoProps {
  className?: string;
  size?: number;
}

/**
 * Official Methodist Church Ghana Shield Crest with Faith • Hope • Love Ribbon
 */
export const CrestLogo: React.FC<CrestLogoProps> = ({ className = 'w-12 h-14', size }) => {
  const style = size ? { width: size, height: size * 1.16 } : undefined;

  return (
    <div className={`relative inline-block select-none ${className}`} style={style}>
      <svg
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Shield background */}
        <path
          d="M 60 12 
             C 90 12, 106 18, 106 42 
             C 106 78, 86 102, 60 114 
             C 34 102, 14 78, 14 42 
             C 14 18, 30 12, 60 12 Z"
          fill="#123B70"
          stroke="#0B2345"
          strokeWidth="3"
        />

        {/* Shield inner border */}
        <path
          d="M 60 16 
             C 86 16, 101 22, 101 43 
             C 101 75, 83 97, 60 108 
             C 37 97, 19 75, 19 43 
             C 19 22, 34 16, 60 16 Z"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Radiating rays behind the cross */}
        <g stroke="#051429" strokeWidth="2.5" opacity="0.85">
          <line x1="20" y1="20" x2="100" y2="100" />
          <line x1="100" y1="20" x2="20" y2="100" />
          <line x1="60" y1="20" x2="60" y2="105" />
          <line x1="20" y1="60" x2="100" y2="60" />
        </g>

        {/* Red Latin Cross with White outline */}
        {/* Cross shadow / outer stroke */}
        <path
          d="M 52 24 H 68 V 46 H 90 V 62 H 68 V 98 H 52 V 62 H 30 V 46 H 52 Z"
          fill="#DC2626"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinejoin="miter"
        />

        {/* Bottom Banner Ribbon */}
        <g transform="translate(0, 5)">
          {/* Ribbon Ends */}
          <path d="M 12 118 L 22 108 L 22 128 Z" fill="#E2E8F0" stroke="#0B2345" strokeWidth="1" />
          <path d="M 108 118 L 98 108 L 98 128 Z" fill="#E2E8F0" stroke="#0B2345" strokeWidth="1" />
          
          {/* Main Ribbon Body */}
          <path
            d="M 18 116 
               Q 60 132 102 116 
               L 102 130 
               Q 60 144 18 130 Z"
            fill="#FFFFFF"
            stroke="#0B2345"
            strokeWidth="1.5"
          />

          {/* Banner text */}
          <path
            id="ribbon-path"
            d="M 22 126 Q 60 137 98 126"
            fill="none"
          />
          <text fontSize="7.5" fontWeight="700" fill="#0B2345" letterSpacing="0.8" textAnchor="middle">
            <textPath href="#ribbon-path" startOffset="50%">
              FAITH • HOPE • LOVE
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
};

/**
 * Traditional Methodist Church Spire / Building Silhouette
 */
export const ChurchSilhouette: React.FC<{ className?: string }> = ({ className = 'w-36 h-28' }) => {
  return (
    <div className={`select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 200 160"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-[#123B70]"
      >
        {/* Ground & Trees */}
        <path d="M 0 160 Q 30 145 60 155 Q 120 148 200 160 L 200 160 L 0 160 Z" opacity="0.9" />
        <path d="M 10 160 Q 25 130 40 160 Q 55 135 70 160 Z" opacity="0.75" />
        
        {/* Main Sanctuary Hall */}
        <path d="M 60 160 L 60 110 L 115 80 L 170 110 L 170 160 Z" />
        
        {/* Side Roof Wings */}
        <polygon points="115,80 170,110 185,115 130,85" opacity="0.85" />
        
        {/* Tall Spire / Bell Tower */}
        <rect x="118" y="70" width="24" height="50" rx="1" />
        <rect x="122" y="80" width="7" height="15" rx="3" fill="#FFFFFF" opacity="0.3" />
        <rect x="131" y="80" width="7" height="15" rx="3" fill="#FFFFFF" opacity="0.3" />
        
        {/* Steeple Pyramid */}
        <polygon points="130,18 116,70 144,70" />
        
        {/* Tower Cross on peak */}
        <rect x="128.5" y="6" width="3" height="16" fill="currentColor" />
        <rect x="124" y="10" width="12" height="3" fill="currentColor" />
        
        {/* Arched Sanctuary Windows */}
        <path d="M 78 125 A 6 6 0 0 1 90 125 L 90 148 L 78 148 Z" fill="#FFFFFF" opacity="0.3" />
        <path d="M 140 125 A 6 6 0 0 1 152 125 L 152 148 L 140 148 Z" fill="#FFFFFF" opacity="0.3" />
      </svg>
    </div>
  );
};
