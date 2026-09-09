import type { IconDefinition } from '@gnome-ui/icons'

// ─── Monochrome IconDefinition ────────────────────────────────────────────────
// Use with <Icon icon={DeveloperPortalIcon} /> for small UI contexts.
// Inherits currentColor — no color support. `Icon` only fills `d` paths (no
// stroke), so the spokes are hand-built as thin filled quads, not lines.

export const DeveloperPortalIcon: IconDefinition = {
  viewBox: '0 0 16 16',
  paths: [
    {
      // hub
      d: 'M10.3,8.5 a2.3,2.3 0 1,1 -4.6,0 a2.3,2.3 0 1,1 4.6,0',
      fillRule: 'nonzero',
    },
    {
      // top satellite
      d: 'M9.7,2.2 a1.7,1.7 0 1,1 -3.4,0 a1.7,1.7 0 1,1 3.4,0',
      fillRule: 'nonzero',
    },
    {
      // bottom-right satellite
      d: 'M14.7,13 a1.7,1.7 0 1,1 -3.4,0 a1.7,1.7 0 1,1 3.4,0',
      fillRule: 'nonzero',
    },
    {
      // bottom-left satellite
      d: 'M4.7,13 a1.7,1.7 0 1,1 -3.4,0 a1.7,1.7 0 1,1 3.4,0',
      fillRule: 'nonzero',
    },
    {
      // spoke: hub to top satellite
      d: 'M8.55,6.2 L7.45,6.2 L7.45,3.9 L8.55,3.9 Z',
      fillRule: 'nonzero',
    },
    {
      // spoke: hub to bottom-right satellite
      d: 'M9.34,10.45 L10.08,9.63 L12.11,11.45 L11.37,12.27 Z',
      fillRule: 'nonzero',
    },
    {
      // spoke: hub to bottom-left satellite
      d: 'M5.92,9.63 L6.66,10.45 L4.63,12.27 L3.89,11.45 Z',
      fillRule: 'nonzero',
    },
  ],
}

// ─── Full color SVG logo ──────────────────────────────────────────────────────
// Use for login screen, splash, app header. Transparent — sits directly on
// the app's own light/dark surface, so hub and spokes share the GNOME accent
// blue (works on both) while each satellite carries its own domain color.

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
      {/* Spokes: hub to each satellite */}
      <line x1="32" y1="32" x2="32" y2="14.72" stroke="#3584e4" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="44.8" y2="45.44" stroke="#3584e4" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="19.2" y2="45.44" stroke="#3584e4" strokeWidth="4.5" strokeLinecap="round" />

      {/* Hub */}
      <circle cx="32" cy="32" r="9.6" fill="#3584e4" />
      <circle cx="32" cy="32" r="9.6" stroke="white" strokeWidth="1.2" opacity="0.25" />

      {/* Top satellite — npm/packages (Develop) */}
      <circle cx="32" cy="14.72" r="5.76" fill="#26a269" />
      <circle cx="32" cy="14.72" r="5.76" stroke="white" strokeWidth="1" opacity="0.3" />

      {/* Bottom-right satellite — git platform (Activity) */}
      <circle cx="44.8" cy="45.44" r="5.76" fill="#9141ac" />
      <circle cx="44.8" cy="45.44" r="5.76" stroke="white" strokeWidth="1" opacity="0.3" />

      {/* Bottom-left satellite — vulnerabilities (Security) */}
      <circle cx="19.2" cy="45.44" r="5.76" fill="#e66100" />
      <circle cx="19.2" cy="45.44" r="5.76" stroke="white" strokeWidth="1" opacity="0.3" />
    </svg>
  )
}
