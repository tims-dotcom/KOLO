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
  KeyRound,
  Flame,
  Monitor,
  AlertTriangle,
} from 'lucide-react';
import { AppSettings, ThemeConfig } from '../types/messenger';
import { playSentSound, playReceivedSound, playBeepSound } from '../utils/soundEffects';
import { hashPin } from '../utils/cryptoE2EE';

interface SettingsModalProps {
  settings: AppSettings;
  theme: ThemeConfig;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenStudio?: () => void;
  onClearLocalCache?: () => void;
  onTerminateOtherSessions?: () => Promise<void>;
  onClose: () => void;
}

type SettingsTab = 'visual' | 'sounds' | 'privacy' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  theme,
  onUpdateSettings,
  onOpenStudio,
  onClearLocalCache,
  onTerminateOtherSessions,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('visual');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinConfirmInput, setPinConfirmInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [terminatingSessions, setTerminatingSessions] = useState(false);
  const [sessionToast, setSessionToast] = useState<string | null>(null);

  const testVolume = (vol: number) => {
    playBeepSound(vol);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4 || pinInput.length > 6 || !/^\d+$/.test(pinInput)) {
      setPinError('PIN має містити від 4 до 6 цифр');
      return;
    }
    if (pinInput !== pinConfirmInput) {
      setPinError('Введені PIN-коди не співпадають');
      return;
    }
    const hash = await hashPin(pinInput);
    onUpdateSettings({
      appLockEnabled: true,
      appLockPinHash: hash,
    });
    setShowPinSetup(false);
    setPinInput('');
    setPinConfirmInput('');
    setPinError(null);
  };

  const handleDisablePin = () => {
    onUpdateSettings({
      appLockEnabled: false,
      appLockPinHash: '',
    });
    setShowPinSetup(false);
  };

  const handleTerminateSessions = async () => {
    setTerminatingSessions(true);
    try {
      if (onTerminateOtherSessions) {
        await onTerminateOtherSessions();
      }
      setSessionToast('Усі інші сесії успішно завершено!');
      setTimeout(() => setSessionToast(null), 3000);
    } catch {
      setSessionToast('Помилка завершення сесій');
      setTimeout(() => setSessionToast(null), 3000);
    } finally {
      setTerminatingSessions(false);
    }
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

              {/* APP PIN LOCK */}
              <div className="kolo-setting-box">
                <div className="kolo-setting-box-header">
                  <KeyRound size={18} className="kolo-accent-icon" />
                  <strong>Блокування додатку PIN-кодом (App Lock)</strong>
                </div>
                <p className="kolo-setting-desc">
                  Встановіть 4-6 значний код доступу. При згортанні або відході від пристрою KOLO буде заблоковано.
                </p>

                {settings.appLockEnabled && settings.appLockPinHash ? (
                  <div className="kolo-pin-status-box">
                    <div className="kolo-status-pill ok">
                      <Check size={13} />
                      <span>PIN-код активний</span>
                    </div>
                    <div className="kolo-pin-actions">
                      <button
                        type="button"
                        className="kolo-subtle-btn"
                        onClick={() => setShowPinSetup(true)}
                      >
                        Змінити PIN
                      </button>
                      <button
                        type="button"
                        className="kolo-danger-btn kolo-btn-sm"
                        onClick={handleDisablePin}
                      >
                        Вимкнути PIN
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {!showPinSetup ? (
                      <button
                        type="button"
                        className="kolo-primary-btn kolo-btn-sm"
                        onClick={() => setShowPinSetup(true)}
                      >
                        Встановити PIN-код 🔐
                      </button>
                    ) : null}
                  </div>
                )}

                {showPinSetup && (
                  <form onSubmit={handleSavePin} className="kolo-pin-form">
                    <div className="kolo-pin-input-grid">
                      <div>
                        <label className="kolo-form-label">Новий PIN (4-6 цифр):</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="••••"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                          className="kolo-input"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="kolo-form-label">Підтвердіть PIN:</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="••••"
                          value={pinConfirmInput}
                          onChange={(e) => setPinConfirmInput(e.target.value.replace(/\D/g, ''))}
                          className="kolo-input"
                        />
                      </div>
                    </div>
                    {pinError && <div className="kolo-lock-error">{pinError}</div>}
                    <div className="kolo-confirm-buttons" style={{ marginTop: 8 }}>
                      <button type="submit" className="kolo-primary-btn kolo-btn-sm">
                        Зберегти PIN
                      </button>
                      <button
                        type="button"
                        className="kolo-subtle-btn kolo-btn-sm"
                        onClick={() => {
                          setShowPinSetup(false);
                          setPinError(null);
                        }}
                      >
                        Скасувати
                      </button>
                    </div>
                  </form>
                )}

                {settings.appLockEnabled && (
                  <div className="kolo-setting-subitem" style={{ marginTop: 10 }}>
                    <label className="kolo-form-label">Час до автоблокування:</label>
                    <select
                      className="kolo-input"
                      value={settings.autoLockMinutes}
                      onChange={(e) => onUpdateSettings({ autoLockMinutes: parseInt(e.target.value, 10) })}
                    >
                      <option value="0">Негайно при перемиканні вкладок / згортанні</option>
                      <option value="1">Через 1 хвилину бездіяльності</option>
                      <option value="5">Через 5 хвилин бездіяльності</option>
                      <option value="15">Через 15 хвилин бездіяльності</option>
                      <option value="-1">Тільки вручну</option>
                    </select>
                  </div>
                )}
              </div>

              {/* ANTI-SHOULDER SURFING STEALTH BLUR */}
              <div className="kolo-setting-item">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title">Стелс-захист від підглядання (Anti-Shoulder Surfing)</span>
                  <span className="kolo-setting-desc">
                    Миттєво маскувати та розмивати весь інтерфейс чату, якщо вікно браузера втрачає фокус (Alt+Tab або перемикання вкладок).
                  </span>
                </div>
                <label className="kolo-switch">
                  <input
                    type="checkbox"
                    checked={settings.stealthBlurOnBlur}
                    onChange={(e) => onUpdateSettings({ stealthBlurOnBlur: e.target.checked })}
                  />
                  <span className="kolo-switch-slider" />
                </label>
              </div>

              {/* ACTIVE SESSIONS MANAGEMENT */}
              <div className="kolo-setting-box">
                <div className="kolo-setting-box-header">
                  <Monitor size={18} className="kolo-accent-icon" />
                  <strong>Активні сесії та пристрої</strong>
                </div>
                <p className="kolo-setting-desc">
                  Ви можете миттєво відкликати доступ на всіх інших пристроях та комп'ютерах.
                </p>

                <div className="kolo-session-card">
                  <div className="kolo-session-info">
                    <div className="kolo-session-title">
                      <Smartphone size={15} />
                      <span>Поточний браузер & пристрій</span>
                      <span className="kolo-role-badge online">Активна сесія</span>
                    </div>
                    <span className="kolo-session-meta">
                      {navigator.userAgent.includes('Mobile') ? 'Мобільний пристрій' : 'ПК / Ноутбук'} • Підключено через TLS 1.3
                    </span>
                  </div>
                </div>

                {sessionToast && (
                  <div className="kolo-status-pill ok" style={{ alignSelf: 'stretch', justifyContent: 'center' }}>
                    <Check size={14} /> <span>{sessionToast}</span>
                  </div>
                )}

                <button
                  type="button"
                  className="kolo-danger-btn kolo-btn-sm"
                  disabled={terminatingSessions}
                  onClick={handleTerminateSessions}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <AlertTriangle size={14} />
                  <span>{terminatingSessions ? 'Закриття...' : 'Завершити всі інші сесії'}</span>
                </button>
              </div>

              {/* E2EE SWITCH */}
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

              {/* EMPTY GROUP AUTO-PURGE */}
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

              {/* HIDE ONLINE STATUS */}
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

              {/* DANGER ZONE / CACHE & LOCKDOWN */}
              <div className="kolo-danger-zone">
                <div className="kolo-setting-info">
                  <span className="kolo-setting-title" style={{ color: '#ef4444' }}>
                    Екстрене очищення сесії та скидання ключів
                  </span>
                  <span className="kolo-setting-desc">
                    Миттєво знищує всі локальні токени, сесії, кешовані ключі та повертає додаток до початкового стану.
                  </span>
                </div>
                {!showClearConfirm ? (
                  <button
                    type="button"
                    className="kolo-danger-btn"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    <Trash2 size={15} /> Очистити все зараз
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
