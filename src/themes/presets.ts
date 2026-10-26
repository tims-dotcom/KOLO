import { ThemeConfig } from '../types/messenger';

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'kolo-cyber-glass',
    name: 'KOLO Cyber Glass',
    author: 'KOLO Studio',
    bgPrimary: '#080b14',
    surfaceColor: '#11172a',
    surfaceOpacity: 0.65,
    glassBlur: 22,
    borderGlowOpacity: 0.22,
    accentColor: '#6366f1',
    accentSecondary: '#ec4899',
    neonGlow: true,
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',

    outBubbleColor1: '#6366f1',
    outBubbleColor2: '#a855f7',
    outBubbleGradientAngle: 135,
    outBubbleText: '#ffffff',
    inBubbleColor1: '#1e293b',
    inBubbleColor2: '#0f172a',
    inBubbleOpacity: 0.78,
    inBubbleText: '#f1f5f9',

    bubbleRadius: 18,
    bubbleTail: 'curved',
    bubbleDensity: 'normal',
    bubbleMaxWidth: 72,
    bubbleAnimation: 'pop-elastic',
    bubbleGlow: true,
    fontFamily: 'Inter',
    fontSize: 15,

    bgMode: 'aurora',
    bgColor1: '#312e81',
    bgColor2: '#701a75',
    bgColor3: '#0f766e',
    bgSpeed: 1.2,
    bgParticleCount: 65,
    bgInteractiveMouse: true,
    bgPatternPreset: 'space',
    bgPatternOpacity: 0.12,
    bgPatternAnimated: true,
    bgMediaUrl: '',
    bgMediaType: 'image',
    bgMediaDim: 0.35,
    bgMediaBlur: 2,

    sidebarPosition: 'left',
    avatarShape: 'circle',
    compactSidebar: false,
  },
  {
    id: 'telegram-night',
    name: 'Telegram Classic Dark',
    author: 'KOLO Studio',
    bgPrimary: '#0e1621',
    surfaceColor: '#17212b',
    surfaceOpacity: 0.92,
    glassBlur: 12,
    borderGlowOpacity: 0.1,
    accentColor: '#3b82f6',
    accentSecondary: '#60a5fa',
    neonGlow: false,
    textPrimary: '#f5f5f5',
    textSecondary: '#7f91a4',

    outBubbleColor1: '#2b5278',
    outBubbleColor2: '#2b5278',
    outBubbleGradientAngle: 90,
    outBubbleText: '#ffffff',
    inBubbleColor1: '#182533',
    inBubbleColor2: '#182533',
    inBubbleOpacity: 0.95,
    inBubbleText: '#f5f5f5',

    bubbleRadius: 14,
    bubbleTail: 'curved',
    bubbleDensity: 'normal',
    bubbleMaxWidth: 70,
    bubbleAnimation: 'slide-up',
    bubbleGlow: false,
    fontFamily: 'Inter',
    fontSize: 15,

    bgMode: 'pattern',
    bgColor1: '#0e1621',
    bgColor2: '#1a2838',
    bgColor3: '#1e3a5f',
    bgSpeed: 0.8,
    bgParticleCount: 50,
    bgInteractiveMouse: false,
    bgPatternPreset: 'cats',
    bgPatternOpacity: 0.14,
    bgPatternAnimated: false,
    bgMediaUrl: '',
    bgMediaType: 'image',
    bgMediaDim: 0.3,
    bgMediaBlur: 0,

    sidebarPosition: 'left',
    avatarShape: 'circle',
    compactSidebar: false,
  },
  {
    id: 'sakura-vaporwave',
    name: 'Sakura Vaporwave',
    author: 'KOLO Studio',
    bgPrimary: '#14081c',
    surfaceColor: '#251033',
    surfaceOpacity: 0.58,
    glassBlur: 26,
    borderGlowOpacity: 0.3,
    accentColor: '#f43f5e',
    accentSecondary: '#f59e0b',
    neonGlow: true,
    textPrimary: '#fff1f2',
    textSecondary: '#f9a8d4',

    outBubbleColor1: '#ec4899',
    outBubbleColor2: '#f97316',
    outBubbleGradientAngle: 120,
    outBubbleText: '#ffffff',
    inBubbleColor1: '#3b154d',
    inBubbleColor2: '#240b36',
    inBubbleOpacity: 0.75,
    inBubbleText: '#fce7f3',

    bubbleRadius: 24,
    bubbleTail: 'none',
    bubbleDensity: 'relaxed',
    bubbleMaxWidth: 68,
    bubbleAnimation: 'pop-elastic',
    bubbleGlow: true,
    fontFamily: 'Nunito',
    fontSize: 15,

    bgMode: 'orbs',
    bgColor1: '#831843',
    bgColor2: '#581c87',
    bgColor3: '#9a3412',
    bgSpeed: 1.0,
    bgParticleCount: 40,
    bgInteractiveMouse: true,
    bgPatternPreset: 'geometry',
    bgPatternOpacity: 0.1,
    bgPatternAnimated: true,
    bgMediaUrl: '',
    bgMediaType: 'image',
    bgMediaDim: 0.3,
    bgMediaBlur: 0,

    sidebarPosition: 'left',
    avatarShape: 'squircle',
    compactSidebar: false,
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Netrunner',
    author: 'KOLO Studio',
    bgPrimary: '#040d0a',
    surfaceColor: '#071a14',
    surfaceOpacity: 0.76,
    glassBlur: 18,
    borderGlowOpacity: 0.35,
    accentColor: '#10b981',
    accentSecondary: '#06b6d4',
    neonGlow: true,
    textPrimary: '#ecfdf5',
    textSecondary: '#6ee7b7',

    outBubbleColor1: '#059669',
    outBubbleColor2: '#0d9488',
    outBubbleGradientAngle: 135,
    outBubbleText: '#ecfdf5',
    inBubbleColor1: '#0c2920',
    inBubbleColor2: '#061c15',
    inBubbleOpacity: 0.85,
    inBubbleText: '#d1fae5',

    bubbleRadius: 4,
    bubbleTail: 'sharp',
    bubbleDensity: 'compact',
    bubbleMaxWidth: 75,
    bubbleAnimation: 'glitch',
    bubbleGlow: true,
    fontFamily: 'JetBrains Mono',
    fontSize: 14,

    bgMode: 'particles',
    bgColor1: '#064e3b',
    bgColor2: '#0f766e',
    bgColor3: '#10b981',
    bgSpeed: 1.5,
    bgParticleCount: 80,
    bgInteractiveMouse: true,
    bgPatternPreset: 'circuit',
    bgPatternOpacity: 0.15,
    bgPatternAnimated: true,
    bgMediaUrl: '',
    bgMediaType: 'image',
    bgMediaDim: 0.4,
    bgMediaBlur: 0,

    sidebarPosition: 'left',
    avatarShape: 'hexagon',
    compactSidebar: false,
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost (Light Glass)',
    author: 'KOLO Studio',
    bgPrimary: '#eef4fb',
    surfaceColor: '#ffffff',
    surfaceOpacity: 0.72,
    glassBlur: 24,
    borderGlowOpacity: 0.18,
    accentColor: '#2563eb',
    accentSecondary: '#0ea5e9',
    neonGlow: false,
    textPrimary: '#0f172a',
    textSecondary: '#475569',

    outBubbleColor1: '#2563eb',
    outBubbleColor2: '#0ea5e9',
    outBubbleGradientAngle: 135,
    outBubbleText: '#ffffff',
    inBubbleColor1: '#ffffff',
    inBubbleColor2: '#f1f5f9',
    inBubbleOpacity: 0.9,
    inBubbleText: '#0f172a',

    bubbleRadius: 20,
    bubbleTail: 'curved',
    bubbleDensity: 'normal',
    bubbleMaxWidth: 70,
    bubbleAnimation: 'fade-blur',
    bubbleGlow: false,
    fontFamily: 'Montserrat',
    fontSize: 15,

    bgMode: 'aurora',
    bgColor1: '#93c5fd',
    bgColor2: '#c4b5fd',
    bgColor3: '#67e8f9',
    bgSpeed: 0.8,
    bgParticleCount: 45,
    bgInteractiveMouse: true,
    bgPatternPreset: 'geometry',
    bgPatternOpacity: 0.08,
    bgPatternAnimated: false,
    bgMediaUrl: '',
    bgMediaType: 'image',
    bgMediaDim: 0.05,
    bgMediaBlur: 0,

    sidebarPosition: 'left',
    avatarShape: 'circle',
    compactSidebar: false,
  },
  {
    id: 'cyber-matrix-rain',
    name: 'Digital Rain 2099',
    author: 'KOLO Studio',
    bgPrimary: '#050508',
    surfaceColor: '#0c0e14',
    surfaceOpacity: 0.72,
    glassBlur: 16,
    borderGlowOpacity: 0.28,
    accentColor: '#22c55e',
    accentSecondary: '#eab308',
    neonGlow: true,
    textPrimary: '#f0fdf4',
    textSecondary: '#86efac',

    outBubbleColor1: '#15803d',
    outBubbleColor2: '#166534',
    outBubbleGradientAngle: 160,
    outBubbleText: '#ffffff',
    inBubbleColor1: '#111827',
    inBubbleColor2: '#090d16',
    inBubbleOpacity: 0.88,
    inBubbleText: '#dcfce7',

    bubbleRadius: 8,
    bubbleTail: 'sharp',
    bubbleDensity: 'normal',
    bubbleMaxWidth: 74,
    bubbleAnimation: 'slide-up',
    bubbleGlow: true,
    fontFamily: 'JetBrains Mono',
    fontSize: 14,

    bgMode: 'matrix',
    bgColor1: '#22c55e',
    bgColor2: '#15803d',
    bgColor3: '#052e16',
    bgSpeed: 1.4,
    bgParticleCount: 60,
    bgInteractiveMouse: true,
    bgPatternPreset: 'circuit',
    bgPatternOpacity: 0.12,
    bgPatternAnimated: false,
    bgMediaUrl: '',
    bgMediaType: 'image',
    bgMediaDim: 0.25,
    bgMediaBlur: 0,

    sidebarPosition: 'left',
    avatarShape: 'sharp',
    compactSidebar: false,
  },
];

export function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '17, 23, 42';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '17, 23, 42';
  return `${r}, ${g}, ${b}`;
}

export function applyThemeToDocument(theme: ThemeConfig): void {
  const root = document.documentElement;
  const surfaceRgb = hexToRgb(theme.surfaceColor);
  const accentRgb = hexToRgb(theme.accentColor);
  const accentSecRgb = hexToRgb(theme.accentSecondary);
  const inBubble1Rgb = hexToRgb(theme.inBubbleColor1);
  const inBubble2Rgb = hexToRgb(theme.inBubbleColor2);

  root.style.setProperty('--kolo-bg-primary', theme.bgPrimary);
  root.style.setProperty('--kolo-surface-rgb', surfaceRgb);
  root.style.setProperty('--kolo-surface-opacity', String(theme.surfaceOpacity));
  root.style.setProperty(
    '--kolo-surface-bg',
    `rgba(${surfaceRgb}, ${theme.surfaceOpacity})`
  );
  root.style.setProperty(
    '--kolo-surface-elevated',
    `rgba(${surfaceRgb}, ${Math.min(0.98, theme.surfaceOpacity + 0.14)})`
  );
  root.style.setProperty('--kolo-glass-blur', `${theme.glassBlur}px`);
  root.style.setProperty(
    '--kolo-border-color',
    `rgba(${accentRgb}, ${theme.borderGlowOpacity})`
  );
  root.style.setProperty('--kolo-accent', theme.accentColor);
  root.style.setProperty('--kolo-accent-rgb', accentRgb);
  root.style.setProperty('--kolo-accent-sec', theme.accentSecondary);
  root.style.setProperty('--kolo-accent-sec-rgb', accentSecRgb);
  root.style.setProperty(
    '--kolo-accent-gradient',
    `linear-gradient(135deg, ${theme.accentColor}, ${theme.accentSecondary})`
  );
  root.style.setProperty(
    '--kolo-neon-shadow',
    theme.neonGlow
      ? `0 0 18px rgba(${accentRgb}, 0.42), 0 0 4px rgba(${accentSecRgb}, 0.3)`
      : '0 4px 14px rgba(0, 0, 0, 0.2)'
  );

  root.style.setProperty('--kolo-text-primary', theme.textPrimary);
  root.style.setProperty('--kolo-text-secondary', theme.textSecondary);

  // Bubbles
  root.style.setProperty(
    '--kolo-out-bubble-bg',
    `linear-gradient(${theme.outBubbleGradientAngle}deg, ${theme.outBubbleColor1}, ${theme.outBubbleColor2})`
  );
  root.style.setProperty('--kolo-out-bubble-color1', theme.outBubbleColor1);
  root.style.setProperty('--kolo-out-bubble-color2', theme.outBubbleColor2);
  root.style.setProperty('--kolo-out-bubble-text', theme.outBubbleText);
  root.style.setProperty(
    '--kolo-out-bubble-shadow',
    theme.bubbleGlow
      ? `0 6px 22px -4px rgba(${hexToRgb(theme.outBubbleColor1)}, 0.45)`
      : '0 2px 8px rgba(0, 0, 0, 0.15)'
  );

  root.style.setProperty(
    '--kolo-in-bubble-bg',
    `linear-gradient(135deg, rgba(${inBubble1Rgb}, ${theme.inBubbleOpacity}), rgba(${inBubble2Rgb}, ${theme.inBubbleOpacity}))`
  );
  root.style.setProperty('--kolo-in-bubble-color1', theme.inBubbleColor1);
  root.style.setProperty('--kolo-in-bubble-text', theme.inBubbleText);

  root.style.setProperty('--kolo-bubble-radius', `${theme.bubbleRadius}px`);
  root.style.setProperty('--kolo-bubble-max-width', `${theme.bubbleMaxWidth}%`);

  const densityMap = {
    compact: { gap: '4px', padY: '6px', padX: '11px' },
    normal: { gap: '8px', padY: '10px', padX: '14px' },
    relaxed: { gap: '14px', padY: '13px', padX: '18px' },
  };
  const d = densityMap[theme.bubbleDensity] || densityMap.normal;
  root.style.setProperty('--kolo-msg-gap', d.gap);
  root.style.setProperty('--kolo-bubble-pad-y', d.padY);
  root.style.setProperty('--kolo-bubble-pad-x', d.padX);

  root.style.setProperty(
    '--kolo-font-family',
    `'${theme.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif`
  );
  root.style.setProperty('--kolo-font-size', `${theme.fontSize}px`);
}
