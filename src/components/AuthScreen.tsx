import React, { useEffect, useState } from 'react';
import {
  AtSign,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  User as UserIcon,
  UserPlus,
  XCircle,
  Zap,
} from 'lucide-react';
import { THEME_PRESETS } from '../themes/presets';
import { AuthSession, ThemeConfig } from '../types/messenger';
import { Avatar } from './Avatar';
import { LiveBackground } from './LiveBackground';

interface AuthScreenProps {
  theme: ThemeConfig;
  onThemeChange: (next: ThemeConfig) => void;
  onAuthenticated: (session: AuthSession) => void;
}

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6'];
const AVATAR_EMOJIS = ['⚡', '🌌', '🎨', '🚀', '🔥', '🦊', '💎', '🎧'];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  theme,
  onThemeChange,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState('#6366f1');
  const [avatarEmoji, setAvatarEmoji] = useState('⚡');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    reason?: string;
  }>({ checking: false });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Live username check
  useEffect(() => {
    if (mode !== 'register') return;
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) {
      setUsernameStatus({ checking: false });
      return;
    }
    if (clean.length < 3) {
      setUsernameStatus({
        checking: false,
        available: false,
        reason: 'Мінімум 3 символи (a-z, 0-9, _)',
      });
      return;
    }

    setUsernameStatus({ checking: true });
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(clean)}`
        );
        const data = await res.json();
        setUsernameStatus({
          checking: false,
          available: data.available,
          reason: data.reason,
        });
      } catch {
        setUsernameStatus({ checking: false });
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [username, mode]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type,
          base64Data,
        }),
      });
      const uploaded = await res.json();
      if (uploaded.url) setAvatarUrl(uploaded.url);
    } catch {
      setError('Не вдалося завантажити фото аватарки');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginInput, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Помилка входу');
      } else {
        onAuthenticated(data);
      }
    } catch {
      setError('Не вдалося з’єднатися з сервером KOLO');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username,
          email,
          password,
          bio,
          avatarColor,
          avatarEmoji,
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Помилка реєстрації');
      } else {
        onAuthenticated(data);
      }
    } catch {
      setError('Не вдалося з’єднатися з сервером KOLO');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUsername: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: demoUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Помилка демо-входу');
      } else {
        onAuthenticated(data);
      }
    } catch {
      setError('Не вдалося виконати швидкий вхід');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kolo-auth-screen">
      <LiveBackground theme={theme} />

      {/* Top Bar with Theme Switcher */}
      <div className="kolo-auth-topbar">
        <div className="kolo-brand">
          <div className="kolo-brand-logo">⚡</div>
          <div>
            <h1>KOLO</h1>
            <span>Next-Gen Custom Messenger</span>
          </div>
        </div>

        <div className="kolo-auth-theme-pills">
          <Sparkles size={14} className="kolo-accent-icon" />
          <span>Тема екрану:</span>
          {THEME_PRESETS.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`kolo-auth-theme-btn ${theme.id === p.id ? 'active' : ''}`}
              onClick={() => onThemeChange(p)}
            >
              <span
                className="kolo-auth-theme-dot"
                style={{
                  background: `linear-gradient(135deg, ${p.outBubbleColor1}, ${p.outBubbleColor2})`,
                }}
              />
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Center Auth Glass Card */}
      <div className="kolo-auth-card">
        <div className="kolo-auth-card-header">
          <div className="kolo-auth-hero-icon">⚡</div>
          <h2>{mode === 'login' ? 'Вітаємо у KOLO' : 'Створити акаунт KOLO'}</h2>
          <p>
            {mode === 'login'
              ? 'Увійдіть у свій простір з персональною кастомізацією та живими чатами'
              : 'Зареєструйте унікальний @username та налаштуйте власний стиль'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="kolo-segmented" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            <LogIn size={15} />
            <span>Вхід в акаунт</span>
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            <UserPlus size={15} />
            <span>Реєстрація</span>
          </button>
        </div>

        {error && <div className="kolo-auth-error">{error}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="kolo-auth-form">
            <div className="kolo-field">
              <label>Нікнейм (@username) або Email</label>
              <div className="kolo-input-icon-wrap">
                <AtSign size={16} className="kolo-field-icon" />
                <input
                  type="text"
                  required
                  placeholder="Ваш @username або email"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                />
              </div>
            </div>

            <div className="kolo-field">
              <label>Пароль</label>
              <div className="kolo-input-icon-wrap">
                <Lock size={16} className="kolo-field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Введіть пароль..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="kolo-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kolo-btn-primary kolo-auth-submit"
            >
              <LogIn size={17} />
              <span>{loading ? 'Входимо...' : 'Увійти в месенджер'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="kolo-auth-form">
            {/* Avatar Setup Row */}
            <div className="kolo-reg-avatar-box">
              <div className="kolo-reg-avatar-preview">
                <Avatar
                  title={displayName || 'KOLO'}
                  color={avatarColor}
                  emoji={avatarEmoji}
                  imageUrl={avatarUrl}
                  shape={theme.avatarShape}
                  size={64}
                />
                <label className="kolo-avatar-upload-badge" title="Завантажити фото">
                  <Camera size={13} />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>

              <div className="kolo-reg-avatar-controls">
                <span className="kolo-sub-label">Аватарка: завантажте фото або оберіть стиль</span>
                <div className="kolo-picker-strip">
                  {AVATAR_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`kolo-chip-btn ${
                        !avatarUrl && avatarEmoji === em ? 'active' : ''
                      }`}
                      onClick={() => {
                        setAvatarUrl(undefined);
                        setAvatarEmoji(em);
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div className="kolo-picker-strip">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`kolo-color-dot ${avatarColor === col ? 'active' : ''}`}
                      style={{ background: col }}
                      onClick={() => setAvatarColor(col)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="kolo-field-row">
              <div className="kolo-field">
                <label>Ваше ім’я *</label>
                <div className="kolo-input-icon-wrap">
                  <UserIcon size={16} className="kolo-field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Іван Франко"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>

              <div className="kolo-field">
                <label>Унікальний @username *</label>
                <div className="kolo-input-icon-wrap">
                  <AtSign size={16} className="kolo-field-icon" />
                  <input
                    type="text"
                    required
                    placeholder="ivan_kolo"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                      )
                    }
                  />
                </div>
                {username && (
                  <div
                    className={`kolo-username-hint ${
                      usernameStatus.available
                        ? 'ok'
                        : usernameStatus.available === false
                        ? 'err'
                        : ''
                    }`}
                  >
                    {usernameStatus.checking ? (
                      <span>Перевірка...</span>
                    ) : usernameStatus.available ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>@{username} вільний!</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} />
                        <span>{usernameStatus.reason}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="kolo-field-row">
              <div className="kolo-field">
                <label>Пароль (мін. 4 символи) *</label>
                <div className="kolo-input-icon-wrap">
                  <Lock size={16} className="kolo-field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="Надійний пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="kolo-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="kolo-field">
                <label>Email (необов’язково)</label>
                <div className="kolo-input-icon-wrap">
                  <Mail size={16} className="kolo-field-icon" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="kolo-field">
              <label>Про себе (Bio)</label>
              <input
                type="text"
                className="kolo-input-sm"
                placeholder="Чим займаєтесь або ваш улюблений стиль..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || usernameStatus.available === false}
              className="kolo-btn-primary kolo-auth-submit"
            >
              <UserPlus size={17} />
              <span>
                {loading ? 'Створюємо акаунт...' : 'Зареєструватися та увійти'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
