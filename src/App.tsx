import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { ChatView } from './components/ChatView';
import { CustomizationStudio } from './components/CustomizationStudio';
import { ChatInfoPanel, CreateChatModal, ProfileModal } from './components/Modals';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { applyThemeToDocument, THEME_PRESETS } from './themes/presets';
import {
  AppSettings,
  AuthSession,
  Chat,
  ChatType,
  DEFAULT_APP_SETTINGS,
  Message,
  MessageAttachment,
  ThemeConfig,
  User,
} from './types/messenger';
import { playReceivedSound } from './utils/soundEffects';

const STORAGE_THEME_KEY = 'kolo_active_theme_v1';
const STORAGE_PRESETS_KEY = 'kolo_custom_presets_v1';
const STORAGE_SETTINGS_KEY = 'kolo_app_settings_v1';
const SESSION_TOKEN_KEY = 'kolo_auth_token_session';
const LOCAL_TOKEN_KEY = 'kolo_auth_token_local';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => {
    return (
      sessionStorage.getItem(SESSION_TOKEN_KEY) ||
      localStorage.getItem(LOCAL_TOKEN_KEY)
    );
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('c_global');
  const [typingByChat, setTypingByChat] = useState<Record<string, string[]>>({});

  // UI Panels
  const [studioOpen, setStudioOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [mobileChatOpen, setMobileChatOpen] = useState<boolean>(true);
  const [toastText, setToastText] = useState<string | null>(null);

  // App Settings State (Visual, Sound, E2EE, Privacy)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_APP_SETTINGS;
  });

  // Theme State
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved) return { ...THEME_PRESETS[0], ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return THEME_PRESETS[0];
  });

  const [customPresets, setCustomPresets] = useState<ThemeConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PRESETS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const socketRef = useRef<Socket | null>(null);
  const syncThemeTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Sync settings with document root and local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
    // Apply UI scale
    document.documentElement.style.fontSize = `${(settings.uiScale / 100) * 16}px`;
    if (settings.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [settings]);

  // Apply theme CSS variables and cloud-sync to user profile
  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(theme));
    } catch {
      // ignore
    }

    if (token && currentUser) {
      if (syncThemeTimerRef.current) window.clearTimeout(syncThemeTimerRef.current);
      syncThemeTimerRef.current = window.setTimeout(() => {
        fetch('/api/users/me/theme', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            savedTheme: theme,
            savedPresets: customPresets,
          }),
        }).catch(() => {});
      }, 600);
    }
  }, [theme, customPresets, token, currentUser?.id]);

  // Verify token on startup
  useEffect(() => {
    if (!token) {
      setAuthChecking(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Invalid token');
        const data = await res.json();
        const u: User = data.user;
        setCurrentUser(u);
        if (u.savedTheme) {
          setTheme({ ...THEME_PRESETS[0], ...u.savedTheme });
        }
        if (Array.isArray(u.savedPresets)) {
          setCustomPresets(u.savedPresets);
        }
      })
      .catch(() => {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(LOCAL_TOKEN_KEY);
        setToken(null);
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, [token]);

  // Bootstrap data + WebSocket connection when authenticated
  useEffect(() => {
    if (!token || !currentUser) return;

    fetch('/api/bootstrap', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsers(data.users);
        if (data.chats) setChats(data.chats);
        if (data.messages) setMessages(data.messages);
      })
      .catch((err) => console.error('Bootstrap error:', err));

    const socket = io('/', {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('auth:identify', token);
    });

    socket.on('users:update', (nextUsers: User[]) => {
      setUsers(nextUsers);
      const updatedMe = nextUsers.find((u) => u.id === currentUser.id);
      if (updatedMe) setCurrentUser(updatedMe);
    });

    socket.on('chats:update', (nextChats: Chat[]) => {
      setChats(
        nextChats.filter(
          (c) =>
            c.type !== 'dm' || c.memberIds.includes(currentUser.id)
        )
      );
    });

    socket.on('chat:created', (newChat: Chat) => {
      if (newChat.type === 'dm' && !newChat.memberIds.includes(currentUser.id)) {
        return;
      }
      setChats((prev) => {
        if (prev.some((c) => c.id === newChat.id)) return prev;
        return [newChat, ...prev];
      });
    });

    socket.on('message:new', (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.senderId !== currentUser?.id && settings.soundEnabled && settings.soundIncoming) {
        playReceivedSound(settings.soundVolume);
      }
    });

    socket.on('chat:deleted', (payload: { chatId: string }) => {
      setChats((prev) => prev.filter((c) => c.id !== payload.chatId));
      setMessages((prev) => prev.filter((m) => m.chatId !== payload.chatId));
      setActiveChatId((curr) => (curr === payload.chatId ? 'c_global' : curr));
      showToast('Групу було автоматично видалено, оскільки в ній не залишилося учасників');
    });

    socket.on('message:updated', (updated: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
    });

    socket.on(
      'message:deleted',
      (payload: { messageId: string; chatId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    );

    socket.on(
      'messages:read',
      (payload: { chatId: string; userId: string }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.chatId === payload.chatId && !m.readBy.includes(payload.userId)
              ? { ...m, readBy: [...m.readBy, payload.userId] }
              : m
          )
        );
      }
    );

    socket.on(
      'chat:typing',
      (payload: { chatId: string; userId: string; isTyping: boolean }) => {
        setTypingByChat((prev) => {
          const existing = prev[payload.chatId] || [];
          const next = payload.isTyping
            ? Array.from(new Set([...existing, payload.userId]))
            : existing.filter((id) => id !== payload.userId);
          return { ...prev, [payload.chatId]: next };
        });
      }
    );

    socket.on('admin:broadcast', (payload: { text: string }) => {
      showToast(`📢 Оголошення: ${payload.text}`);
    });

    socket.on('auth:error', (payload: { message: string }) => {
      showToast(payload.message || 'Помилка авторизації');
      handleLogout();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, currentUser?.id]);

  // Mark messages as read when viewing a chat
  useEffect(() => {
    if (!activeChatId || !currentUser) return;
    socketRef.current?.emit('message:read', {
      chatId: activeChatId,
      userId: currentUser.id,
    });
  }, [activeChatId, currentUser?.id, messages.length]);

  const activeChat = useMemo<Chat | undefined>(() => {
    return chats.find((c) => c.id === activeChatId) || chats[0];
  }, [chats, activeChatId]);

  const activeMessages = useMemo(() => {
    if (!activeChat) return [];
    return messages.filter((m) => m.chatId === activeChat.id);
  }, [messages, activeChat]);

  const handleAuthenticated = (session: AuthSession) => {
    sessionStorage.setItem(SESSION_TOKEN_KEY, session.token);
    localStorage.setItem(LOCAL_TOKEN_KEY, session.token);
    setToken(session.token);
    setCurrentUser(session.user);
    if (session.user.savedTheme) {
      setTheme({ ...THEME_PRESETS[0], ...session.user.savedTheme });
    }
    if (Array.isArray(session.user.savedPresets)) {
      setCustomPresets(session.user.savedPresets);
    }
    showToast(`Вітаємо у KOLO, ${session.user.displayName}!`);
  };

  const handleLogout = () => {
    socketRef.current?.disconnect();
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    setProfileModalOpen(false);
    showToast('Ви вийшли з акаунту');
  };

  const uploadFileToServer = async (file: File) => {
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
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  };

  const handleSendMessage = (
    text: string,
    replyToId?: string,
    attachment?: MessageAttachment
  ) => {
    if (!activeChat || !currentUser) return;
    socketRef.current?.emit('message:send', {
      chatId: activeChat.id,
      senderId: currentUser.id,
      text,
      replyToId,
      attachment,
    });
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    socketRef.current?.emit('message:edit', { messageId, text: newText });
  };

  const handleDeleteMessage = (messageId: string) => {
    socketRef.current?.emit('message:delete', { messageId });
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    socketRef.current?.emit('message:react', {
      messageId,
      userId: currentUser.id,
      emoji,
    });
  };

  const handlePinMessage = (messageId?: string) => {
    if (!activeChat) return;
    socketRef.current?.emit('message:pin', {
      chatId: activeChat.id,
      messageId,
    });
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (!activeChat || !currentUser) return;
    socketRef.current?.emit('chat:typing', {
      chatId: activeChat.id,
      userId: currentUser.id,
      isTyping,
    });
  };

  const handleSavePreset = (preset: ThemeConfig) => {
    const next = [preset, ...customPresets];
    setCustomPresets(next);
    setTheme(preset);
    try {
      localStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    showToast(`Пресет «${preset.name}» збережено у вашому акаунті!`);
  };

  const handleShareThemeInChat = (themeToShare: ThemeConfig) => {
    if (!activeChat) return;
    handleSendMessage(
      `Ділюся своєю кастомною темою «${themeToShare.name}» — натискайте «Приміряти тему»! ✨`,
      undefined,
      {
        type: 'theme',
        name: themeToShare.name,
        themeData: themeToShare,
      }
    );
    showToast(`Тему надіслано в чат «${activeChat.title}»!`);
  };

  const handleApplySharedTheme = (sharedTheme: ThemeConfig) => {
    setTheme(sharedTheme);
    showToast(`Тему «${sharedTheme.name}» застосовано!`);
  };

  const handleUploadMediaWallpaper = async (file: File) => {
    try {
      const uploaded = await uploadFileToServer(file);
      const isVideo = uploaded.mimeType.startsWith('video/');
      setTheme((prev) => ({
        ...prev,
        bgMode: 'media',
        bgMediaUrl: uploaded.url,
        bgMediaType: isVideo ? 'video' : 'image',
      }));
      showToast('Живі шпалери встановлено!');
    } catch {
      showToast('Не вдалося завантажити шпалери');
    }
  };

  const handleStartDmWithUser = async (targetUser: User) => {
    if (!currentUser) return;
    const existing = chats.find(
      (c) =>
        c.type === 'dm' &&
        c.memberIds.includes(currentUser.id) &&
        c.memberIds.includes(targetUser.id)
    );
    if (existing) {
      setActiveChatId(existing.id);
      return;
    }

    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'dm',
        title: targetUser.displayName,
        handle: targetUser.username,
        description: targetUser.bio,
        avatarColor: targetUser.avatarColor,
        avatarEmoji: targetUser.avatarEmoji,
        memberIds: [currentUser.id, targetUser.id],
        ownerId: currentUser.id,
      }),
    });
    const created: Chat = await res.json();
    setChats((prev) =>
      prev.some((c) => c.id === created.id) ? prev : [created, ...prev]
    );
    setActiveChatId(created.id);
  };

  const handleCreateChat = async (payload: {
    type: ChatType;
    title: string;
    handle: string;
    description: string;
    avatarColor: string;
    avatarEmoji: string;
    memberIds: string[];
    isPublic: boolean;
  }) => {
    if (!currentUser) return;
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...payload,
        ownerId: currentUser.id,
      }),
    });
    const created: Chat = await res.json();
    setActiveChatId(created.id);
    showToast(`Створено «${created.title}»!`);
  };

  const handleJoinChat = async (chatId: string) => {
    if (!token) return;
    const res = await fetch(`/api/chats/${chatId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      showToast('Ви приєдналися до спільноти!');
    }
  };

  const handleLeaveChat = async (chatId: string) => {
    if (!token) return;
    const res = await fetch(`/api/chats/${chatId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setInfoOpen(false);
      showToast('Ви залишили чат');
    }
  };

  const handleUpdateProfile = async (payload: {
    displayName: string;
    username: string;
    bio: string;
    avatarColor: string;
    avatarEmoji?: string;
    avatarUrl?: string;
    statusEmoji?: string;
    newPassword?: string;
  }) => {
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Помилка оновлення профілю');
    }
    setCurrentUser(data.user);
    showToast('Профіль успішно оновлено!');
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Налаштування збережено');
  };

  const handleClearLocalCache = () => {
    try {
      localStorage.removeItem(STORAGE_SETTINGS_KEY);
      localStorage.removeItem(STORAGE_THEME_KEY);
      localStorage.removeItem(STORAGE_PRESETS_KEY);
      sessionStorage.clear();
    } catch {
      // ignore
    }
    showToast('Кеш успішно очищено! Перезавантаження...');
    setTimeout(() => window.location.reload(), 1000);
  };

  if (authChecking) {
    return null;
  }

  if (!token || !currentUser) {
    return (
      <>
        <AuthScreen
          theme={theme}
          onThemeChange={setTheme}
          onAuthenticated={handleAuthenticated}
        />
        {toastText && <div className="kolo-toast">{toastText}</div>}
      </>
    );
  }

  return (
    <div
      className={`kolo-app-shell ${
        theme.sidebarPosition === 'right' ? 'sidebar-right' : 'sidebar-left'
      } ${mobileChatOpen ? 'mobile-view-chat' : 'mobile-view-list'}`}
    >
      <Sidebar
        currentUser={currentUser}
        users={users}
        chats={chats}
        messages={messages}
        activeChatId={activeChat?.id || ''}
        typingByChat={typingByChat}
        theme={theme}
        studioOpen={studioOpen}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setMobileChatOpen(true);
        }}
        onStartDmWithUser={(u) => {
          handleStartDmWithUser(u);
          setMobileChatOpen(true);
        }}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        onLogout={handleLogout}
        onToggleStudio={() => setStudioOpen((v) => !v)}
      />

      {activeChat && (
        <ChatView
          chat={activeChat}
          currentUser={currentUser}
          users={users}
          messages={activeMessages}
          typingUserIds={typingByChat[activeChat.id] || []}
          theme={theme}
          settings={settings}
          studioOpen={studioOpen}
          infoOpen={infoOpen}
          onUpdateSettings={handleUpdateSettings}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onReactMessage={handleReactMessage}
          onPinMessage={handlePinMessage}
          onJoinChat={handleJoinChat}
          onTypingChange={handleTypingChange}
          onApplySharedTheme={handleApplySharedTheme}
          onUploadFile={uploadFileToServer}
          onToggleStudio={() => setStudioOpen((v) => !v)}
          onToggleInfo={() => setInfoOpen((v) => !v)}
          onBackToList={() => setMobileChatOpen(false)}
        />
      )}

      {infoOpen && activeChat && (
        <ChatInfoPanel
          chat={activeChat}
          currentUser={currentUser}
          users={users}
          messages={activeMessages}
          theme={theme}
          onStartDmWithUser={handleStartDmWithUser}
          onApplySharedTheme={handleApplySharedTheme}
          onLeaveChat={handleLeaveChat}
          onClose={() => setInfoOpen(false)}
        />
      )}

      {studioOpen && (
        <CustomizationStudio
          theme={theme}
          customPresets={customPresets}
          onChange={setTheme}
          onSavePreset={handleSavePreset}
          onShareThemeInChat={handleShareThemeInChat}
          onUploadMediaWallpaper={handleUploadMediaWallpaper}
          onClose={() => setStudioOpen(false)}
        />
      )}

      {createModalOpen && (
        <CreateChatModal
          currentUser={currentUser}
          users={users}
          onCreateChat={handleCreateChat}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      {profileModalOpen && (
        <ProfileModal
          currentUser={currentUser}
          theme={theme}
          onUpdateProfile={handleUpdateProfile}
          onUploadFile={uploadFileToServer}
          onLogout={handleLogout}
          onClose={() => setProfileModalOpen(false)}
        />
      )}

      {settingsModalOpen && (
        <SettingsModal
          settings={settings}
          theme={theme}
          onUpdateSettings={handleUpdateSettings}
          onOpenStudio={() => {
            setSettingsModalOpen(false);
            setStudioOpen(true);
          }}
          onClearLocalCache={handleClearLocalCache}
          onClose={() => setSettingsModalOpen(false)}
        />
      )}

      {adminPanelOpen && currentUser.role === 'admin' && token && (
        <AdminPanel
          token={token}
          currentUser={currentUser}
          onClose={() => setAdminPanelOpen(false)}
          onShowToast={showToast}
        />
      )}

      {toastText && <div className="kolo-toast">{toastText}</div>}
    </div>
  );
};
