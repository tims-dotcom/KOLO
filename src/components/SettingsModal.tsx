import React, { useState } from 'react';
import {
  X,
  Sliders,
  Eye,
  Volume2,
  Shield,
  Info,
  Check,
  Palette,
  Trash2,
  Sparkles,
  Lock,
  Smartphone,
  Zap,
} from 'lucide-react';
import { AppSettings, ThemeConfig } from '../types/messenger';
import { playSentSound, playReceivedSound, playBeepSound } from '../utils/soundEffects';

interface SettingsModalProps {
  settings: AppSettings;
  theme: ThemeConfig;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenStudio?: () => void;
  onClearLocalCache?: () => void;
  onClose: () => void;
}

type SettingsTab = 'visual' | 'sounds' | 'privacy' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  theme,
  onUpdateSettings,
  onOpenStudio,
  onClearLocalCache,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('visual');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const testVolume = (vol: number) => {
    playBeepSound(vol);
  };

  return (
    <div className="kolo-modal-backdrop" onClick={onClose}>
      <div
        className="kolo-modal-card kolo-settings-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620, width: '92%' }}
      >
        {/* Modal Header */}
        <div className="kolo-modal-header">
          <div className="kolo-modal-title-wrap">
            <div className="kolo-settings-header-icon">
              <Sliders size={20} />
            </div>
            <div>
              <h3>Налаштування додатку</h3>
              <p>Візуалізація, звуки, безпека та шифрування KOLO</p>
            </div>
          </div>
          <button
            type="button"
            className="kolo-icon-btn"
            onClick={onClose}
            title="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="kolo-settings-tabs">
          <button
            type="button"
            className={`kolo-settings-tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual')}
          >
            <Eye size={16} />
            <span>Візуал</span>
          </button>
          <button
            type="button"
            className={`kolo-settings-tab-btn ${activeTab === 'sounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('sounds')}
          >
            <Volume2 size={16} />
            <span>Звуки</span>
          </button>
          <button
            type="button"
            className={`kolo-settings-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield size={16} />
            <span>Шифрування & E2EE</span>
          </button>
          <button
            type="button"
            className={`kolo-settings-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Info size={16} />
            <span>Про KOLO</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="kolo-settings-body">
          {/* TAB 1: VISUAL */}
          {activeTab === 'visual' && (
            <div className="kolo-settings-section">
              <div className="kolo-setting-group">
                <label className="kolo-setting-label">
                  <span className="kolo-setting-title">Масштаб інтерфейсу (UI Scale)</span>
                  <span className="kolo-setting-desc">Зміна розміру елементів для кращої читабельності</span>
                </label>
                <div className="kolo-scale-buttons">
                  {[90, 100, 110, 120].map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      className={`kolo-scale-btn ${settings.uiScale === scale ? 'active' : ''}`}
                      onClick={() => onUpdateSettings({ uiScale: scale })}
                    >
                      {scale}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">Зменшення руху (Reduce Motion)</span>
                  <span className="kolo-setting-desc">Вимкнути інтенсивні шейдери та динамічні анімації для економії заряду</span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => onUpdateSettings({ reduceMotion: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">24-годинний формат часу</span>
                  <span className="kolo-setting-desc">Відображати 18:45 замість 06:45 PM</span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.timeFormat24h}
                    onChange={(e) => onUpdateSettings({ timeFormat24h: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">Компактний вигляд повідомлень</span>
                  <span className="kolo-setting-desc">Зменшити відступи між бульбашками для вміщення більшої кількості тексту</span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.compactMessageList}
                    onChange={(e) => onUpdateSettings({ compactMessageList: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">Відображати аватарки в чатах</span>
                  <span className="kolo-setting-desc">Показувати мініатюри авторів біля кожного повідомлення</span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.showAvatarsInChat}
                    onChange={(e) => onUpdateSettings({ showAvatarsInChat: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              <div className="kolo-setting-card-highlight">
                <div className="kolo-setting-highlight-body">
                  <Palette size={22} className="kolo-accent-icon" />
                  <div>
                    <h4>Студія Глибокої Кастомізації</h4>
                    <p>Налаштуйте живі шейдери фону (Aurora, Matrix, Orbs), градієнти бульбашок, шрифти та скло.</p>
                  </div>
                </div>
                {onOpenStudio && (
                  <button
                    type="button"
                    className="kolo-primary-btn"
                    onClick={() => {
                      onClose();
                      onOpenStudio();
                    }}
                  >
                    Відкрити Студію 🎨
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SOUNDS */}
          {activeTab === 'sounds' && (
            <div className="kolo-settings-section">
              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">Звукові ефекти</span>
                  <span className="kolo-setting-desc">Відтворювати звуки при відправці та отриманні повідомлень</span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              {settings.soundEnabled && (
                <>
                  <div className="kolo-setting-group">
                    <div className="kolo-slider-label-row">
                      <span className="kolo-setting-title">Гучність ефектів</span>
                      <span className="kolo-slider-val">{Math.round(settings.soundVolume * 100)}%</span>
                    </div>
                    <div className="kolo-sound-slider-row">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.soundVolume}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          onUpdateSettings({ soundVolume: v });
                        }}
                        className="kolo-range-input"
                      />
                      <button
                        type="button"
                        className="kolo-test-sound-btn"
                        onClick={() => testVolume(settings.soundVolume)}
                        title="Тест звуку"
                      >
                        <Volume2 size={15} /> Тест
                      </button>
                    </div>
                  </div>

                  <div className="kolo-setting-item">
                    <div className="kolo-setting-info">
                      <span className="kolo-setting-title">Звук відправленого повідомлення</span>
                      <span className="kolo-setting-desc">М'який звук при успішній відправці</span>
                    </div>
                    <div className="kolo-row-btn-wrap">
                      <button
                        type="button"
                        className="kolo-subtle-btn"
                        onClick={() => playSentSound(settings.soundVolume)}
                        title="Послухати"
                      >
                        Слухати
                      </button>
                      <label className="kolo-switch">
                        <input
                          type="checkbox"
                          checked={settings.soundOutgoing}
                          onChange={(e) => onUpdateSettings({ soundOutgoing: e.target.checked })}
                        />
                        <span className="kolo-switch-slider" />
                      </label>
                    </div>
                  </div>

                  <div className="kolo-setting-item">
                    <div className="kolo-setting-info">
                      <span className="kolo-setting-title">Звук нового вхідного повідомлення</span>
                      <span className="kolo-setting-desc">Сигнал при отриманні повідомлення від співрозмовника</span>
                    </div>
                    <div className="kolo-row-btn-wrap">
                      <button
                        type="button"
                        className="kolo-subtle-btn"
                        onClick={() => playReceivedSound(settings.soundVolume)}
                        title="Послухати"
                      >
                        Слухати
                      </button>
                      <label className="kolo-switch">
                        <input
                          type="checkbox"
                          checked={settings.soundIncoming}
                          onChange={(e) => onUpdateSettings({ soundIncoming: e.target.checked })}
                        />
                        <span className="kolo-switch-slider" />
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: PRIVACY & E2EE */}
          {activeTab === 'privacy' && (
            <div className="kolo-settings-section">
              <div className="kolo-security-banner">
                <div className="kolo-security-icon-wrap">
                  <Lock size={26} />
                </div>
                <div className="kolo-security-banner-info">
                  <h4>Наскрізне шифрування (E2EE)</h4>
                  <p>
                    Стандарт AES-256-GCM з 100 000 ітераціями PBKDF2 SHA-256. Всі ваші повідомлення
                    шифруються локально в браузері перед передачею.
                  </p>
                </div>
              </div>

              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">E2EE Шифрування повідомлень</span>
                  <span className="kolo-setting-desc">
                    Сервер бачить і зберігає виключно зашифровані байти. Прочитати текст можуть тільки учасники діалогу.
                  </span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.e2eeEnabled}
                    onChange={(e) => onUpdateSettings({ e2eeEnabled: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              <div className="kolo-setting-box">
                <div className="kolo-setting-box-header">
                  <Zap size={18} className="kolo-accent-icon" />
                  <strong>Автоматичне видалення порожніх груп</strong>
                </div>
                <p className="kolo-setting-desc">
                  У KOLO працює смарт-очищення: як тільки в групі або каналі не залишається жодного
                  учасника (0 користувачів), вона <b>автоматично безповоротно видаляється</b> з серверної бази
                  разом з усіма збереженими даними.
                </p>
                <div className="kolo-status-pill ok">
                  <Check size={13} />
                  <span>Функція активна на рівні сервера</span>
                </div>
              </div>

              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">Приховувати мій статус «В мережі»</span>
                  <span className="kolo-setting-desc">Не транслювати іншим користувачам точний час активності</span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.hideOnlineStatus}
                    onChange={(e) => onUpdateSettings({ hideOnlineStatus: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              <div className="kolo-danger-zone">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title" style={{ color: '#ef4444' }}>
                    Скинути локальні ключі та кеш
                  </span>
                  <span className="kolo-setting-desc">
                    Очистить збережені локально сесії, кешовані теми та заново ініціалізує середовище шифрування.
                  </span>
                </div>
                {!showClearConfirm ? (
                  <button
                    type="button"
                    className="kolo-danger-btn"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    <Trash2 size={15} /> Очистити кеш
                  </button>
                ) : (
                  <div className="kolo-confirm-row">
                    <button
                      type="button"
                      className="kolo-danger-btn"
                      onClick={() => {
                        setShowClearConfirm(false);
                        if (onClearLocalCache) onClearLocalCache();
                      }}
                    >
                      Підтвердити очищення
                    </button>
                    <button
                      type="button"
                      className="kolo-subtle-btn"
                      onClick={() => setShowClearConfirm(false)}
                    >
                      Скасувати
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT */}
          {activeTab === 'about' && (
            <div className="kolo-settings-section">
              <div className="kolo-about-card">
                <div className="kolo-about-logo">
                  <span>⚡</span>
                </div>
                <h3>KOLO Messenger</h3>
                <div className="kolo-version-tag">Версія 2.5 • Zero-Knowledge E2EE</div>
                <p className="kolo-about-text">
                  Надсучасний захищений веб-месенджер з безпрецедентним рівнем персоналізації,
                  наскрізним криптографічним шифруванням, Web Audio голосовими повідомленнями та
                  живими аудіо-реактивними шейдерами.
                </p>

                <div className="kolo-about-specs">
                  <div className="kolo-spec-row">
                    <span>Криптографічний рушій:</span>
                    <strong>AES-256-GCM / PBKDF2 (W3C WebCrypto)</strong>
                  </div>
                  <div className="kolo-spec-row">
                    <span>Збереження на сервері:</span>
                    <strong>Тільки шифровані дані (Zero-Knowledge)</strong>
                  </div>
                  <div className="kolo-spec-row">
                    <span>Очищення каналів:</span>
                    <strong>Автоматичне видалення при 0 учасниках</strong>
                  </div>
                  <div className="kolo-spec-row">
                    <span>Аудіо ядро:</span>
                    <strong>16-bit PCM WAV + Web Audio API</strong>
                  </div>
                  <div className="kolo-spec-row">
                    <span>Протокол зв'язку:</span>
                    <strong>WebSocket + TLS 1.3 / HTTPS</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
