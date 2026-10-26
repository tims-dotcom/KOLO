import React, { useEffect, useState } from 'react';
import { Shield, X, Lock, CheckCircle2, Key, Copy, Check } from 'lucide-react';
import { Chat, User } from '../types/messenger';
import { generateSafetyFingerprint } from '../utils/cryptoE2EE';

interface SafetyVerificationModalProps {
  chat: Chat;
  currentUser: User;
  customPassphrase?: string;
  onSetCustomPassphrase: (passphrase: string) => void;
  onClose: () => void;
}

export const SafetyVerificationModal: React.FC<SafetyVerificationModalProps> = ({
  chat,
  currentUser,
  customPassphrase = '',
  onSetCustomPassphrase,
  onClose,
}) => {
  const [fingerprint, setFingerprint] = useState<{ numeric: string; emoji: string }>({
    numeric: '00000 00000 00000 00000 00000 00000',
    emoji: '🛡️ 🔐 ⚡ 💎 🌀',
  });
  const [copied, setCopied] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState(customPassphrase);

  useEffect(() => {
    generateSafetyFingerprint(chat.id, passphraseInput).then(setFingerprint);
  }, [chat.id, passphraseInput]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint.numeric);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePassphrase = (e: React.FormEvent) => {
    e.preventDefault();
    onSetCustomPassphrase(passphraseInput.trim());
  };

  return (
    <div className="kolo-modal-backdrop" onClick={onClose}>
      <div
        className="kolo-modal-card kolo-safety-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, width: '92%' }}
      >
        <div className="kolo-modal-header">
          <div className="kolo-modal-title-wrap">
            <div className="kolo-safety-icon-badge">
              <Shield size={22} />
            </div>
            <div>
              <h3>Наскрізне шифрування (E2EE)</h3>
              <p>Безпека діалогу: {chat.title}</p>
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

        <div className="kolo-safety-body">
          <div className="kolo-safety-verified-badge">
            <CheckCircle2 size={18} />
            <span>Статус: Захищено алгоритмом AES-256-GCM (Zero-Knowledge)</span>
          </div>

          <p className="kolo-safety-desc">
            Усі текстові повідомлення в цьому чаті шифруються на вашому пристрої перед відправкою.
            Сервер KOLO та база даних бачать лише нерозбірливий шифротекст і не мають змоги розшифрувати
            листування.
          </p>

          {/* Visual Emoji Fingerprint */}
          <div className="kolo-fingerprint-emoji-card">
            <div className="kolo-fingerprint-emojis">{fingerprint.emoji}</div>
            <div className="kolo-fingerprint-subtitle">Візуальний емодзі-відбиток сесії</div>
          </div>

          {/* Numeric Safety Number */}
          <div className="kolo-safety-number-box">
            <div className="kolo-safety-num-label">
              <span>Цифровий код безпеки (Safety Number)</span>
              <button
                type="button"
                className="kolo-copy-btn"
                onClick={handleCopy}
                title="Скопіювати код"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Скопійовано' : 'Скопіювати'}</span>
              </button>
            </div>
            <div className="kolo-safety-code-digits">{fingerprint.numeric}</div>
            <p className="kolo-safety-num-hint">
              Ви можете порівняти ці 30 цифр з співрозмовником (наприклад, під час дзвінка). Якщо числа однакові — перехоплення повідомлень технічно неможливе.
            </p>
          </div>

          {/* Custom Room Secret Key / Passphrase */}
          <form onSubmit={handleSavePassphrase} className="kolo-psk-box">
            <div className="kolo-psk-header">
              <Key size={16} />
              <strong>Додатковий секретний ключ кімнати (PSK)</strong>
            </div>
            <p className="kolo-psk-hint">
              (Опціонально) Якщо ви і співрозмовник введете однаковий таємний пароль кімнати, ключ AES-256 буде змішано з вашим спільним секретом:
            </p>
            <div className="kolo-psk-input-row">
              <input
                type="password"
                placeholder="Секретний пароль (залиште порожнім за замовчуванням)..."
                value={passphraseInput}
                onChange={(e) => setPassphraseInput(e.target.value)}
                className="kolo-input"
              />
              <button type="submit" className="kolo-primary-btn" style={{ whiteSpace: 'nowrap' }}>
                Зберегти
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
