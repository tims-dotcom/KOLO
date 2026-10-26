import React, { useState, useEffect } from 'react';
import { Shield, Lock, Delete, AlertTriangle, KeyRound } from 'lucide-react';
import { hashPin } from '../utils/cryptoE2EE';

interface AppLockScreenProps {
  expectedPinHash: string;
  onUnlock: () => void;
  onEmergencyWipe: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  expectedPinHash,
  onUnlock,
  onEmergencyWipe,
}) => {
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setErrorMessage(null);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  // Check pin automatically when 4 to 6 digits are entered
  useEffect(() => {
    if (pin.length >= 4) {
      hashPin(pin).then((hash) => {
        if (hash === expectedPinHash) {
          onUnlock();
        } else if (pin.length >= 6) {
          setErrorShake(true);
          setErrorMessage('Невірний PIN-код');
          setTimeout(() => {
            setErrorShake(false);
            setPin('');
          }, 600);
        }
      });
    }
  }, [pin, expectedPinHash, onUnlock]);

  // Support hardware keyboard numbers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pin]);

  return (
    <div className="kolo-app-lock-overlay">
      <div className={`kolo-lock-card ${errorShake ? 'shake' : ''}`}>
        <div className="kolo-lock-icon-wrap">
          <Shield size={36} className="kolo-lock-shield" />
        </div>

        <h2>KOLO Заблоковано</h2>
        <p className="kolo-lock-subtitle">
          Введіть ваш персональний PIN-код для доступу до месенджера
        </p>

        {/* PIN Dots Indicator */}
        <div className="kolo-pin-dots-row">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`kolo-pin-dot ${idx < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {errorMessage && <div className="kolo-lock-error">{errorMessage}</div>}

        {/* Keypad */}
        <div className="kolo-keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="kolo-keypad-btn"
              onClick={() => handleDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <div className="kolo-keypad-empty" />
          <button
            type="button"
            className="kolo-keypad-btn"
            onClick={() => handleDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className="kolo-keypad-btn action"
            onClick={handleDelete}
            title="Стерти"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Emergency Wipe Action */}
        <div className="kolo-lock-footer">
          {!showWipeConfirm ? (
            <button
              type="button"
              className="kolo-lock-wipe-trigger"
              onClick={() => setShowWipeConfirm(true)}
            >
              <AlertTriangle size={14} />
              <span>Екстрене очищення (Emergency Wipe)</span>
            </button>
          ) : (
            <div className="kolo-lock-wipe-confirm">
              <span>Стерти всі локальні ключі та вийти?</span>
              <div className="kolo-confirm-buttons">
                <button
                  type="button"
                  className="kolo-danger-btn kolo-btn-sm"
                  onClick={onEmergencyWipe}
                >
                  Підтвердити
                </button>
                <button
                  type="button"
                  className="kolo-subtle-btn kolo-btn-sm"
                  onClick={() => setShowWipeConfirm(false)}
                >
                  Скасувати
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
