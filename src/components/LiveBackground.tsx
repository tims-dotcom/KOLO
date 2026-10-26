import React, { useEffect, useRef } from 'react';
import { PatternPreset, ThemeConfig } from '../types/messenger';

interface LiveBackgroundProps {
  theme: ThemeConfig;
}

function getPatternSvgDataUri(preset: PatternPreset, colorHex: string): string {
  const stroke = encodeURIComponent(colorHex || '#ffffff');
  if (preset === 'cats') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 36 l4 -10 l6 6 h12 l6 -6 l4 10 a16 14 0 1 1 -32 0 z"/>
      <circle cx="33" cy="38" r="1.5" fill="${stroke}"/>
      <circle cx="43" cy="38" r="1.5" fill="${stroke}"/>
      <path d="M36 42 q2 2 4 0"/>
      <path d="M82 24 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z"/>
      <path d="M28 84 q12 -12 24 0 q-12 12 -24 0 z"/>
      <circle cx="40" cy="84" r="3"/>
      <path d="M78 78 a12 12 0 1 0 18 14 a9 9 0 1 1 -18 -14 z"/>
      <circle cx="20" cy="105" r="2"/>
      <circle cx="102" cy="56" r="2.5"/>
    </svg>`;
    return `url("data:image/svg+xml,${ svg.replace(/\s+/g, ' ') }")`;
  }
  if (preset === 'geometry') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="${stroke}" stroke-width="1.4">
      <polygon points="50,8 90,30 90,70 50,92 10,70 10,30"/>
      <circle cx="50" cy="50" r="22"/>
      <line x1="50" y1="8" x2="50" y2="92"/>
      <line x1="10" y1="30" x2="90" y2="70"/>
      <line x1="90" y1="30" x2="10" y2="70"/>
    </svg>`;
    return `url("data:image/svg+xml,${ svg.replace(/\s+/g, ' ') }")`;
  }
  if (preset === 'circuit') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round">
      <path d="M10 20 h25 l15 15 v25"/>
      <circle cx="10" cy="20" r="3"/>
      <circle cx="50" cy="60" r="3.5"/>
      <path d="M95 15 v30 l-20 20 h-25"/>
      <circle cx="95" cy="15" r="3"/>
      <path d="M20 90 h35 l15 -15 h25"/>
      <circle cx="20" cy="90" r="3"/>
      <rect x="64" y="82" width="14" height="14" rx="2"/>
    </svg>`;
    return `url("data:image/svg+xml,${ svg.replace(/\s+/g, ' ') }")`;
  }
  // Default: space
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="38" cy="40" rx="22" ry="7" transform="rotate(-22 38 40)"/>
    <circle cx="38" cy="40" r="11"/>
    <path d="M90 25 c8 0 14 6 14 14 l-14 22 l-14 -22 c0 -8 6 -14 14 -14 z"/>
    <circle cx="90" cy="38" r="4"/>
    <path d="M28 96 l4 -8 l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 z"/>
    <circle cx="88" cy="95" r="10"/>
    <path d="M82 91 q6 5 12 0"/>
    <circle cx="65" cy="18" r="1.8" fill="${stroke}"/>
    <circle cx="18" cy="70" r="1.5" fill="${stroke}"/>
    <circle cx="112" cy="72" r="2" fill="${stroke}"/>
  </svg>`;
  return `url("data:image/svg+xml,${ svg.replace(/\s+/g, ' ') }")`;
}

export const LiveBackground: React.FC<LiveBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (theme.bgMode === 'pattern' || theme.bgMode === 'media' || theme.bgMode === 'solid') {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const speed = theme.bgSpeed || 1;
    const count = Math.max(15, Math.min(130, theme.bgParticleCount || 60));
    const colors = [theme.bgColor1, theme.bgColor2, theme.bgColor3, theme.accentColor];

    // Particle data
    const particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.1 * speed,
      vy: (Math.random() - 0.5) * 1.1 * speed,
      r: Math.random() * 2.4 + 1.2,
      color: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
    }));

    // Floating Orbs data
    const orbs = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6 * speed,
      vy: (Math.random() - 0.5) * 0.6 * speed,
      radius: Math.random() * 160 + 130,
      color: colors[i % 3],
    }));

    // Matrix columns
    const fontSize = 15;
    const columns = Math.ceil(width / fontSize);
    const drops = Array.from({ length: columns }, () => Math.random() * -50);
    const chars = 'KOLO01アイウエオカキクケコサシスセソタチツテト⚡✨';

    let t = 0;

    const render = () => {
      t += 0.012 * speed;

      if (theme.bgMode === 'aurora') {
        ctx.fillStyle = theme.bgPrimary;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const blobs = [
          {
            x: width * (0.28 + 0.22 * Math.sin(t * 0.7)),
            y: height * (0.32 + 0.2 * Math.cos(t * 0.5)),
            r: Math.max(width, height) * 0.48,
            color: theme.bgColor1,
          },
          {
            x: width * (0.72 + 0.2 * Math.cos(t * 0.6)),
            y: height * (0.62 + 0.22 * Math.sin(t * 0.8)),
            r: Math.max(width, height) * 0.52,
            color: theme.bgColor2,
          },
          {
            x: width * (0.5 + 0.25 * Math.sin(t * 0.4 + 2)),
            y: height * (0.48 + 0.25 * Math.cos(t * 0.65 + 1)),
            r: Math.max(width, height) * 0.44,
            color: theme.bgColor3,
          },
        ];

        if (theme.bgInteractiveMouse && mouseRef.current.active) {
          blobs.push({
            x: mouseRef.current.x,
            y: mouseRef.current.y,
            r: Math.max(width, height) * 0.28,
            color: theme.accentColor,
          });
        }

        for (const b of blobs) {
          const grad = ctx.createRadialGradient(b.x, b.y, 10, b.x, b.y, b.r);
          grad.addColorStop(0, b.color + 'aa');
          grad.addColorStop(0.5, b.color + '44');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtle flowing ribbon wave lines
        ctx.strokeStyle = theme.accentColor + '28';
        ctx.lineWidth = 1.5;
        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          for (let x = 0; x <= width; x += 24) {
            const y =
              height * (0.35 + w * 0.15) +
              Math.sin(x * 0.004 + t + w) * 45 +
              Math.cos(x * 0.008 - t * 0.7) * 25;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (theme.bgMode === 'particles') {
        ctx.fillStyle = theme.bgPrimary;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          if (theme.bgInteractiveMouse && mouseRef.current.active) {
            const dx = mouseRef.current.x - p.x;
            const dy = mouseRef.current.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 150 && dist > 1) {
              p.x -= (dx / dist) * 1.2;
              p.y -= (dy / dist) * 1.2;
            }
          }

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const d = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (d < 125) {
              const alpha = Math.floor((1 - d / 125) * 85)
                .toString(16)
                .padStart(2, '0');
              ctx.strokeStyle = `${theme.accentColor}${alpha}`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      } else if (theme.bgMode === 'orbs') {
        ctx.fillStyle = theme.bgPrimary;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const orb of orbs) {
          orb.x += orb.vx;
          orb.y += orb.vy;
          if (orb.x < -orb.radius) orb.x = width + orb.radius;
          if (orb.x > width + orb.radius) orb.x = -orb.radius;
          if (orb.y < -orb.radius) orb.y = height + orb.radius;
          if (orb.y > height + orb.radius) orb.y = -orb.radius;

          const grad = ctx.createRadialGradient(
            orb.x,
            orb.y,
            orb.radius * 0.05,
            orb.x,
            orb.y,
            orb.radius
          );
          grad.addColorStop(0, orb.color + '88');
          grad.addColorStop(0.55, orb.color + '33');
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (theme.bgMode === 'matrix') {
        ctx.fillStyle = 'rgba(5, 8, 12, 0.14)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          ctx.fillStyle = i % 5 === 0 ? theme.accentSecondary : theme.bgColor1;
          ctx.fillText(char, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i] += 0.55 * speed;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    theme.bgMode,
    theme.bgPrimary,
    theme.bgColor1,
    theme.bgColor2,
    theme.bgColor3,
    theme.accentColor,
    theme.accentSecondary,
    theme.bgSpeed,
    theme.bgParticleCount,
    theme.bgInteractiveMouse,
  ]);

  if (theme.bgMode === 'media' && theme.bgMediaUrl) {
    return (
      <div className="kolo-live-bg">
        {theme.bgMediaType === 'video' ? (
          <video
            src={theme.bgMediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="kolo-bg-media"
            style={{ filter: `blur(${theme.bgMediaBlur}px)` }}
          />
        ) : (
          <img
            src={theme.bgMediaUrl}
            alt="Chat wallpaper"
            className="kolo-bg-media"
            style={{ filter: `blur(${theme.bgMediaBlur}px)` }}
          />
        )}
        <div
          className="kolo-bg-dim"
          style={{ background: `rgba(0, 0, 0, ${theme.bgMediaDim})` }}
        />
      </div>
    );
  }

  if (theme.bgMode === 'pattern') {
    const patternUri = getPatternSvgDataUri(theme.bgPatternPreset, theme.textPrimary);
    return (
      <div
        className="kolo-live-bg"
        style={{
          background: `linear-gradient(135deg, ${theme.bgColor1}, ${theme.bgColor2}, ${theme.bgColor3})`,
        }}
      >
        <div
          className={`kolo-pattern-layer ${
            theme.bgPatternAnimated ? 'kolo-pattern-animated' : ''
          }`}
          style={{
            backgroundImage: patternUri,
            opacity: theme.bgPatternOpacity,
          }}
        />
      </div>
    );
  }

  if (theme.bgMode === 'solid') {
    return (
      <div
        className="kolo-live-bg"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${theme.bgColor1}55, transparent 60%), radial-gradient(circle at 80% 80%, ${theme.bgColor2}55, transparent 60%), ${theme.bgPrimary}`,
        }}
      />
    );
  }

  return (
    <div className="kolo-live-bg">
      <canvas ref={canvasRef} className="kolo-bg-canvas" />
    </div>
  );
};
