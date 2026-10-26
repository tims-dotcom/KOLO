import React from 'react';
import { AvatarShape } from '../types/messenger';

interface AvatarProps {
  title: string;
  color: string;
  emoji?: string;
  imageUrl?: string;
  size?: number;
  online?: boolean;
  shape?: AvatarShape;
}

export const Avatar: React.FC<AvatarProps> = ({
  title,
  color,
  emoji,
  imageUrl,
  size = 44,
  online,
  shape = 'circle',
}) => {
  const initials = (title || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="kolo-avatar-wrap"
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <div
        className={`kolo-avatar kolo-avatar-${shape}`}
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          fontSize: emoji ? Math.round(size * 0.46) : Math.round(size * 0.36),
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="kolo-avatar-img" />
        ) : (
          <span>{emoji || initials}</span>
        )}
      </div>
      {online && <span className="kolo-online-dot" />}
    </div>
  );
};
