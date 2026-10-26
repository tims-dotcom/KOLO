import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  KeyRound,
  Megaphone,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Chat, User } from '../types/messenger';

interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  bannedUsers: number;
  adminUsers: number;
  totalChats: number;
  totalMessages: number;
  uptimeSec: number;
}

interface AdminUserRow extends User {
  messagesCount: number;
  chatsCount: number;
}

interface AdminChatRow extends Chat {
  messagesCount: number;
}

interface AdminPanelProps {
  token: string;
  currentUser: User;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

type AdminTab = 'overview' | 'users' | 'chats' | 'broadcast';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  token,
  currentUser,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRow[]>([]);
  const [chatsList, setChatsList] = useState<AdminChatRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');

  // Password reset prompt state
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch {
      onShowToast('Не вдалося завантажити список користувачів');
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/chats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setChatsList(data);
      }
    } catch {
      onShowToast('Не вдалося завантажити список чатів');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') fetchOverview();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'chats') fetchChats();
  }, [activeTab]);

  const handleToggleBan = async (userId: string, currentBanned?: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(
        data.isBanned
          ? 'Користувача заблоковано'
          : 'Користувача розблоковано'
      );
      fetchUsers();
      fetchOverview();
    } catch (err: any) {
      onShowToast(err?.message || 'Помилка блокування');
    }
  };

  const handleToggleRole = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-role`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(`Роль змінено на: ${data.role}`);
      fetchUsers();
      fetchOverview();
    } catch (err: any) {
      onShowToast(err?.message || 'Помилка зміни ролі');
    }
  };

  const handleResetPassword = async (userId: string) => {
    const pass = newPasswordInput.trim() || 'kolo123';
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast(data.message);
      setResettingUserId(null);
      setNewPasswordInput('');
    } catch (err: any) {
      onShowToast(err?.message || 'Помилка скидання пароля');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Ви дійсно бажаєте видалити акаунт ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      onShowToast('Користувача видалено');
      fetchUsers();
      fetchOverview();
    } catch (err: any) {
      onShowToast(err?.message || 'Помилка видалення');
    }
  };

  const handleDeleteChat = async (chatId: string, title: string) => {
    if (!window.confirm(`Ви дійсно бажаєте видалити чат «${title}»?`)) return;
    try {
      const res = await fetch(`/api/admin/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      onShowToast(`Чат «${title}» видалено`);
      fetchChats();
      fetchOverview();
    } catch (err: any) {
      onShowToast(err?.message || 'Помилка видалення чату');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setBroadcasting(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: broadcastText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onShowToast('Оголошення успішно розіслано всім учасникам!');
      setBroadcastText('');
    } catch (err: any) {
      onShowToast(err?.message || 'Помилка розсилки');
    } finally {
      setBroadcasting(false);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'менше хвилини';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs} год ${mins} хв`;
    return `${mins} хв`;
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredChats = chatsList.filter(
    (c) =>
      c.title.toLowerCase().includes(chatSearch.toLowerCase()) ||
      (c.handle && c.handle.toLowerCase().includes(chatSearch.toLowerCase()))
  );

  return (
    <div className="kolo-modal-backdrop" onClick={onClose}>
      <div
        className="kolo-modal-card kolo-admin-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="kolo-admin-header">
          <div className="kolo-admin-header-title">
            <div className="kolo-admin-badge-icon">
              <Shield size={20} />
            </div>
            <div>
              <h3>Адмін Панель KOLO</h3>
              <span>Панель керування системою та безпекою</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="kolo-admin-pill-tag">ROOT ACCESS</span>
            <button
              type="button"
              className="kolo-icon-btn"
              onClick={onClose}
              title="Закрити"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="kolo-segmented" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <Radio size={14} /> Огляд
          </button>
          <button
            type="button"
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            <Users size={14} /> Користувачі ({stats?.totalUsers || 0})
          </button>
          <button
            type="button"
            className={activeTab === 'chats' ? 'active' : ''}
            onClick={() => setActiveTab('chats')}
          >
            <MessageSquare size={14} /> Чати ({stats?.totalChats || 0})
          </button>
          <button
            type="button"
            className={activeTab === 'broadcast' ? 'active' : ''}
            onClick={() => setActiveTab('broadcast')}
          >
            <Megaphone size={14} /> Оголошення
          </button>
        </div>

        {/* Content Body */}
        <div className="kolo-admin-content-body">
          {activeTab === 'overview' && (
            <div className="kolo-admin-overview-grid">
              <div className="kolo-stat-card">
                <div className="kolo-stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#6366f1' }}>
                  <Users size={22} />
                </div>
                <div className="kolo-stat-info">
                  <strong>{stats?.totalUsers ?? '...'}</strong>
                  <span>Користувачів в базі</span>
                </div>
              </div>

              <div className="kolo-stat-card">
                <div className="kolo-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981' }}>
                  <UserCheck size={22} />
                </div>
                <div className="kolo-stat-info">
                  <strong>{stats?.onlineUsers ?? '...'}</strong>
                  <span>В мережі зараз</span>
                </div>
              </div>

              <div className="kolo-stat-card">
                <div className="kolo-stat-icon-wrap" style={{ background: 'rgba(244, 63, 94, 0.18)', color: '#f43f5e' }}>
                  <Ban size={22} />
                </div>
                <div className="kolo-stat-info">
                  <strong>{stats?.bannedUsers ?? '...'}</strong>
                  <span>Заблокованих</span>
                </div>
              </div>

              <div className="kolo-stat-card">
                <div className="kolo-stat-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.18)', color: '#ec4899' }}>
                  <MessageSquare size={22} />
                </div>
                <div className="kolo-stat-info">
                  <strong>{stats?.totalChats ?? '...'}</strong>
                  <span>Кількість чатів</span>
                </div>
              </div>

              <div className="kolo-stat-card">
                <div className="kolo-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b' }}>
                  <Send size={22} />
                </div>
                <div className="kolo-stat-info">
                  <strong>{stats?.totalMessages ?? '...'}</strong>
                  <span>Надіслано повідомлень</span>
                </div>
              </div>

              <div className="kolo-stat-card">
                <div className="kolo-stat-icon-wrap" style={{ background: 'rgba(14, 165, 233, 0.18)', color: '#0ea5e9' }}>
                  <Clock size={22} />
                </div>
                <div className="kolo-stat-info">
                  <strong>{formatUptime(stats?.uptimeSec)}</strong>
                  <span>Час роботи сервера</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="kolo-admin-tab-pane">
              <div className="kolo-admin-pane-toolbar">
                <div className="kolo-search-wrap" style={{ margin: 0, flex: 1 }}>
                  <Search size={15} className="kolo-search-icon" />
                  <input
                    type="text"
                    placeholder="Пошук за нікнеймом або ім’ям..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="kolo-search-input"
                  />
                </div>
                <button
                  type="button"
                  className="kolo-btn-ghost kolo-btn-sm"
                  onClick={fetchUsers}
                  title="Оновити"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {loading ? (
                <div className="kolo-admin-empty-state">Завантаження...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="kolo-admin-empty-state">Користувачів не знайдено</div>
              ) : (
                <div className="kolo-admin-table-wrap">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const isMaster = u.id === 'u_admin_master';
                    return (
                      <div
                        key={u.id}
                        className={`kolo-admin-user-row ${u.isBanned ? 'banned' : ''}`}
                      >
                        <Avatar
                          title={u.displayName}
                          color={u.avatarColor}
                          emoji={u.avatarEmoji}
                          imageUrl={u.avatarUrl}
                          online={u.online}
                          size={40}
                        />

                        <div className="kolo-admin-user-info">
                          <div className="kolo-admin-user-name">
                            <strong>{u.displayName}</strong>
                            {u.statusEmoji && <span>{u.statusEmoji}</span>}
                            {u.role === 'admin' && (
                              <span className="kolo-role-badge admin">ADMIN</span>
                            )}
                            {u.isBanned && (
                              <span className="kolo-role-badge banned">BANNED</span>
                            )}
                            {u.online && (
                              <span className="kolo-role-badge online">ONLINE</span>
                            )}
                          </div>
                          <span className="kolo-admin-user-sub">
                            @{u.username} • {u.messagesCount} повідомлень • {u.chatsCount} чатів
                          </span>
                        </div>

                        <div className="kolo-admin-user-actions">
                          {!isMaster && (
                            <>
                              <button
                                type="button"
                                className={`kolo-btn-sm ${u.isBanned ? 'kolo-btn-secondary' : 'kolo-btn-ghost'}`}
                                style={{ color: u.isBanned ? '#34d399' : '#fb7185' }}
                                onClick={() => handleToggleBan(u.id, u.isBanned)}
                                title={u.isBanned ? 'Розблокувати' : 'Заблокувати'}
                              >
                                {u.isBanned ? <Check size={14} /> : <Ban size={14} />}
                                <span>{u.isBanned ? 'Розбан' : 'Бан'}</span>
                              </button>

                              <button
                                type="button"
                                className="kolo-btn-ghost kolo-btn-sm"
                                onClick={() => handleToggleRole(u.id)}
                                title="Перемкнути роль Admin/User"
                              >
                                <Shield size={14} />
                                <span>{u.role === 'admin' ? 'Зняти адміна' : 'Зробити адміном'}</span>
                              </button>

                              <button
                                type="button"
                                className="kolo-btn-ghost kolo-btn-sm"
                                onClick={() => {
                                  setResettingUserId(u.id);
                                  setNewPasswordInput('');
                                }}
                                title="Скинути пароль"
                              >
                                <KeyRound size={14} />
                              </button>

                              <button
                                type="button"
                                className="kolo-btn-ghost kolo-btn-sm"
                                style={{ color: '#fb7185' }}
                                onClick={() => handleDeleteUser(u.id, u.displayName)}
                                title="Видалити акаунт назавжди"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          {isMaster && (
                            <span className="kolo-master-admin-tag">MASTER ROOT</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Password Reset Sub-Modal */}
              {resettingUserId && (
                <div
                  className="kolo-admin-inline-box"
                  style={{ marginTop: 12 }}
                >
                  <label className="kolo-sub-label">
                    Новий пароль для користувача (за замовчуванням: <code>kolo123</code>):
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input
                      type="text"
                      className="kolo-input-sm"
                      placeholder="Введіть новий пароль..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="kolo-btn-primary kolo-btn-sm"
                      onClick={() => handleResetPassword(resettingUserId)}
                    >
                      Встановити
                    </button>
                    <button
                      type="button"
                      className="kolo-btn-ghost kolo-btn-sm"
                      onClick={() => setResettingUserId(null)}
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="kolo-admin-tab-pane">
              <div className="kolo-admin-pane-toolbar">
                <div className="kolo-search-wrap" style={{ margin: 0, flex: 1 }}>
                  <Search size={15} className="kolo-search-icon" />
                  <input
                    type="text"
                    placeholder="Пошук чату..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="kolo-search-input"
                  />
                </div>
                <button
                  type="button"
                  className="kolo-btn-ghost kolo-btn-sm"
                  onClick={fetchChats}
                  title="Оновити"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {filteredChats.map((c) => {
                const isGlobal = c.id === 'c_global';
                return (
                  <div key={c.id} className="kolo-admin-chat-row">
                    <Avatar
                      title={c.title}
                      color={c.avatarColor}
                      emoji={c.avatarEmoji}
                      imageUrl={c.avatarUrl}
                      size={38}
                    />
                    <div className="kolo-admin-user-info">
                      <div className="kolo-admin-user-name">
                        <strong>{c.title}</strong>
                        <span className="kolo-role-badge">
                          {c.type === 'channel' ? 'КАНАЛ' : c.type === 'group' ? 'ГРУПА' : 'DM'}
                        </span>
                        {isGlobal && (
                          <span className="kolo-role-badge admin">ГОЛОВНИЙ</span>
                        )}
                      </div>
                      <span className="kolo-admin-user-sub">
                        Учасників: {c.memberIds.length} • Повідомлень: {c.messagesCount} • @{c.handle || c.id}
                      </span>
                    </div>

                    {!isGlobal && (
                      <button
                        type="button"
                        className="kolo-btn-ghost kolo-btn-sm"
                        style={{ color: '#fb7185' }}
                        onClick={() => handleDeleteChat(c.id, c.title)}
                        title="Видалити чат"
                      >
                        <Trash2 size={15} />
                        <span>Видалити</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'broadcast' && (
            <form onSubmit={handleSendBroadcast} className="kolo-admin-tab-pane">
              <div className="kolo-admin-broadcast-banner">
                <Megaphone size={20} className="kolo-accent-icon" />
                <div>
                  <strong>Системне оголошення для всіх користувачів</strong>
                  <p>
                    Це повідомлення буде миттєво опубліковано у головному чаті з відміткою адміністрації та сповістить усіх підключених людей.
                  </p>
                </div>
              </div>

              <textarea
                rows={5}
                required
                className="kolo-composer-input"
                style={{ width: '100%', borderRadius: 12, marginTop: 10 }}
                placeholder="Введіть текст офіційного оголошення або попередження..."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={broadcasting || !broadcastText.trim()}
                  className="kolo-btn-primary"
                >
                  <Send size={16} />
                  <span>{broadcasting ? 'Надсилаємо...' : 'Розіслати оголошення'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
