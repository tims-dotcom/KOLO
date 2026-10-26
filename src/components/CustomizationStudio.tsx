import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Layout,
  MessageSquare,
  Palette,
  RotateCcw,
  Share2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { THEME_PRESETS } from '../themes/presets';
import {
  AvatarShape,
  BubbleAnimation,
  BubbleDensity,
  BubbleTailStyle,
  FontFamilyOption,
  LiveBgMode,
  PatternPreset,
  ThemeConfig,
} from '../types/messenger';

interface CustomizationStudioProps {
  theme: ThemeConfig;
  customPresets: ThemeConfig[];
  onChange: (next: ThemeConfig) => void;
  onSavePreset: (preset: ThemeConfig) => void;
  onShareThemeInChat: (theme: ThemeConfig) => void;
  onUploadMediaWallpaper: (file: File) => Promise<void>;
  onClose: () => void;
}

type StudioTab = 'themes' | 'bubbles' | 'background' | 'layout';

export const CustomizationStudio: React.FC<CustomizationStudioProps> = ({
  theme,
  customPresets,
  onChange,
  onSavePreset,
  onShareThemeInChat,
  onUploadMediaWallpaper,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('themes');
  const [newPresetName, setNewPresetName] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [copiedJson, setCopiedJson] = useState(false);
  const [jsonError, setJsonError] = useState('');

  const update = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    onChange({
      ...theme,
      [key]: value,
    });
  };

  const handleSavePreset = () => {
    const title = newPresetName.trim() || `Моя Тема #${customPresets.length + 1}`;
    const preset: ThemeConfig = {
      ...theme,
      id: `custom_${Date.now()}`,
      name: title,
      author: 'Ви',
    };
    onSavePreset(preset);
    setNewPresetName('');
  };

  const handleCopyJson = () => {
    const str = JSON.stringify(theme, null, 2);
    navigator.clipboard.writeText(str);
    setJsonText(str);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleImportJson = () => {
    try {
      setJsonError('');
      const parsed = JSON.parse(jsonText) as Partial<ThemeConfig>;
      if (!parsed || typeof parsed !== 'object' || !parsed.bgPrimary) {
        setJsonError('Невірний формат JSON теми KOLO');
        return;
      }
      onChange({
        ...THEME_PRESETS[0],
        ...parsed,
        id: parsed.id || `imported_${Date.now()}`,
        name: parsed.name || 'Імпортована тема',
      });
    } catch {
      setJsonError('Помилка читання JSON. Перевірте синтаксис.');
    }
  };

  return (
    <aside className="kolo-studio-panel">
      <div className="kolo-studio-header">
        <div className="kolo-studio-title">
          <Sparkles size={19} className="kolo-accent-icon" />
          <div>
            <h3>Студія Кастомізації</h3>
            <span>KOLO Live Engine • Зміни в реальному часі</span>
          </div>
        </div>
        <button
          type="button"
          className="kolo-icon-btn"
          onClick={onClose}
          title="Закрити студію"
        >
          <X size={18} />
        </button>
      </div>

      {/* Quick Action Bar */}
      <div className="kolo-studio-quickbar">
        <button
          type="button"
          className="kolo-btn-primary kolo-btn-sm"
          onClick={() => onShareThemeInChat(theme)}
          title="Надіслати інтерактивну картку цієї теми в поточний чат"
        >
          <Share2 size={14} />
          <span>Поділитися в чаті</span>
        </button>
        <button
          type="button"
          className="kolo-btn-ghost kolo-btn-sm"
          onClick={() => onChange(THEME_PRESETS[0])}
          title="Скинути до стандартної теми"
        >
          <RotateCcw size={14} />
          <span>Скинути</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="kolo-studio-tabs">
        <button
          type="button"
          className={`kolo-studio-tab ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          <Palette size={15} />
          <span>Теми & Скло</span>
        </button>
        <button
          type="button"
          className={`kolo-studio-tab ${activeTab === 'bubbles' ? 'active' : ''}`}
          onClick={() => setActiveTab('bubbles')}
        >
          <MessageSquare size={15} />
          <span>Бульбашки</span>
        </button>
        <button
          type="button"
          className={`kolo-studio-tab ${activeTab === 'background' ? 'active' : ''}`}
          onClick={() => setActiveTab('background')}
        >
          <ImageIcon size={15} />
          <span>Живий Фон</span>
        </button>
        <button
          type="button"
          className={`kolo-studio-tab ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          <Layout size={15} />
          <span>Лейаут & Код</span>
        </button>
      </div>

      <div className="kolo-studio-content">
        {activeTab === 'themes' && (
          <div className="kolo-studio-section-list">
            <div className="kolo-studio-group">
              <h4>Готові пресети тем</h4>
              <div className="kolo-preset-grid">
                {[...THEME_PRESETS, ...customPresets].map((preset) => {
                  const isActive = theme.name === preset.name && theme.accentColor === preset.accentColor;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`kolo-preset-card ${isActive ? 'active' : ''}`}
                      onClick={() => onChange(preset)}
                    >
                      <div
                        className="kolo-preset-preview"
                        style={{
                          background: `linear-gradient(135deg, ${preset.bgPrimary}, ${preset.bgColor1})`,
                        }}
                      >
                        <span
                          className="kolo-preset-bubble-in"
                          style={{ background: preset.inBubbleColor1 }}
                        />
                        <span
                          className="kolo-preset-bubble-out"
                          style={{
                            background: `linear-gradient(135deg, ${preset.outBubbleColor1}, ${preset.outBubbleColor2})`,
                          }}
                        />
                      </div>
                      <div className="kolo-preset-name">
                        <span>{preset.name}</span>
                        {isActive && <Check size={13} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="kolo-save-preset-row">
                <input
                  type="text"
                  placeholder="Назва вашої теми..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="kolo-input-sm"
                />
                <button
                  type="button"
                  className="kolo-btn-secondary kolo-btn-sm"
                  onClick={handleSavePreset}
                >
                  Зберегти
                </button>
              </div>
            </div>

            <div className="kolo-studio-group">
              <h4>Glassmorphism (Ефект скла та панелей)</h4>

              <div className="kolo-control-row">
                <label>Розмиття скла (Backdrop Blur)</label>
                <span className="kolo-val-badge">{theme.glassBlur}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={theme.glassBlur}
                onChange={(e) => update('glassBlur', Number(e.target.value))}
                className="kolo-slider"
              />

              <div className="kolo-control-row">
                <label>Непрозорість панелей</label>
                <span className="kolo-val-badge">{Math.round(theme.surfaceOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.15}
                max={0.98}
                step={0.02}
                value={theme.surfaceOpacity}
                onChange={(e) => update('surfaceOpacity', Number(e.target.value))}
                className="kolo-slider"
              />

              <div className="kolo-control-row">
                <label>Яскравість скляних рамок</label>
                <span className="kolo-val-badge">{Math.round(theme.borderGlowOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.04}
                max={0.6}
                step={0.02}
                value={theme.borderGlowOpacity}
                onChange={(e) => update('borderGlowOpacity', Number(e.target.value))}
                className="kolo-slider"
              />

              <label className="kolo-toggle-row">
                <span>Неонове світіння активних елементів</span>
                <input
                  type="checkbox"
                  checked={theme.neonGlow}
                  onChange={(e) => update('neonGlow', e.target.checked)}
                />
              </label>
            </div>

            <div className="kolo-studio-group">
              <h4>Палітра кольорів інтерфейсу</h4>
              <div className="kolo-color-grid">
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => update('accentColor', e.target.value)}
                  />
                  <span>Головний акцент</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.accentSecondary}
                    onChange={(e) => update('accentSecondary', e.target.value)}
                  />
                  <span>Другий акцент</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.surfaceColor}
                    onChange={(e) => update('surfaceColor', e.target.value)}
                  />
                  <span>Колір панелей</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.bgPrimary}
                    onChange={(e) => update('bgPrimary', e.target.value)}
                  />
                  <span>База полотна</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.textPrimary}
                    onChange={(e) => update('textPrimary', e.target.value)}
                  />
                  <span>Основний текст</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.textSecondary}
                    onChange={(e) => update('textSecondary', e.target.value)}
                  />
                  <span>Другорядний текст</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bubbles' && (
          <div className="kolo-studio-section-list">
            <div className="kolo-studio-group">
              <h4>Градієнт ваших бульбашок</h4>
              <div className="kolo-color-grid">
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.outBubbleColor1}
                    onChange={(e) => update('outBubbleColor1', e.target.value)}
                  />
                  <span>Початок градієнту</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.outBubbleColor2}
                    onChange={(e) => update('outBubbleColor2', e.target.value)}
                  />
                  <span>Кінець градієнту</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.outBubbleText}
                    onChange={(e) => update('outBubbleText', e.target.value)}
                  />
                  <span>Текст ваших</span>
                </label>
              </div>

              <div className="kolo-control-row" style={{ marginTop: 10 }}>
                <label>Кут нахилу градієнту</label>
                <span className="kolo-val-badge">{theme.outBubbleGradientAngle}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={theme.outBubbleGradientAngle}
                onChange={(e) => update('outBubbleGradientAngle', Number(e.target.value))}
                className="kolo-slider"
              />

              <label className="kolo-toggle-row">
                <span>Кольорове світіння бульбашок (Glow)</span>
                <input
                  type="checkbox"
                  checked={theme.bubbleGlow}
                  onChange={(e) => update('bubbleGlow', e.target.checked)}
                />
              </label>
            </div>

            <div className="kolo-studio-group">
              <h4>Бульбашки співрозмовників</h4>
              <div className="kolo-color-grid">
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.inBubbleColor1}
                    onChange={(e) => update('inBubbleColor1', e.target.value)}
                  />
                  <span>Колір 1</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.inBubbleColor2}
                    onChange={(e) => update('inBubbleColor2', e.target.value)}
                  />
                  <span>Колір 2</span>
                </label>
                <label className="kolo-color-item">
                  <input
                    type="color"
                    value={theme.inBubbleText}
                    onChange={(e) => update('inBubbleText', e.target.value)}
                  />
                  <span>Текст вхідних</span>
                </label>
              </div>

              <div className="kolo-control-row" style={{ marginTop: 10 }}>
                <label>Непрозорість вхідних бульбашок</label>
                <span className="kolo-val-badge">{Math.round(theme.inBubbleOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.25}
                max={1}
                step={0.05}
                value={theme.inBubbleOpacity}
                onChange={(e) => update('inBubbleOpacity', Number(e.target.value))}
                className="kolo-slider"
              />
            </div>

            <div className="kolo-studio-group">
              <h4>Геометрія та форма бульбашок</h4>
              <div className="kolo-control-row">
                <label>Заокруглення кутів</label>
                <span className="kolo-val-badge">{theme.bubbleRadius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={28}
                value={theme.bubbleRadius}
                onChange={(e) => update('bubbleRadius', Number(e.target.value))}
                className="kolo-slider"
              />

              <div className="kolo-control-row">
                <label>Максимальна ширина повідомлення</label>
                <span className="kolo-val-badge">{theme.bubbleMaxWidth}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={88}
                value={theme.bubbleMaxWidth}
                onChange={(e) => update('bubbleMaxWidth', Number(e.target.value))}
                className="kolo-slider"
              />

              <label className="kolo-sub-label">Хвостик бульбашки</label>
              <div className="kolo-segmented">
                {(
                  [
                    { id: 'curved', label: 'Плавний' },
                    { id: 'sharp', label: 'Гострий' },
                    { id: 'none', label: 'Без хвостика' },
                  ] as { id: BubbleTailStyle; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={theme.bubbleTail === item.id ? 'active' : ''}
                    onClick={() => update('bubbleTail', item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="kolo-sub-label">Відступи та щільність чату</label>
              <div className="kolo-segmented">
                {(
                  [
                    { id: 'compact', label: 'Компактно' },
                    { id: 'normal', label: 'Стандарт' },
                    { id: 'relaxed', label: 'Просторно' },
                  ] as { id: BubbleDensity; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={theme.bubbleDensity === item.id ? 'active' : ''}
                    onClick={() => update('bubbleDensity', item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="kolo-studio-group">
              <h4>Типографіка та Анімація</h4>
              <label className="kolo-sub-label">Шрифт месенджера</label>
              <select
                className="kolo-select"
                value={theme.fontFamily}
                onChange={(e) => update('fontFamily', e.target.value as FontFamilyOption)}
              >
                <option value="Inter">Inter (Сучасний UI)</option>
                <option value="JetBrains Mono">JetBrains Mono (Хакерський / Код)</option>
                <option value="Montserrat">Montserrat (Геометричний)</option>
                <option value="Nunito">Nunito (М’який та округлий)</option>
                <option value="Playfair Display">Playfair Display (Елегантна класика)</option>
              </select>

              <div className="kolo-control-row" style={{ marginTop: 10 }}>
                <label>Розмір тексту</label>
                <span className="kolo-val-badge">{theme.fontSize}px</span>
              </div>
              <input
                type="range"
                min={13}
                max={18}
                value={theme.fontSize}
                onChange={(e) => update('fontSize', Number(e.target.value))}
                className="kolo-slider"
              />

              <label className="kolo-sub-label">Анімація появи повідомлень</label>
              <select
                className="kolo-select"
                value={theme.bubbleAnimation}
                onChange={(e) => update('bubbleAnimation', e.target.value as BubbleAnimation)}
              >
                <option value="pop-elastic">Пружний стрибок (Pop Elastic)</option>
                <option value="slide-up">Плавний підйом (Slide Up)</option>
                <option value="fade-blur">Проявлення з розмиття (Fade Blur)</option>
                <option value="glitch">Кібер-імпульс (Glitch Pulse)</option>
                <option value="none">Без анімації</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="kolo-studio-section-list">
            <div className="kolo-studio-group">
              <h4>Тип живого фону чату</h4>
              <div className="kolo-bg-mode-grid">
                {(
                  [
                    { id: 'aurora', title: 'Aurora Shader', desc: 'Плавні неонові хвилі' },
                    { id: 'particles', title: 'Сузір’я частинок', desc: 'Реагують на курсор' },
                    { id: 'orbs', title: 'Сфери Боке', desc: 'М’яке світіння в русі' },
                    { id: 'matrix', title: 'Digital Rain', desc: 'Кіберпанк-матриця' },
                    { id: 'pattern', title: 'Telegram Патерн', desc: 'Векторні іконки + градієнт' },
                    { id: 'media', title: 'Відео / GIF / Фото', desc: 'Власні живі шпалери' },
                    { id: 'solid', title: 'Спокійний градієнт', desc: 'Мінімалістичний фон' },
                  ] as { id: LiveBgMode; title: string; desc: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`kolo-bg-mode-card ${theme.bgMode === m.id ? 'active' : ''}`}
                    onClick={() => update('bgMode', m.id)}
                  >
                    <strong>{m.title}</strong>
                    <span>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {theme.bgMode !== 'media' && (
              <div className="kolo-studio-group">
                <h4>Кольори генератора фону</h4>
                <div className="kolo-color-grid">
                  <label className="kolo-color-item">
                    <input
                      type="color"
                      value={theme.bgColor1}
                      onChange={(e) => update('bgColor1', e.target.value)}
                    />
                    <span>Хвиля / Сфера 1</span>
                  </label>
                  <label className="kolo-color-item">
                    <input
                      type="color"
                      value={theme.bgColor2}
                      onChange={(e) => update('bgColor2', e.target.value)}
                    />
                    <span>Хвиля / Сфера 2</span>
                  </label>
                  <label className="kolo-color-item">
                    <input
                      type="color"
                      value={theme.bgColor3}
                      onChange={(e) => update('bgColor3', e.target.value)}
                    />
                    <span>Хвиля / Сфера 3</span>
                  </label>
                </div>
              </div>
            )}

            {(theme.bgMode === 'aurora' ||
              theme.bgMode === 'particles' ||
              theme.bgMode === 'orbs' ||
              theme.bgMode === 'matrix') && (
              <div className="kolo-studio-group">
                <h4>Параметри фізики та шейдера</h4>
                <div className="kolo-control-row">
                  <label>Швидкість анімації</label>
                  <span className="kolo-val-badge">{theme.bgSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  value={theme.bgSpeed}
                  onChange={(e) => update('bgSpeed', Number(e.target.value))}
                  className="kolo-slider"
                />

                {theme.bgMode === 'particles' && (
                  <>
                    <div className="kolo-control-row">
                      <label>Кількість частинок</label>
                      <span className="kolo-val-badge">{theme.bgParticleCount}</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      value={theme.bgParticleCount}
                      onChange={(e) => update('bgParticleCount', Number(e.target.value))}
                      className="kolo-slider"
                    />
                  </>
                )}

                <label className="kolo-toggle-row">
                  <span>Інтерактивна реакція на рух миші</span>
                  <input
                    type="checkbox"
                    checked={theme.bgInteractiveMouse}
                    onChange={(e) => update('bgInteractiveMouse', e.target.checked)}
                  />
                </label>
              </div>
            )}

            {theme.bgMode === 'pattern' && (
              <div className="kolo-studio-group">
                <h4>Налаштування векторного патерну</h4>
                <label className="kolo-sub-label">Тематика візерунка</label>
                <div className="kolo-segmented">
                  {(
                    [
                      { id: 'cats', label: 'Котики' },
                      { id: 'space', label: 'Космос' },
                      { id: 'geometry', label: 'Геометрія' },
                      { id: 'circuit', label: 'Кібер-схема' },
                    ] as { id: PatternPreset; label: string }[]
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={theme.bgPatternPreset === p.id ? 'active' : ''}
                      onClick={() => update('bgPatternPreset', p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="kolo-control-row" style={{ marginTop: 10 }}>
                  <label>Прозорість патерну</label>
                  <span className="kolo-val-badge">{Math.round(theme.bgPatternOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.04}
                  max={0.4}
                  step={0.02}
                  value={theme.bgPatternOpacity}
                  onChange={(e) => update('bgPatternOpacity', Number(e.target.value))}
                  className="kolo-slider"
                />

                <label className="kolo-toggle-row">
                  <span>Плавний діагональний рух візерунка</span>
                  <input
                    type="checkbox"
                    checked={theme.bgPatternAnimated}
                    onChange={(e) => update('bgPatternAnimated', e.target.checked)}
                  />
                </label>
              </div>
            )}

            {theme.bgMode === 'media' && (
              <div className="kolo-studio-group">
                <h4>Кастомні Відео / GIF / Фото шпалери</h4>
                <label className="kolo-upload-box">
                  <Upload size={18} />
                  <span>Завантажити зображення, GIF або MP4/WebM відео</span>
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadMediaWallpaper(file);
                    }}
                  />
                </label>

                <label className="kolo-sub-label">Або вставте прямий URL (Зображення / GIF / MP4)</label>
                <input
                  type="text"
                  className="kolo-input-sm"
                  placeholder="https://..."
                  value={theme.bgMediaUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
                    onChange({
                      ...theme,
                      bgMediaUrl: url,
                      bgMediaType: isVideo ? 'video' : 'image',
                    });
                  }}
                />

                <div className="kolo-control-row" style={{ marginTop: 10 }}>
                  <label>Затемнення шпалер</label>
                  <span className="kolo-val-badge">{Math.round(theme.bgMediaDim * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.05}
                  value={theme.bgMediaDim}
                  onChange={(e) => update('bgMediaDim', Number(e.target.value))}
                  className="kolo-slider"
                />

                <div className="kolo-control-row">
                  <label>Розмиття шпалер (Blur)</label>
                  <span className="kolo-val-badge">{theme.bgMediaBlur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={theme.bgMediaBlur}
                  onChange={(e) => update('bgMediaBlur', Number(e.target.value))}
                  className="kolo-slider"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="kolo-studio-section-list">
            <div className="kolo-studio-group">
              <h4>Ергономіка та Лейаут</h4>

              <label className="kolo-sub-label">Позиція списку чатів</label>
              <div className="kolo-segmented">
                <button
                  type="button"
                  className={theme.sidebarPosition === 'left' ? 'active' : ''}
                  onClick={() => update('sidebarPosition', 'left')}
                >
                  Зліва (Класика)
                </button>
                <button
                  type="button"
                  className={theme.sidebarPosition === 'right' ? 'active' : ''}
                  onClick={() => update('sidebarPosition', 'right')}
                >
                  Справа
                </button>
              </div>

              <label className="kolo-sub-label">Форма аватарок</label>
              <div className="kolo-segmented">
                {(
                  [
                    { id: 'circle', label: 'Коло' },
                    { id: 'squircle', label: 'Squircle' },
                    { id: 'hexagon', label: 'Гексагон' },
                    { id: 'sharp', label: 'Квадрат' },
                  ] as { id: AvatarShape; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={theme.avatarShape === s.id ? 'active' : ''}
                    onClick={() => update('avatarShape', s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <label className="kolo-toggle-row" style={{ marginTop: 10 }}>
                <span>Компактний список чатів</span>
                <input
                  type="checkbox"
                  checked={theme.compactSidebar}
                  onChange={(e) => update('compactSidebar', e.target.checked)}
                />
              </label>
            </div>

            <div className="kolo-studio-group">
              <h4>Експорт та Імпорт JSON теми</h4>
              <p className="kolo-studio-hint">
                Скопіюйте конфігурацію теми, щоб передати її друзям, або вставте чужий JSON-код.
              </p>
              <div className="kolo-json-actions">
                <button
                  type="button"
                  className="kolo-btn-secondary kolo-btn-sm"
                  onClick={handleCopyJson}
                >
                  {copiedJson ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedJson ? 'Скопійовано!' : 'Скопіювати JSON теми'}</span>
                </button>
                <button
                  type="button"
                  className="kolo-btn-primary kolo-btn-sm"
                  onClick={handleImportJson}
                >
                  <Download size={14} />
                  <span>Застосувати JSON</span>
                </button>
              </div>
              <textarea
                className="kolo-json-textarea"
                rows={7}
                placeholder='Вставте сюди JSON теми або натисніть "Скопіювати JSON теми"...'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              {jsonError && <div className="kolo-json-error">{jsonError}</div>}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
