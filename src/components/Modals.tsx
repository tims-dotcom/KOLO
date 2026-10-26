import React, { useState } from 'react';
import {
  Camera,
  Check,
  LogOut,
  Megaphone,
  Plus,
  Save,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Chat, ChatType, Message, ThemeConfig, User } from '../types/messenger';
import { Avatar } from './Avatar';

interface ChatInfoPanelProps {
  chat: Chat;
  currentUser: User;
  users: User[];
  messages: Message[];
  theme: ThemeConfig;
  onStartDmWithUser: (user: User) => void;
  onApplySharedTheme: (themeData: ThemeConfig) => void;
  onLeaveChat: (chatId: string) => void;
  onClose: () => void;
}

export const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({
  chat,
  currentUser,
  users,
  messages,
  theme,
  onStartDmWithUser,
  onApplySharedTheme,
  onLeaveChat,
  onClose,
}) => {
  const otherUser =
    chat.type === 'dm'
      ? users.find(
          (u) =>
            u.id ===
            (chat.memberIds.find((id) => id !== currentUser.id) || chat.memberIds[0])
        )
      : undefined;

  const title = otherUser ? otherUser.displayName : chat.title;
  const color = otherUser ? otherUser.avatarColor : chat.avatarColor;
  const emoji = otherUser ? otherUser.avatarEmoji : chat.avatarEmoji;
  const imageUrl = otherUser ? otherUser.avatarUrl : chat.avatarUrl;
  const handle = otherUser ? otherUser.username : chat.handle;
  const description = otherUser ? otherUser.bio : chat.description;

  const sharedThemes = messages.filter((m) => m.attachment?.type === 'theme');
  const sharedMedia = messages.filter(
    (m) => m.attachment?.type === 'image' || m.attachment?.type === 'file'
  );

  return (
    <aside className="kolo-info-panel">
      <div className="kolo-studio-header">
        <div className="kolo-studio-title">
          <h3>Інформація</h3>
        </div>
        <button type="button" className="kolo-icon-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="kolo-info-body">
        <div className="kolo-info-hero">
          <Avatar
            title={title}
            color={color}
            emoji={emoji}
            imageUrl={imageUrl}
            online={otherUser?.online}
            shape={theme.avatarShape}
            size={76}
          />
          <h3>
            {title} {otherUser?.statusEmoji || ''}
          </h3>
          {handle && <span className="kolo-info-handle">@{handle}</span>}
          {description && <p className="kolo-info-desc">{description}</p>}

          {chat.type !== 'dm' && chat.memberIds.includes(currentUser.id) && (
            <button
              type="button"
              className="kolo-btn-ghost kolo-btn-sm"
              style={{ marginTop: 8, color: '#fb7185' }}
              onClick={() => onLeaveChat(chat.id)}
            >
              <LogOut size={13} />
              <span>
                {chat.type === 'channel' ? 'Відписатися від каналу' : 'Вийти з групи'}
              </span>
            </button>
          )}
        </div>

        {sharedThemes.length > 0 && (
          <div className="kolo-studio-group">
            <h4>Надіслані теми в чаті ({sharedThemes.length})</h4>
            <div className="kolo-shared-themes-list">
              {sharedThemes.map((m) => (
                <div key={m.id} className="kolo-shared-theme-item">
                  <span>🎨 {m.attachment?.themeData?.name || 'Тема'}</span>
                  <button
                    type="button"
                    className="kolo-btn-secondary kolo-btn-sm"
                    onClick={() =>
                      m.attachment?.themeData &&
                      onApplySharedTheme(m.attachment.themeData)
                    }
                  >
                    <Sparkles size={13} />
                    <span>Застосувати</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sharedMedia.length > 0 && (
          <div className="kolo-studio-group">
            <h4>Файли та медіа ({sharedMedia.length})</h4>
            <div className="kolo-shared-themes-list">
              {sharedMedia.map((m) => (
                <a
                  key={m.id}
                  href={m.attachment?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="kolo-shared-theme-item"
                >
                  <span>📎 {m.attachment?.name || 'Медіафайл'}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="kolo-studio-group">
          <h4>Учасники ({chat.memberIds.length})</h4>
          <div className="kolo-member-list">
            {chat.memberIds.map((uid) => {
              const u = users.find((user) => user.id === uid);
              if (!u) return null;
              return (
                <div
                  key={u.id}
                  className="kolo-member-item"
                  onClick={() => {
                    if (u.id !== currentUser.id) onStartDmWithUser(u);
                  }}
                >
                  <Avatar
                    title={u.displayName}
                    color={u.avatarColor}
                    emoji={u.avatarEmoji}
                    imageUrl={u.avatarUrl}
                    online={u.online}
                    shape={theme.avatarShape}
                    size={36}
                  />
                  <div className="kolo-member-meta">
                    <strong>
                      {u.displayName} {u.statusEmoji || ''}{' '}
                      {u.id === currentUser.id ? '(Ви)' : ''}
                    </strong>
                    <span>{u.online ? 'в мережі' : `@${u.username}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};

interface CreateChatModalProps {
  currentUser: User;
  users: User[];
  onCreateChat: (payload: {
    type: ChatType;
    title: string;
    handle: string;
    description: string;
    avatarColor: string;
    avatarEmoji: string;
    memberIds: string[];
    isPublic: boolean;
  }) => void;
  onClose: () => void;
}

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6'];
const AVATAR_EMOJIS = ['🌌', '🚀', '🎨', '⚡', '🔥', '🎮', '🎧', '💎'];
const STATUS_EMOJIS = ['🚀', '⚡', '🎨', '💻', '🎧', '☕', '🔥', '🌙', '✨'];

export const CreateChatModal: React.FC<CreateChatModalProps> = ({
  currentUser,
  users,
  onCreateChat,
  onClose,
}) => {
  const [type, setType] = useState<ChatType>('group');
  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [avatarColor, setAvatarColor] = useState('#6366f1');
  const [avatarEmoji, setAvatarEmoji] = useState('🌌');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    users.map((u) => u.id)
  );

  const toggleMember = (id: string) => {
    if (id === currentUser.id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateChat({
      type,
      title: title.trim(),
      handle: handle.trim() || `kolo_${Date.now().toString().slice(-4)}`,
      description: description.trim(),
      avatarColor,
      avatarEmoji,
      memberIds: Array.from(new Set([currentUser.id, ...selectedIds])),
      isPublic,
    });
    onClose();
  };

  return (
    <div className="kolo-modal-backdrop" onClick={onClose}>
      <div className="kolo-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="kolo-modal-header">
          <h3>Створити новий простір</h3>
          <button type="button" className="kolo-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="kolo-modal-form">
          <div className="kolo-segmented">
            <button
              type="button"
              className={type === 'group' ? 'active' : ''}
              onClick={() => setType('group')}
            >
              <Users size={14} /> Група
            </button>
            <button
              type="button"
              className={type === 'channel' ? 'active' : ''}
              onClick={() => setType('channel')}
            >
              <Megaphone size={14} /> Канал
            </button>
          </div>

          <label className="kolo-sub-label">
            Назва {type === 'group' ? 'групи' : 'каналу'}
          </label>
          <input
            type="text"
            required
            placeholder="Наприклад: Кіберпанк Дизайн Клуб"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="kolo-input-sm"
          />

          <label className="kolo-sub-label">Публічний тег (@handle)</label>
          <input
            type="text"
            placeholder="cyber_club"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="kolo-input-sm"
          />

          <label className="kolo-sub-label">Опис</label>
          <input
            type="text"
            placeholder="Про що цей чат..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="kolo-input-sm"
          />

          <label className="kolo-toggle-row">
            <span>Публічний доступ (видимий у пошуку всім)</span>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
          </label>

          <label className="kolo-sub-label">Іконка та колір аватарки</label>
          <div className="kolo-picker-strip">
            {AVATAR_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                className={`kolo-chip-btn ${avatarEmoji === em ? 'active' : ''}`}
                onClick={() => setAvatarEmoji(em)}
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

          <label className="kolo-sub-label">Додати учасників</label>
          <div className="kolo-member-select-list">
            {users
              .filter((u) => u.id !== currentUser.id)
              .map((u) => {
                const checked = selectedIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`kolo-member-select-item ${checked ? 'selected' : ''}`}
                    onClick={() => toggleMember(u.id)}
                  >
                    <span>
                      {u.avatarEmoji} {u.displayName} (@{u.username})
                    </span>
                    {checked && <Check size={15} />}
                  </button>
                );
              })}
          </div>

          <div className="kolo-modal-actions">
            <button type="button" className="kolo-btn-ghost" onClick={onClose}>
              Скасувати
            </button>
            <button type="submit" className="kolo-btn-primary">
              <Plus size={16} />
              <span>Створити</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProfileModalProps {
  currentUser: User;
  theme: ThemeConfig;
  onUpdateProfile: (payload: {
    displayName: string;
    username: string;
    bio: string;
    avatarColor: string;
    avatarEmoji?: string;
    avatarUrl?: string;
    statusEmoji?: string;
    newPassword?: string;
  }) => Promise<void>;
  onUploadFile: (file: File) => Promise<{ url: string }>;
  onLogout: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  theme,
  onUpdateProfile,
  onUploadFile,
  onLogout,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#6366f1');
  const [avatarEmoji, setAvatarEmoji] = useState(currentUser.avatarEmoji || '⚡');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser.avatarUrl);
  const [statusEmoji, setStatusEmoji] = useState(currentUser.statusEmoji || '🚀');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploaded = await onUploadFile(file);
      setAvatarUrl(uploaded.url);
    } catch {
      setError('Помилка завантаження фото');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onUpdateProfile({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatarColor,
        avatarEmoji,
        avatarUrl,
        statusEmoji,
        newPassword: newPassword.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Помилка збереження профілю');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="kolo-modal-backdrop" onClick={onClose}>
      <div className="kolo-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="kolo-modal-header">
          <h3>Налаштування Вашого Профілю</h3>
          <button type="button" className="kolo-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="kolo-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="kolo-modal-form">
          <div className="kolo-reg-avatar-box">
            <div className="kolo-reg-avatar-preview">
              <Avatar
                title={displayName}
                color={avatarColor}
                emoji={avatarEmoji}
                imageUrl={avatarUrl}
                shape={theme.avatarShape}
                size={68}
              />
              <label className="kolo-avatar-upload-badge" title="Змінити фото">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            <div className="kolo-reg-avatar-controls">
              <span className="kolo-sub-label">Аватарка та колір фону</span>
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

          <label className="kolo-sub-label">Емодзі-статус біля імені</label>
          <div className="kolo-picker-strip">
            {STATUS_EMOJIS.map((st) => (
              <button
                key={st}
                type="button"
                className={`kolo-chip-btn ${statusEmoji === st ? 'active' : ''}`}
                onClick={() => setStatusEmoji(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="kolo-field-row">
            <div>
              <label className="kolo-sub-label">Ім’я користувача</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="kolo-input-sm"
              />
            </div>
            <div>
              <label className="kolo-sub-label">Нікнейм (@username)</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                }
                className="kolo-input-sm"
              />
            </div>
          </div>

          <label className="kolo-sub-label">Про себе (Bio)</label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="kolo-input-sm"
          />

          <label className="kolo-sub-label">
            Новий пароль (залиште порожнім, якщо не змінюєте)
          </label>
          <input
            type="password"
            placeholder="Новий пароль (мін. 4 символи)..."
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="kolo-input-sm"
          />

          <div
            className="kolo-modal-actions"
            style={{ justifyContent: 'space-between', marginTop: 14 }}
          >
            <button
              type="button"
              className="kolo-btn-ghost"
              style={{ color: '#fb7185' }}
              onClick={onLogout}
            >
              <LogOut size={15} />
              <span>Вийти з акаунту</span>
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="kolo-btn-ghost" onClick={onClose}>
                Скасувати
              </button>
              <button type="submit" disabled={saving} className="kolo-btn-primary">
                <Save size={15} />
                <span>{saving ? 'Збереження...' : 'Зберегти'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
