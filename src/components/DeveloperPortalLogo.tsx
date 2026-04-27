import type { IconDefinition } from '@gnome-ui/icons'

// ─── Monochrome IconDefinition ────────────────────────────────────────────────
// Use with <Icon icon={DeveloperPortalIcon} /> for small UI contexts.
// Inherits currentColor — no color support.

export const DeveloperPortalIcon: IconDefinition = {
  viewBox: '0 0 16 16',
  paths: [
    {
      // center node
      d: 'M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
      fillRule: 'nonzero',
    },
    {
      // top satellite
      d: 'M8 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
      fillRule: 'nonzero',
    },
    {
      // bottom-right satellite
      d: 'M13.5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
      fillRule: 'nonzero',
    },
    {
      // bottom-left satellite
      d: 'M2.5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
      fillRule: 'nonzero',
    },
    {
      // connecting lines: top, bottom-right, bottom-left
      d: 'M8 3v2.6M10.2 6.8l2.4 3M5.8 6.8l-2.4 3',
      fillRule: 'nonzero',
    },
  ],
}

// ─── Full color SVG logo ──────────────────────────────────────────────────────
// Use for login screen, splash, app header.

interface DeveloperPortalLogoProps {
  size?: number
}

export function DeveloperPortalLogo({ size = 64 }: DeveloperPortalLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer orbit ring */}
      <circle
        cx="32"
        cy="32"
        r="26"
        stroke="#3584e4"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.35"
      />

      {/* Connecting lines */}
      <line x1="32" y1="18" x2="32" y2="10" stroke="#3584e4" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="42" y1="38" x2="48" y2="47" stroke="#26a269" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="22" y1="38" x2="16" y2="47" stroke="#9141ac" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Center node — filled + outline ring */}
      <circle cx="32" cy="32" r="13" fill="#3584e4" />
      <circle cx="32" cy="32" r="13" stroke="white" strokeWidth="1.5" opacity="0.2" />

      {/* Code symbol inside center */}
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fontFamily="monospace"
        fill="white"
        opacity="0.95"
      >
        {'</>'}
      </text>

      {/* Top satellite — npm/packages (green, filled) */}
      <circle cx="32" cy="7" r="5.5" fill="#26a269" />
      <circle cx="32" cy="7" r="5.5" stroke="white" strokeWidth="1" opacity="0.3" />

      {/* Bottom-right satellite — git platform (purple, filled) */}
      <circle cx="51" cy="50" r="5.5" fill="#9141ac" />
      <circle cx="51" cy="50" r="5.5" stroke="white" strokeWidth="1" opacity="0.3" />

      {/* Bottom-left satellite — vulnerabilities (orange, outline) */}
      <circle cx="13" cy="50" r="5.5" fill="#e66100" />
      <circle cx="13" cy="50" r="5.5" stroke="white" strokeWidth="1" opacity="0.3" />
    </svg>
  )
}
