import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. App Logo SVG (Direct vector reproduction of Image 2 - StudyMate Sarkari Web App Logo)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background & Glowing Border Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#070e1e" />
      <stop offset="50%" stop-color="#0b1730" />
      <stop offset="100%" stop-color="#040914" />
    </linearGradient>

    <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="30%" stop-color="#3b82f6" />
      <stop offset="70%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#00d2ff" />
    </linearGradient>

    <radialGradient id="innerLight" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1e3a8a" stop-opacity="0.6" />
      <stop offset="60%" stop-color="#0f172a" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0" />
    </radialGradient>

    <!-- S Gradient -->
    <linearGradient id="sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="25%" stop-color="#0284c7" />
      <stop offset="60%" stop-color="#2563eb" />
      <stop offset="85%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#c026d3" />
    </linearGradient>

    <linearGradient id="sHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.8" />
      <stop offset="40%" stop-color="#38bdf8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
    </linearGradient>

    <!-- Book Pages Glow -->
    <linearGradient id="bookGlow" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>

    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Base Squircle Container with Neon Border -->
  <rect x="12" y="12" width="488" height="488" rx="100" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="488" height="488" rx="100" fill="url(#innerLight)" />
  <rect x="14" y="14" width="484" height="484" rx="98" fill="none" stroke="url(#neonGlow)" stroke-width="6" filter="url(#glowFilter)" opacity="0.9" />

  <!-- Tricolor Accent Arc (Top Left) -->
  <path d="M 60 210 A 130 130 0 0 1 190 85" fill="none" stroke="#FF9933" stroke-width="7" stroke-linecap="round" opacity="0.95" />
  <path d="M 72 215 A 120 120 0 0 1 195 95" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.9" />
  <path d="M 84 220 A 110 110 0 0 1 200 105" fill="none" stroke="#138808" stroke-width="6" stroke-linecap="round" opacity="0.95" />

  <!-- Ashoka Lion Emblem Silhouette (Left side) -->
  <g transform="translate(100, 140) scale(0.65)" opacity="0.85">
    <path d="M15 0 L25 5 L35 0 L40 12 L35 24 L25 20 L15 24 L10 12 Z" fill="#ffffff" />
    <circle cx="25" cy="10" r="4" fill="#0b1730" />
    <path d="M5 14 L15 17 L12 28 L5 22 Z" fill="#ffffff" />
    <path d="M45 14 L35 17 L38 28 L45 22 Z" fill="#ffffff" />
    <rect x="10" y="27" width="30" height="4" rx="2" fill="#ffffff" />
    <circle cx="25" cy="34" r="5" fill="none" stroke="#ffffff" stroke-width="1.5" />
    <rect x="5" y="42" width="40" height="5" rx="2.5" fill="#ffffff" />
  </g>

  <!-- Open Illuminated Book -->
  <g transform="translate(256, 275)">
    <!-- Book light beam -->
    <path d="M -90 10 L 0 -45 L 90 10 L 70 30 L 0 5 L -70 30 Z" fill="url(#bookGlow)" opacity="0.3" filter="url(#softGlow)" />
    <!-- Left Page Base -->
    <path d="M 0 12 Q -75 -15 -145 5 Q -140 28 -70 20 Q -30 18 0 30 Z" fill="#0284c7" />
    <path d="M 0 5 Q -70 -22 -140 -2 Q -135 18 -68 12 Q -28 10 0 22 Z" fill="#38bdf8" />
    <path d="M 0 -2 Q -65 -28 -135 -9 Q -130 10 -65 5 Q -25 3 0 14 Z" fill="#e0f2fe" />
    <!-- Right Page Base -->
    <path d="M 0 12 Q 75 -15 145 5 Q 140 28 70 20 Q 30 18 0 30 Z" fill="#0284c7" />
    <path d="M 0 5 Q 70 -22 140 -2 Q 135 18 68 12 Q 28 10 0 22 Z" fill="#38bdf8" />
    <path d="M 0 -2 Q 65 -28 135 -9 Q 130 10 65 5 Q 25 3 0 14 Z" fill="#e0f2fe" />
    <!-- Center Spine Glow -->
    <ellipse cx="0" cy="15" rx="8" ry="12" fill="#fbbf24" filter="url(#glowFilter)" />
  </g>

  <!-- 3D Glossy S Logo -->
  <g transform="translate(245, 175) scale(1.05)">
    <!-- Shadow / Outer Glow -->
    <path d="M 28 -70 C -35 -70 -65 -45 -65 -5 C -65 40 -15 50 15 65 C 40 78 45 95 35 110 C 20 125 -25 125 -50 105" 
          fill="none" stroke="#1d4ed8" stroke-width="46" stroke-linecap="round" filter="url(#glowFilter)" opacity="0.6"/>
    
    <!-- Primary 3D Body -->
    <path d="M 28 -70 C -35 -70 -65 -45 -65 -5 C -65 40 -15 50 15 65 C 40 78 45 95 35 110 C 20 125 -25 125 -50 105" 
          fill="none" stroke="url(#sGrad)" stroke-width="40" stroke-linecap="round"/>

    <!-- High-Gloss White/Cyan Reflection Overlay -->
    <path d="M 25 -70 C -25 -70 -52 -50 -55 -15 C -55 20 -20 35 10 50" 
          fill="none" stroke="url(#sHighlight)" stroke-width="16" stroke-linecap="round" opacity="0.9"/>
    
    <circle cx="28" cy="-70" r="14" fill="#ffffff" opacity="0.85" filter="url(#glowFilter)" />
    <circle cx="-50" cy="105" r="12" fill="#c026d3" opacity="0.8" />
  </g>

  <!-- Scholar Graduation Cap (On top of S) -->
  <g transform="translate(250, 92) scale(0.95)">
    <!-- Cap Diamond (Tilt Angle) -->
    <polygon points="0,-26 75,-2 0,22 -75,-2" fill="#0a192f" stroke="#1e3a8a" stroke-width="3" />
    <polygon points="0,-24 70,-2 0,20 -70,-2" fill="#1e3a8a" />
    <polygon points="0,-22 65,-2 0,18 -65,-2" fill="#0f172a" />
    <!-- Cap Base Band -->
    <path d="M -32 5 Q 0 16 32 5 L 32 18 Q 0 28 -32 18 Z" fill="#0c1d3b" stroke="#38bdf8" stroke-width="1.5" />
    <!-- Button on Top -->
    <circle cx="0" cy="-2" r="5" fill="#f59e0b" />
    <!-- Golden Tassel hanging to right -->
    <path d="M 0 -2 Q 40 -6 65 18 Q 72 38 75 55" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" />
    <!-- Tassel Fringe -->
    <path d="M 75 55 L 70 78 L 84 76 Z" fill="#f59e0b" />
    <circle cx="75" cy="55" r="4" fill="#d97706" />
  </g>

  <!-- Friendly Robot Mascot Head (Right side of S) -->
  <g transform="translate(372, 218) scale(0.85)">
    <!-- Glow -->
    <circle cx="0" cy="0" r="38" fill="#38bdf8" opacity="0.25" filter="url(#glowFilter)" />
    <!-- Outer Cyan Ear Pods -->
    <circle cx="-38" cy="0" r="8" fill="#0284c7" />
    <circle cx="38" cy="0" r="8" fill="#0284c7" />
    <rect x="-3" y="-45" width="6" height="15" rx="3" fill="#38bdf8" />
    <circle cx="0" cy="-45" r="5" fill="#67e8f9" />
    <!-- Head Shell -->
    <rect x="-36" y="-32" width="72" height="64" rx="28" fill="#ffffff" stroke="#e0f2fe" stroke-width="3" />
    <!-- Dark Visor Screen -->
    <rect x="-28" y="-22" width="56" height="44" rx="18" fill="#0369a1" />
    <!-- Glowing Curved Happy Eyes ^ ^ -->
    <path d="M -18 -2 Q -12 -12 -6 -2" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
    <path d="M 6 -2 Q 12 -12 18 -2" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
    <!-- Rosy Cheeks -->
    <circle cx="-18" cy="10" r="3.5" fill="#f43f5e" opacity="0.7" />
    <circle cx="18" cy="10" r="3.5" fill="#f43f5e" opacity="0.7" />
  </g>

  <!-- Wireframe Globe (Far Right) -->
  <g transform="translate(440, 212) scale(0.55)" opacity="0.8">
    <circle cx="0" cy="0" r="28" fill="none" stroke="#38bdf8" stroke-width="3" />
    <ellipse cx="0" cy="0" rx="14" ry="28" fill="none" stroke="#38bdf8" stroke-width="2.5" />
    <line x1="-28" y1="0" x2="28" y2="0" stroke="#38bdf8" stroke-width="2.5" />
    <line x1="-24" y1="-14" x2="24" y2="-14" stroke="#38bdf8" stroke-width="2" />
    <line x1="-24" y1="14" x2="24" y2="14" stroke="#38bdf8" stroke-width="2" />
  </g>

  <!-- Title: StudyMate -->
  <g transform="translate(256, 362)">
    <text x="0" y="0" text-anchor="middle" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="52" letter-spacing="-1">
      <tspan fill="#ffffff">Study</tspan><tspan fill="#38bdf8">Mate</tspan>
    </text>
  </g>

  <!-- Title: Sarkari with flanking lines -->
  <g transform="translate(256, 404)">
    <line x1="-190" y1="-10" x2="-80" y2="-10" stroke="#38bdf8" stroke-width="2.5" opacity="0.8" />
    <text x="0" y="0" text-anchor="middle" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="42" fill="#ffffff" letter-spacing="2">
      Sarkari
    </text>
    <line x1="80" y1="-10" x2="190" y2="-10" stroke="#38bdf8" stroke-width="2.5" opacity="0.8" />
  </g>

  <!-- Pill Badge: Government Jobs & Exam Updates -->
  <g transform="translate(256, 436)">
    <rect x="-160" y="-14" width="320" height="28" rx="14" fill="#0b1e3b" stroke="#0284c7" stroke-width="2" />
    <text x="0" y="5" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="13" fill="#e0f2fe" letter-spacing="0.5">
      Government Jobs &amp; Exam Updates
    </text>
  </g>

  <!-- Subtitle: ALL IN ONE PLACE with subtle lines -->
  <g transform="translate(256, 474)">
    <line x1="-120" y1="-4" x2="-85" y2="-4" stroke="#38bdf8" stroke-width="2" opacity="0.8" />
    <text x="0" y="0" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="800" font-size="11" fill="#93c5fd" letter-spacing="4">
      ALL IN ONE PLACE
    </text>
    <line x1="85" y1="-4" x2="120" y2="-4" stroke="#38bdf8" stroke-width="2" opacity="0.8" />
  </g>
</svg>`;

// 2. Home Page Top Heading Banner SVG (Direct reproduction of Image 1)
const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" width="1200" height="600">
  <defs>
    <linearGradient id="bannerBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#f8faff" />
      <stop offset="100%" stop-color="#edf4ff" />
    </linearGradient>

    <linearGradient id="bannerSGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="25%" stop-color="#0284c7" />
      <stop offset="60%" stop-color="#2563eb" />
      <stop offset="85%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>

    <linearGradient id="mateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00236f" />
      <stop offset="60%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>

    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#00236f" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- Clean Banner Background Card -->
  <rect x="0" y="0" width="1200" height="600" fill="url(#bannerBg)" rx="24" />

  <!-- LEFT VISUAL CLUSTER (3D 'S' + Cap + Mascot + Book + Tricolor) -->
  <g transform="translate(190, 220) scale(1.15)">
    <!-- Tricolor Arc -->
    <path d="M -110 90 A 130 130 0 0 1 10 -40" fill="none" stroke="#FF9933" stroke-width="10" stroke-linecap="round" opacity="0.95" />
    <path d="M -100 100 A 120 120 0 0 1 15 -30" fill="none" stroke="#138808" stroke-width="9" stroke-linecap="round" opacity="0.95" />

    <!-- Open Book Under S -->
    <g transform="translate(0, 115)">
      <path d="M 0 12 Q -75 -15 -140 8 Q -135 32 -70 24 Q -30 20 0 32 Z" fill="#0284c7" />
      <path d="M 0 4 Q -70 -22 -135 0 Q -130 22 -68 15 Q -28 12 0 24 Z" fill="#38bdf8" />
      <path d="M 0 -3 Q -65 -28 -130 -8 Q -125 12 -65 7 Q -25 4 0 16 Z" fill="#ffffff" />
      <!-- Right Page -->
      <path d="M 0 12 Q 75 -15 140 8 Q 135 32 70 24 Q 30 20 0 32 Z" fill="#0284c7" />
      <path d="M 0 4 Q 70 -22 135 0 Q 130 22 68 15 Q 28 12 0 24 Z" fill="#38bdf8" />
      <path d="M 0 -3 Q 65 -28 130 -8 Q 125 12 65 7 Q 25 4 0 16 Z" fill="#ffffff" />
      <ellipse cx="0" cy="18" rx="10" ry="14" fill="#fbbf24" opacity="0.9" />
    </g>

    <!-- 3D Letter 'S' -->
    <g transform="translate(0, 0)">
      <path d="M 28 -70 C -35 -70 -65 -45 -65 -5 C -65 40 -15 50 15 65 C 40 78 45 95 35 110 C 20 125 -25 125 -50 105" 
            fill="none" stroke="url(#bannerSGrad)" stroke-width="44" stroke-linecap="round"/>
      <path d="M 25 -70 C -25 -70 -52 -50 -55 -15 C -55 20 -20 35 10 50" 
            fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
      <circle cx="28" cy="-70" r="14" fill="#ffffff" opacity="0.9" />
      <circle cx="-50" cy="105" r="12" fill="#ec4899" opacity="0.9" />
    </g>

    <!-- Graduation Cap -->
    <g transform="translate(5, -92)">
      <polygon points="0,-26 75,-2 0,22 -75,-2" fill="#00236f" />
      <polygon points="0,-24 70,-2 0,20 -70,-2" fill="#1e3a8a" />
      <path d="M -32 5 Q 0 16 32 5 L 32 18 Q 0 28 -32 18 Z" fill="#00236f" stroke="#38bdf8" stroke-width="1.5" />
      <circle cx="0" cy="-2" r="5" fill="#f59e0b" />
      <path d="M 0 -2 Q 40 -6 65 18 Q 72 38 75 55" fill="none" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" />
      <path d="M 75 55 L 70 78 L 84 76 Z" fill="#f59e0b" />
      <circle cx="75" cy="55" r="4" fill="#d97706" />
    </g>

    <!-- Smiling Robot Mascot Head -->
    <g transform="translate(115, 30)">
      <circle cx="-32" cy="0" r="7" fill="#0284c7" />
      <circle cx="32" cy="0" r="7" fill="#0284c7" />
      <rect x="-3" y="-38" width="6" height="12" rx="3" fill="#38bdf8" />
      <circle cx="0" cy="-38" r="4.5" fill="#67e8f9" />
      <rect x="-30" y="-26" width="60" height="52" rx="22" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
      <rect x="-24" y="-18" width="48" height="36" rx="14" fill="#00236f" />
      <path d="M -15 -2 Q -10 -10 -5 -2" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" />
      <path d="M 5 -2 Q 10 -10 15 -2" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" />
    </g>
  </g>

  <!-- RIGHT TYPOGRAPHY & BRAND CLUSTER -->
  <g transform="translate(480, 195)">
    <!-- Top Row: StudyMate -->
    <text x="0" y="0" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="88" letter-spacing="-2">
      <tspan fill="#0b1c30">Study</tspan><tspan fill="url(#mateGrad)">Mate</tspan>
    </text>

    <!-- Second Row: Sarkari + Pill Badge -->
    <g transform="translate(0, 85)">
      <text x="0" y="0" font-family="'Plus Jakarta Sans', Inter, sans-serif" font-weight="900" font-size="78" fill="#0b1c30" letter-spacing="-1">
        Sarkari
      </text>

      <!-- Pill Badge: Indian Emblem + Government Jobs & Exam Updates -->
      <g transform="translate(320, -42)">
        <rect x="0" y="0" width="270" height="54" rx="27" fill="#00236f" />
        <!-- Emblem Silhouette -->
        <g transform="translate(18, 10) scale(0.65)">
          <path d="M15 0 L25 5 L35 0 L40 12 L35 24 L25 20 L15 24 L10 12 Z" fill="#ffffff" />
          <circle cx="25" cy="10" r="4" fill="#00236f" />
          <rect x="10" y="27" width="30" height="4" rx="2" fill="#ffffff" />
          <circle cx="25" cy="34" r="5" fill="none" stroke="#ffffff" stroke-width="1.5" />
          <rect x="5" y="42" width="40" height="5" rx="2.5" fill="#ffffff" />
        </g>
        <text x="65" y="24" font-family="'Inter', sans-serif" font-weight="800" font-size="12" fill="#ffffff">
          Government Jobs &amp;
        </text>
        <text x="65" y="40" font-family="'Inter', sans-serif" font-weight="800" font-size="12" fill="#93c5fd">
          Exam Updates
        </text>
      </g>
    </g>

    <!-- Third Row: All in One Place divider -->
    <g transform="translate(0, 140)">
      <line x1="0" y1="-8" x2="110" y2="-8" stroke="#00236f" stroke-width="2.5" />
      <text x="210" y="0" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="700" font-size="24" fill="#00236f" letter-spacing="1">
        All in One Place
      </text>
      <line x1="310" y1="-8" x2="590" y2="-8" stroke="#00236f" stroke-width="2.5" />
    </g>
  </g>

  <!-- BOTTOM ROW: 5 CATEGORY PILL CHIPS (Matching exact Image 1) -->
  <g transform="translate(140, 510)">
    <!-- 1. Jobs -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="130" height="50" rx="16" fill="#dce9ff" stroke="#bfdbfe" stroke-width="1.5" />
      <rect x="12" y="10" width="30" height="30" rx="8" fill="#2563eb" />
      <path d="M21 21 h12 v11 h-12 z M24 21 v-3 h6 v3" fill="none" stroke="#ffffff" stroke-width="2" />
      <text x="54" y="32" font-family="'Inter', sans-serif" font-weight="800" font-size="15" fill="#00236f">Jobs</text>
    </g>

    <!-- 2. Admit Card -->
    <g transform="translate(155, 0)">
      <rect x="0" y="0" width="170" height="50" rx="16" fill="#dcfce7" stroke="#bbf7d0" stroke-width="1.5" />
      <rect x="12" y="10" width="30" height="30" rx="8" fill="#16a34a" />
      <rect x="19" y="18" width="16" height="14" rx="2" fill="none" stroke="#ffffff" stroke-width="1.8" />
      <circle cx="24" cy="24" r="2" fill="#ffffff" />
      <line x1="28" y1="23" x2="33" y2="23" stroke="#ffffff" stroke-width="1.5" />
      <text x="54" y="32" font-family="'Inter', sans-serif" font-weight="800" font-size="15" fill="#14532d">Admit Card</text>
    </g>

    <!-- 3. Results -->
    <g transform="translate(350, 0)">
      <rect x="0" y="0" width="150" height="50" rx="16" fill="#f3e8ff" stroke="#e9d5ff" stroke-width="1.5" />
      <rect x="12" y="10" width="30" height="30" rx="8" fill="#9333ea" />
      <path d="M21 18 h12 v7 q0 5 -6 5 q-6 0 -6 -5 z" fill="none" stroke="#ffffff" stroke-width="1.8" />
      <line x1="27" y1="30" x2="27" y2="33" stroke="#ffffff" stroke-width="2" />
      <line x1="23" y1="33" x2="31" y2="33" stroke="#ffffff" stroke-width="2" />
      <text x="54" y="32" font-family="'Inter', sans-serif" font-weight="800" font-size="15" fill="#581c87">Results</text>
    </g>

    <!-- 4. Answer Key -->
    <g transform="translate(525, 0)">
      <rect x="0" y="0" width="170" height="50" rx="16" fill="#ffedd5" stroke="#fed7aa" stroke-width="1.5" />
      <rect x="12" y="10" width="30" height="30" rx="8" fill="#ea580c" />
      <rect x="20" y="17" width="14" height="16" rx="2" fill="none" stroke="#ffffff" stroke-width="1.8" />
      <line x1="24" y1="21" x2="30" y2="21" stroke="#ffffff" stroke-width="1.5" />
      <line x1="24" y1="25" x2="30" y2="25" stroke="#ffffff" stroke-width="1.5" />
      <text x="54" y="32" font-family="'Inter', sans-serif" font-weight="800" font-size="15" fill="#7c2d12">Answer Key</text>
    </g>

    <!-- 5. Notifications -->
    <g transform="translate(720, 0)">
      <rect x="0" y="0" width="180" height="50" rx="16" fill="#ffe4e6" stroke="#fecdd3" stroke-width="1.5" />
      <rect x="12" y="10" width="30" height="30" rx="8" fill="#e11d48" />
      <path d="M27 17 a4 4 0 0 1 4 4 v4 l2 3 h-12 l2 -3 v-4 a4 4 0 0 1 4 -4" fill="none" stroke="#ffffff" stroke-width="1.8" />
      <circle cx="27" cy="31" r="1.5" fill="#ffffff" />
      <text x="54" y="32" font-family="'Inter', sans-serif" font-weight="800" font-size="15" fill="#881337">Notifications</text>
    </g>
  </g>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write SVGs
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);
  fs.writeFileSync(path.join(publicDir, 'banner.svg'), bannerSvg);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), logoSvg);
  console.log('SVGs written successfully!');

  // 2. Render PNGs using sharp
  const logoBuffer = Buffer.from(logoSvg);
  const bannerBuffer = Buffer.from(bannerSvg);

  // 512x512 standard PWA icon
  await sharp(logoBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 192x192 standard PWA icon
  await sharp(logoBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 512x512 Maskable PWA icon (with 15% safe padding as per Android PWA spec)
  await sharp(logoBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#070e1e',
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 180x180 Apple Touch Icon (iOS Safari)
  await sharp(logoBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 64x64 favicon.png
  await sharp(logoBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // High-res logo.png
  await sharp(logoBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // Banner PNG (1200x600)
  await sharp(bannerBuffer)
    .resize(1200, 600)
    .png()
    .toFile(path.join(publicDir, 'banner.png'));

  console.log('All PNG assets generated successfully!');
}

main().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
