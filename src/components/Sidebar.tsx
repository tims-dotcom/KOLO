import React, { useMemo, useState } from 'react';
import {
  LogOut,
  Megaphone,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { Chat, ChatType, Message, ThemeConfig, User } from '../types/messenger';
import { Avatar } from './Avatar';

interface SidebarProps {
  currentUser: User;
  users: User[];
  chats: Chat[];
  messages: Message[];
  activeChatId: string;
  typingByChat: Record<string, string[]>;
  theme: ThemeConfig;
  studioOpen: boolean;
  onSelectChat: (chatId: string) => void;
  onStartDmWithUser: (targetUser: User) => void;
  onOpenCreateModal: () => void;
  onOpenProfileModal: () => void;
  onOpenSettingsModal?: () => void;
  onOpenAdminPanel?: () => void;
  onLockApp?: () => void;
  isAppLockConfigured?: boolean;
  onLogout: () => void;
  onToggleStudio: () => void;
}

type FolderFilter = 'all' | ChatType;

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  users,
  chats,
  messages,
  activeChatId,
  typingByChat,
  theme,
  studioOpen,
  onSelectChat,
  onStartDmWithUser,
  onOpenCreateModal,
  onOpenProfileModal,
  onOpenSettingsModal,
  onOpenAdminPanel,
  onLockApp,
  isAppLockConfigured,
  onLogout,
  onToggleStudio,
}) => {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState<FolderFilter>('all');

  const getChatDisplay = (chat: Chat) => {
    if (chat.type === 'dm') {
      const otherId =
        chat.memberIds.find((id) => id !== currentUser.id) || chat.memberIds[0];
      const other = users.find((u) => u.id === otherId);
      if (other) {
        return {
          title: `${other.displayName} ${other.statusEmoji || ''}`.trim(),
          color: other.avatarColor,
          emoji: other.avatarEmoji,
          imageUrl: other.avatarUrl,
          online: other.online,
          isBot: other.isBot,
          subtitle: other.username ? `@${other.username}` : '',
        };
      }
    }
    return {
      title: chat.title,
      color: chat.avatarColor,
      emoji: chat.avatarEmoji,
      imageUrl: chat.avatarUrl,
      online: false,
      isBot: false,
      subtitle: chat.handle ? `@${chat.handle}` : '',
    };
  };

  const sortedChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chats
      .filter((c) => {
        // When not searching, show chats user is a member of (or public ones)
        if (!q && c.type === 'dm' && !c.memberIds.includes(currentUser.id)) {
          return false;
        }
        if (folder !== 'all' && c.type !== folder) return false;
        if (!q) return true;
        const disp = getChatDisplay(c);
        return (
          disp.title.toLowerCase().includes(q) ||
          disp.subtitle.toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const lastA =
          messages.filter((m) => m.chatId === a.id).slice(-1)[0]?.createdAt ||
          a.createdAt;
        const lastB =
          messages.filter((m) => m.chatId === b.id).slice(-1)[0]?.createdAt ||
          b.createdAt;
        return new Date(lastB).getTime() - new Date(lastA).getTime();
      });
  }, [chats, messages, folder, search, currentUser.id, users]);

  const matchingUsers = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^@/, '');
    if (!q) return [];
    return users.filter(
      (u) =>
        u.id !== currentUser.id &&
        (u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q))
    );
  }, [users, search, currentUser.id]);

  const formatShortTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className={`kolo-sidebar ${theme.compactSidebar ? 'compact' : ''}`}>
      {/* Brand + Actions Header */}
      <div className="kolo-sidebar-top">
        <div className="kolo-brand">
          <div className="kolo-brand-logo">⚡</div>
          <div>
            <h1>KOLO</h1>
            <span>Custom Web Messenger</span>
          </div>
        </div>

        <div className="kolo-sidebar-actions">
          {currentUser.role === 'admin' && onOpenAdminPanel && (
            <button
              type="button"
              className="kolo-admin-trigger"
              onClick={onOpenAdminPanel}
              title="Відкрити Адмін Панель"
            >
              <Shield size={16} />
              <span>Адмінка</span>
            </button>
          )}
          <button
            type="button"
            className={`kolo-studio-trigger ${studioOpen ? 'active' : ''}`}
            onClick={onToggleStudio}
            title="Відкрити Студію Кастомізації"
          >
            <Palette size={17} />
            <span>Кастомізація</span>
          </button>
          <button
            type="button"
            className="kolo-icon-btn"
            onClick={onOpenCreateModal}
            title="Створити групу або канал"
          >
            <Plus size={19} />
          </button>
          {onOpenSettingsModal && (
            <button
              type="button"
              className="kolo-icon-btn"
              onClick={onOpenSettingsModal}
              title="Налаштування додатку"
            >
              <Settings size={18} />
            </button>
          )}
          {isAppLockConfigured && onLockApp && (
            <button
              type="button"
              className="kolo-icon-btn"
              onClick={onLockApp}
              title="Заблокувати месенджер (PIN-код)"
              style={{ color: '#f59e0b' }}
            >
              <Lock size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="kolo-search-wrap">
        <Search size={16} className="kolo-search-icon" />
        <input
          type="text"
          placeholder="Пошук людей (@username), груп, каналів..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="kolo-search-input"
        />
        {search && (
          <button
            type="button"
            className="kolo-search-clear"
            onClick={() => setSearch('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Folder Tabs */}
      <div className="kolo-folder-tabs">
        {(
          [
            { id: 'all', label: 'Усі' },
            { id: 'dm', label: 'Особисті' },
            { id: 'group', label: 'Групи' },
            { id: 'channel', label: 'Канали' },
          ] as { id: FolderFilter; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`kolo-folder-tab ${folder === tab.id ? 'active' : ''}`}
            onClick={() => setFolder(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className="kolo-chat-list">
        {sortedChats.map((chat) => {
          const disp = getChatDisplay(chat);
          const chatMsgs = messages.filter((m) => m.chatId === chat.id);
          const lastMsg = chatMsgs[chatMsgs.length - 1];
          const unreadCount = chatMsgs.filter(
            (m) =>
              m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)
          ).length;
          const typingIds = (typingByChat[chat.id] || []).filter(
            (id) => id !== currentUser.id
          );
          const isActive = chat.id === activeChatId;
          const isMember = chat.memberIds.includes(currentUser.id);

          let previewText = 'Немає повідомлень';
          if (typingIds.length > 0) {
            const typer = users.find((u) => u.id === typingIds[0]);
            previewText = `${
              typer ? typer.displayName.split(' ')[0] : 'Хтось'
            } друкує...`;
          } else if (lastMsg) {
            const sender = users.find((u) => u.id === lastMsg.senderId);
            const prefix =
              lastMsg.isSystem
                ? ''
                : chat.type === 'group' && sender
                ? `${
                    sender.id === currentUser.id
                      ? 'Ви'
                      : sender.displayName.split(' ')[0]
                  }: `
                : lastMsg.senderId === currentUser.id
                ? 'Ви: '
                : '';

            if (lastMsg.attachment?.type === 'theme') {
              previewText = `${prefix}🎨 Тема «${
                lastMsg.attachment.name || 'Custom'
              }»`;
            } else if (lastMsg.attachment?.type === 'voice') {
              previewText = `${prefix}🎙️ Голосове повідомлення`;
            } else if (lastMsg.attachment?.type === 'image') {
              previewText = `${prefix}🖼️ Зображення ${lastMsg.text || ''}`;
            } else if (lastMsg.attachment?.type === 'file') {
              previewText = `${prefix}📎 ${lastMsg.attachment.name || 'Файл'}`;
            } else {
              previewText = `${prefix}${lastMsg.text}`;
            }
          }

          return (
            <button
              key={chat.id}
              type="button"
              className={`kolo-chat-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.id)}
            >
              <Avatar
                title={disp.title}
                color={disp.color}
                emoji={disp.emoji}
                imageUrl={disp.imageUrl}
                online={disp.online}
                shape={theme.avatarShape}
                size={theme.compactSidebar ? 38 : 46}
              />

              <div className="kolo-chat-item-body">
                <div className="kolo-chat-item-top">
                  <span className="kolo-chat-item-title">
                    {chat.type === 'group' && (
                      <Users size={13} className="kolo-type-icon" />
                    )}
                    {chat.type === 'channel' && (
                      <Megaphone size={13} className="kolo-type-icon" />
                    )}
                    {disp.title}
                    {disp.isBot && <span className="kolo-bot-tag">BOT</span>}
                  </span>
                  <span className="kolo-chat-item-time">
                    {formatShortTime(lastMsg?.createdAt || chat.createdAt)}
                  </span>
                </div>

                <div className="kolo-chat-item-bottom">
                  <span
                    className={`kolo-chat-item-preview ${
                      typingIds.length > 0 ? 'typing' : ''
                    }`}
                  >
                    {previewText}
                  </span>
                  {!isMember ? (
                    <span className="kolo-bot-tag">ВІДКРИТИЙ</span>
                  ) : (
                    unreadCount > 0 && (
                      <span className="kolo-unread-badge">{unreadCount}</span>
                    )
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {matchingUsers.length > 0 && (
          <div className="kolo-global-users-section">
            <div className="kolo-section-divider">Знайдені користувачі KOLO</div>
            {matchingUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                className="kolo-chat-item"
                onClick={() => {
                  onStartDmWithUser(u);
                  setSearch('');
                }}
              >
                <Avatar
                  title={u.displayName}
                  color={u.avatarColor}
                  emoji={u.avatarEmoji}
                  imageUrl={u.avatarUrl}
                  online={u.online}
                  shape={theme.avatarShape}
                  size={40}
                />
                <div className="kolo-chat-item-body">
                  <div className="kolo-chat-item-top">
                    <span className="kolo-chat-item-title">
                      {u.displayName} {u.statusEmoji || ''}
                    </span>
                  </div>
                  <div className="kolo-chat-item-bottom">
                    <span className="kolo-chat-item-preview">
                      @{u.username} • Написати повідомлення
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Current User Bar */}
      <div className="kolo-sidebar-footer">
        <div className="kolo-current-user" onClick={onOpenProfileModal}>
          <Avatar
            title={currentUser.displayName}
            color={currentUser.avatarColor}
            emoji={currentUser.avatarEmoji}
            imageUrl={currentUser.avatarUrl}
            online={true}
            shape={theme.avatarShape}
            size={38}
          />
          <div className="kolo-current-user-info">
            <strong>
              {currentUser.displayName} {currentUser.statusEmoji || ''}
            </strong>
            <span>@{currentUser.username} • Профіль</span>
          </div>
          {onOpenSettingsModal ? (
            <button
              type="button"
              className="kolo-icon-btn"
              style={{ width: 28, height: 28 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettingsModal();
              }}
              title="Налаштування додатку"
            >
              <Settings size={15} />
            </button>
          ) : (
            <Settings size={16} className="kolo-switch-icon" />
          )}
          <button
            type="button"
            className="kolo-icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            title="Вийти з акаунту"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
