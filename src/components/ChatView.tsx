import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  CornerUpLeft,
  Download,
  Edit3,
  FileText,
  Info,
  Lock,
  Mic,
  Palette,
  Paperclip,
  Pin,
  Search,
  Send,
  Shield,
  Smile,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { AppSettings, Chat, Message, MessageAttachment, ThemeConfig, User } from '../types/messenger';
import { LiveVoiceRecorder } from '../utils/audioRecorder';
import { decryptE2EEMessage, encryptE2EEMessage, isEncryptedMessage } from '../utils/cryptoE2EE';
import { playSentSound } from '../utils/soundEffects';
import { Avatar } from './Avatar';
import { LiveBackground } from './LiveBackground';
import { SafetyVerificationModal } from './SafetyVerificationModal';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface ChatViewProps {
  chat: Chat;
  currentUser: User;
  users: User[];
  messages: Message[];
  typingUserIds: string[];
  theme: ThemeConfig;
  settings?: AppSettings;
  studioOpen: boolean;
  infoOpen: boolean;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
  onSendMessage: (
    text: string,
    replyToId?: string,
    attachment?: MessageAttachment
  ) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onPinMessage: (messageId?: string) => void;
  onJoinChat: (chatId: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  onApplySharedTheme: (sharedTheme: ThemeConfig) => void;
  onUploadFile: (file: File) => Promise<{
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
  onToggleStudio: () => void;
  onToggleInfo: () => void;
  onBackToList?: () => void;
}

const QUICK_REACTIONS = ['🔥', '❤️', '⚡', '🚀', '🎉', '👍', '👀'];
const EMOJI_PALETTE = [
  '😀', '😂', '🥹', '😍', '🤩', '😎', '🥳', '🤔',
  '🔥', '⚡', '✨', '💜', '💙', '💚', '🧡', '❤️',
  '🚀', '🌌', '🎨', '🎧', '💻', '🤖', '👏', '🙌',
];

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  currentUser,
  users,
  messages,
  typingUserIds,
  theme,
  settings,
  studioOpen,
  infoOpen,
  onUpdateSettings,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
  onPinMessage,
  onJoinChat,
  onTypingChange,
  onApplySharedTheme,
  onUploadFile,
  onToggleStudio,
  onToggleInfo,
  onBackToList,
}) => {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);

  // E2EE Decrypted messages cache (in-memory only, zero server exposure)
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const customPassphrase = settings?.customChatKeys?.[chat.id];

  useEffect(() => {
    let isCancelled = false;
    const decryptAll = async () => {
      const updates: Record<string, string> = {};
      let hasNew = false;
      for (const m of messages) {
        if (m.text && isEncryptedMessage(m.text)) {
          if (!decryptedMap[m.id]) {
            const dec = await decryptE2EEMessage(m.text, chat.id, customPassphrase);
            updates[m.id] = dec;
            hasNew = true;
          }
        }
      }
      if (hasNew && !isCancelled) {
        setDecryptedMap((prev) => ({ ...prev, ...updates }));
      }
    };
    decryptAll();
    return () => {
      isCancelled = true;
    };
  }, [messages, chat.id, customPassphrase]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>(
    Array.from({ length: 28 }, () => 0.1)
  );
  const [micError, setMicError] = useState<string | null>(null);
  const voiceRecorderRef = useRef<LiveVoiceRecorder | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const isMember = chat.memberIds.includes(currentUser.id);

  // Determine chat display metadata
  const chatHeaderInfo = useMemo(() => {
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
          statusText: other.online
            ? `в мережі • @${other.username}`
            : `був(ла) нещодавно • @${other.username}`,
        };
      }
    }
    const count = chat.memberIds.length;
    const onlineCount = chat.memberIds.filter(
      (id) => users.find((u) => u.id === id)?.online
    ).length;
    return {
      title: chat.title,
      color: chat.avatarColor,
      emoji: chat.avatarEmoji,
      imageUrl: chat.avatarUrl,
      online: false,
      statusText:
        chat.type === 'channel'
          ? `${count} підписників`
          : `${count} учасників, ${onlineCount} в мережі`,
    };
  }, [chat, currentUser.id, users]);

  const pinnedMessage = useMemo(
    () => messages.find((m) => m.id === chat.pinnedMessageId),
    [messages, chat.pinnedMessageId]
  );

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        (m.attachment?.name || '').toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, chat.id]);

  // Clear reply/edit on chat switch
  useEffect(() => {
    setReplyTo(null);
    setEditingMsg(null);
    setActiveMenuMsgId(null);
    setSearchOpen(false);
    setSearchQuery('');
  }, [chat.id]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 1800);
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    onTypingChange(val.trim().length > 0);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      onTypingChange(false);
    }, 1800);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const shouldEncrypt = settings ? settings.e2eeEnabled : true;
    const finalPayload = shouldEncrypt
      ? await encryptE2EEMessage(trimmed, chat.id, customPassphrase)
      : trimmed;

    if (editingMsg) {
      onEditMessage(editingMsg.id, finalPayload);
      setEditingMsg(null);
    } else {
      onSendMessage(finalPayload, replyTo?.id);
      if (settings?.soundEnabled && settings?.soundOutgoing) {
        playSentSound(settings.soundVolume);
      }
      setReplyTo(null);
    }
    setText('');
    onTypingChange(false);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const enterSends = settings?.sendOnEnter !== false;
    if (enterSends) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    } else {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const uploaded = await onUploadFile(file);
    const isImage = uploaded.mimeType.startsWith('image/');
    const trimmed = text.trim();
    const shouldEncrypt = settings ? settings.e2eeEnabled : true;
    const finalPayload = trimmed && shouldEncrypt
      ? await encryptE2EEMessage(trimmed, chat.id, customPassphrase)
      : trimmed;

    onSendMessage(finalPayload, replyTo?.id, {
      type: isImage ? 'image' : 'file',
      url: uploaded.url,
      name: uploaded.name,
      size: uploaded.size,
      mimeType: uploaded.mimeType,
    });
    if (settings?.soundEnabled && settings?.soundOutgoing) {
      playSentSound(settings.soundVolume);
    }
    setText('');
    setReplyTo(null);
  };

  // Voice recording handlers (real-time Web Audio API + 16-bit PCM WAV)
  const startVoiceRecording = async () => {
    setMicError(null);
    try {
      const recorder = new LiveVoiceRecorder();
      voiceRecorderRef.current = recorder;
      setRecordSeconds(0);
      setMicVolume(0);
      setLiveWave(Array.from({ length: 28 }, () => 0.1));

      await recorder.start((bars, volume, elapsedSec) => {
        setLiveWave(bars);
        setMicVolume(volume);
        setRecordSeconds(Math.floor(elapsedSec));
      });
      setIsRecording(true);
    } catch (err: any) {
      voiceRecorderRef.current = null;
      setIsRecording(false);
      setMicError(
        err?.message ||
          'Не вдалося увімкнути мікрофон. Перевірте дозвіл або відкрийте через HTTPS-посилання.'
      );
      setTimeout(() => setMicError(null), 5000);
    }
  };

  const cancelVoiceRecording = () => {
    voiceRecorderRef.current?.cancel();
    voiceRecorderRef.current = null;
    setIsRecording(false);
    setRecordSeconds(0);
    setMicVolume(0);
  };

  const finishVoiceRecording = async () => {
    const recorder = voiceRecorderRef.current;
    voiceRecorderRef.current = null;
    setIsRecording(false);
    setMicVolume(0);

    if (!recorder) return;

    try {
      const { wavBlob, duration, waveform } = recorder.stop();
      const file = new File([wavBlob], `voice_${Date.now()}.wav`, {
        type: 'audio/wav',
      });
      const uploaded = await onUploadFile(file);
      onSendMessage('', replyTo?.id, {
        type: 'voice',
        url: uploaded.url,
        name: 'Голосове повідомлення',
        duration,
        waveform,
      });
      setReplyTo(null);
    } catch {
      setMicError('Помилка завантаження голосового повідомлення');
      setTimeout(() => setMicError(null), 4000);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '12 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings?.timeFormat24h === false,
    });
  };

  const typingNames = typingUserIds
    .filter((id) => id !== currentUser.id)
    .map(
      (id) =>
        users.find((u) => u.id === id)?.displayName.split(' ')[0] || 'Хтось'
    );

  return (
    <main className="kolo-chat-main" onClick={() => setActiveMenuMsgId(null)}>
      {/* Live Shader / Canvas / Pattern / Video Wallpaper */}
      <LiveBackground theme={theme} />

      {/* Glassmorphic Header */}
      <header className="kolo-chat-header">
        <div className="kolo-chat-header-left" onClick={onToggleInfo}>
          {onBackToList && (
            <button
              type="button"
              className="kolo-icon-btn kolo-mobile-back-btn"
              onClick={(e) => {
                e.stopPropagation();
                onBackToList();
              }}
              title="Назад до списку чатів"
            >
              <ArrowLeft size={19} />
            </button>
          )}
          <Avatar
            title={chatHeaderInfo.title}
            color={chatHeaderInfo.color}
            emoji={chatHeaderInfo.emoji}
            imageUrl={chatHeaderInfo.imageUrl}
            online={chatHeaderInfo.online}
            shape={theme.avatarShape}
            size={42}
          />
          <div className="kolo-chat-header-meta">
            <h2>{chatHeaderInfo.title}</h2>
            <span className={typingNames.length > 0 ? 'kolo-typing-status' : ''}>
              {typingNames.length > 0
                ? `${typingNames.join(', ')} друкує...`
                : chatHeaderInfo.statusText}
            </span>
          </div>
        </div>

        <div className="kolo-chat-header-actions">
          <button
            type="button"
            className="kolo-e2ee-header-pill"
            onClick={() => setSafetyModalOpen(true)}
            title="Наскрізне шифрування (E2EE) активне • Натисніть для перевірки коду безпеки"
          >
            <Shield size={14} className="kolo-e2ee-icon" />
            <span>E2EE Захищено</span>
          </button>
          <button
            type="button"
            className={`kolo-icon-btn ${searchOpen ? 'active' : ''}`}
            onClick={() => setSearchOpen((v) => !v)}
            title="Пошук у чаті"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className={`kolo-icon-btn ${studioOpen ? 'active' : ''}`}
            onClick={onToggleStudio}
            title="Студія Кастомізації KOLO"
          >
            <Palette size={18} />
          </button>
          <button
            type="button"
            className={`kolo-icon-btn ${infoOpen ? 'active' : ''}`}
            onClick={onToggleInfo}
            title="Інформація про чат"
          >
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Search in chat bar */}
      {searchOpen && (
        <div className="kolo-chat-search-bar">
          <Search size={15} />
          <input
            type="text"
            autoFocus
            placeholder="Знайти повідомлення в цьому чаті..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Pinned message bar */}
      {pinnedMessage && (
        <div
          className="kolo-pinned-bar"
          onClick={() => scrollToMessage(pinnedMessage.id)}
        >
          <Pin size={15} className="kolo-pin-icon" />
          <div className="kolo-pinned-body">
            <strong>Закріплене повідомлення</strong>
            <span>
              {pinnedMessage.text ||
                (pinnedMessage.attachment?.type === 'theme'
                  ? `🎨 Тема «${pinnedMessage.attachment.name}»`
                  : 'Вкладення')}
            </span>
          </div>
          <button
            type="button"
            className="kolo-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              onPinMessage(pinnedMessage.id);
            }}
            title="Відкріпити"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className={`kolo-messages-viewport ${settings?.compactMessageList ? 'compact-messages' : ''}`}>
        <div className="kolo-date-pill">Сьогодні • Захищено KOLO Realtime (E2EE)</div>

        {filteredMessages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="kolo-date-pill">
                {msg.text}
              </div>
            );
          }

          const isOwn = msg.senderId === currentUser.id;
          const sender = users.find((u) => u.id === msg.senderId);
          const repliedMsg = msg.replyToId
            ? messages.find((m) => m.id === msg.replyToId)
            : undefined;
          const repliedSender = repliedMsg
            ? users.find((u) => u.id === repliedMsg.senderId)
            : undefined;
          const showMenu = activeMenuMsgId === msg.id;

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`kolo-msg-row ${isOwn ? 'own' : 'incoming'} anim-${
                theme.bubbleAnimation
              } ${highlightedMsgId === msg.id ? 'highlighted' : ''}`}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveMenuMsgId(showMenu ? null : msg.id);
              }}
            >
              {!isOwn && chat.type !== 'dm' && sender && settings?.showAvatarsInChat !== false && (
                <div className="kolo-msg-avatar">
                  <Avatar
                    title={sender.displayName}
                    color={sender.avatarColor}
                    emoji={sender.avatarEmoji}
                    imageUrl={sender.avatarUrl}
                    shape={theme.avatarShape}
                    size={34}
                  />
                </div>
              )}

              <div
                className={`kolo-bubble ${isOwn ? 'own' : 'incoming'} tail-${
                  theme.bubbleTail
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuMsgId(showMenu ? null : msg.id);
                }}
              >
                {/* Sender name inside group/channel */}
                {!isOwn && chat.type !== 'dm' && sender && (
                  <div
                    className="kolo-bubble-sender"
                    style={{ color: sender.avatarColor }}
                  >
                    {sender.displayName} {sender.statusEmoji || ''}
                    {sender.isBot && <span className="kolo-bot-tag">BOT</span>}
                  </div>
                )}

                {/* Replied message quote */}
                {repliedMsg && (
                  <div
                    className="kolo-reply-quote"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToMessage(repliedMsg.id);
                    }}
                  >
                    <strong>{repliedSender?.displayName || 'Повідомлення'}</strong>
                    <span>
                      {repliedMsg.text ||
                        (repliedMsg.attachment?.type === 'theme'
                          ? `🎨 Тема «${repliedMsg.attachment.name}»`
                          : 'Медіа-вкладення')}
                    </span>
                  </div>
                )}

                {/* Attachment: Image */}
                {msg.attachment?.type === 'image' && msg.attachment.url && (
                  <div
                    className="kolo-attachment-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImage(msg.attachment!.url!);
                    }}
                  >
                    <img
                      src={msg.attachment.url}
                      alt={msg.attachment.name || 'Image'}
                    />
                  </div>
                )}

                {/* Attachment: File */}
                {msg.attachment?.type === 'file' && (
                  <a
                    href={msg.attachment.url || '#'}
                    download={msg.attachment.name}
                    className="kolo-attachment-file"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="kolo-file-icon">
                      <FileText size={20} />
                    </div>
                    <div className="kolo-file-info">
                      <strong>{msg.attachment.name || 'Документ'}</strong>
                      <span>
                        {formatFileSize(msg.attachment.size)} • Натисніть, щоб
                        завантажити
                      </span>
                    </div>
                    <Download size={16} />
                  </a>
                )}

                {/* Attachment: Voice */}
                {msg.attachment?.type === 'voice' && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <VoiceMessagePlayer
                      url={msg.attachment.url}
                      duration={msg.attachment.duration}
                      waveform={msg.attachment.waveform}
                      isOwn={isOwn}
                    />
                  </div>
                )}

                {/* Attachment: Interactive Theme Card */}
                {msg.attachment?.type === 'theme' && msg.attachment.themeData && (
                  <div
                    className="kolo-theme-card-attachment"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className="kolo-theme-card-preview"
                      style={{
                        background: `linear-gradient(135deg, ${msg.attachment.themeData.bgPrimary}, ${msg.attachment.themeData.bgColor1}, ${msg.attachment.themeData.bgColor2})`,
                      }}
                    >
                      <div
                        className="kolo-theme-card-mock-in"
                        style={{
                          background: msg.attachment.themeData.inBubbleColor1,
                          borderRadius: msg.attachment.themeData.bubbleRadius,
                        }}
                      >
                        Привіт з нової теми ✨
                      </div>
                      <div
                        className="kolo-theme-card-mock-out"
                        style={{
                          background: `linear-gradient(135deg, ${msg.attachment.themeData.outBubbleColor1}, ${msg.attachment.themeData.outBubbleColor2})`,
                          borderRadius: msg.attachment.themeData.bubbleRadius,
                        }}
                      >
                        Виглядає вогонь! 🔥
                      </div>
                    </div>
                    <div className="kolo-theme-card-footer">
                      <div>
                        <strong>{msg.attachment.themeData.name}</strong>
                        <span>
                          Фон: {msg.attachment.themeData.bgMode.toUpperCase()} •
                          Шрифт: {msg.attachment.themeData.fontFamily}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="kolo-btn-primary kolo-btn-sm"
                        onClick={() =>
                          onApplySharedTheme(msg.attachment!.themeData!)
                        }
                      >
                        <Sparkles size={14} />
                        <span>Приміряти тему</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Text */}
                {msg.text && (
                  <div className="kolo-bubble-text">
                    {isEncryptedMessage(msg.text)
                      ? (decryptedMap[msg.id] ?? '🔒 Розшифрування...')
                      : msg.text}
                  </div>
                )}

                {/* Reactions + Meta Footer */}
                <div className="kolo-bubble-footer">
                  {msg.reactions.length > 0 && (
                    <div
                      className="kolo-reactions-row"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {msg.reactions.map((r) => {
                        const mine = r.userIds.includes(currentUser.id);
                        return (
                          <button
                            key={r.emoji}
                            type="button"
                            className={`kolo-reaction-pill ${mine ? 'mine' : ''}`}
                            onClick={() => onReactMessage(msg.id, r.emoji)}
                          >
                            <span>{r.emoji}</span>
                            <small>{r.userIds.length}</small>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="kolo-bubble-meta">
                    {isEncryptedMessage(msg.text) && (
                      <span className="kolo-msg-e2ee-tag" title="Наскрізне шифрування AES-256-GCM (Zero-Knowledge)">
                        <Lock size={11} />
                      </span>
                    )}
                    {msg.editedAt && <span className="kolo-edited-tag">ред.</span>}
                    <span className="kolo-msg-time">{formatTime(msg.createdAt)}</span>
                    {isOwn && (
                      <span className="kolo-read-ticks">
                        {msg.readBy.length > 1 ? (
                          <CheckCheck size={14} />
                        ) : (
                          <Check size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Context / Click Popover Menu for Reactions & Actions */}
                {showMenu && (
                  <div
                    className={`kolo-msg-popover ${isOwn ? 'own' : 'incoming'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="kolo-quick-reactions">
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            onReactMessage(msg.id, emoji);
                            setActiveMenuMsgId(null);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="kolo-popover-actions">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(msg);
                          setEditingMsg(null);
                          setActiveMenuMsgId(null);
                        }}
                      >
                        <CornerUpLeft size={14} />
                        <span>Відповісти</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onPinMessage(msg.id);
                          setActiveMenuMsgId(null);
                        }}
                      >
                        <Pin size={14} />
                        <span>
                          {chat.pinnedMessageId === msg.id
                            ? 'Відкріпити'
                            : 'Закріпити'}
                        </span>
                      </button>
                      {msg.text && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            setActiveMenuMsgId(null);
                          }}
                        >
                          <Copy size={14} />
                          <span>Копіювати</span>
                        </button>
                      )}
                      {isOwn && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsg(msg);
                              setReplyTo(null);
                              setText(msg.text);
                              setActiveMenuMsgId(null);
                            }}
                          >
                            <Edit3 size={14} />
                            <span>Редагувати</span>
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => {
                              onDeleteMessage(msg.id);
                              setActiveMenuMsgId(null);
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Видалити</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Bar or Join Button */}
      <footer className="kolo-composer-wrap">
        {!isMember ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className="kolo-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              onClick={() => onJoinChat(chat.id)}
            >
              <UserPlus size={17} />
              <span>
                {chat.type === 'channel'
                  ? 'Підписатися на канал'
                  : 'Приєднатися до групи'}
              </span>
            </button>
          </div>
        ) : (
          <>
            {/* Reply or Edit Banner */}
            {(replyTo || editingMsg) && (
              <div className="kolo-composer-banner">
                <div className="kolo-composer-banner-icon">
                  {editingMsg ? <Edit3 size={16} /> : <CornerUpLeft size={16} />}
                </div>
                <div className="kolo-composer-banner-text">
                  <strong>
                    {editingMsg
                      ? 'Редагування повідомлення'
                      : `Відповідь для ${
                          users.find((u) => u.id === replyTo?.senderId)
                            ?.displayName || ''
                        }`}
                  </strong>
                  <span>{(editingMsg || replyTo)?.text || 'Вкладення'}</span>
                </div>
                <button
                  type="button"
                  className="kolo-icon-btn"
                  onClick={() => {
                    setReplyTo(null);
                    setEditingMsg(null);
                    if (editingMsg) setText('');
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="kolo-emoji-popover">
                {EMOJI_PALETTE.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setText((prev) => prev + em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}

            {micError && (
              <div className="kolo-auth-error" style={{ marginBottom: 8 }}>
                {micError}
              </div>
            )}

            {isRecording ? (
              <div className="kolo-voice-recorder-bar">
                <div className="kolo-rec-indicator">
                  <span
                    className="kolo-rec-dot"
                    style={{
                      transform: `scale(${(1 + micVolume * 0.85).toFixed(2)})`,
                      boxShadow: `0 0 ${Math.round(6 + micVolume * 18)}px #f43f5e`,
                    }}
                  />
                  <strong>
                    {Math.floor(recordSeconds / 60)}:
                    {(recordSeconds % 60).toString().padStart(2, '0')}
                  </strong>
                </div>

                <div className="kolo-rec-wave">
                  {liveWave.map((h, i) => (
                    <span
                      key={i}
                      style={{
                        height: `${Math.max(10, Math.round(h * 100))}%`,
                        opacity: 0.45 + h * 0.55,
                      }}
                    />
                  ))}
                </div>

                <div className="kolo-rec-actions">
                  <button
                    type="button"
                    className="kolo-btn-ghost kolo-btn-sm"
                    onClick={cancelVoiceRecording}
                  >
                    <Trash2 size={15} />
                    <span>Скасувати</span>
                  </button>
                  <button
                    type="button"
                    className="kolo-btn-primary kolo-btn-sm"
                    onClick={finishVoiceRecording}
                  >
                    <Send size={15} />
                    <span>Надіслати</span>
                  </button>
                </div>
              </div>
            ) : (
              <form className="kolo-composer-bar" onSubmit={handleSubmit}>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="kolo-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Прикріпити зображення або файл"
                >
                  <Paperclip size={19} />
                </button>

                <button
                  type="button"
                  className={`kolo-icon-btn ${showEmojiPicker ? 'active' : ''}`}
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  title="Емодзі"
                >
                  <Smile size={19} />
                </button>

                <textarea
                  rows={1}
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Написати повідомлення... (Клік по повідомленню відкриває реакції)"
                  className="kolo-composer-input"
                />

                {text.trim().length > 0 ? (
                  <button
                    type="submit"
                    className="kolo-send-btn"
                    title="Надіслати (Enter)"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="kolo-mic-btn"
                    onClick={startVoiceRecording}
                    title="Записати голосове повідомлення"
                  >
                    <Mic size={19} />
                  </button>
                )}
              </form>
            )}
          </>
        )}
      </footer>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="kolo-modal-backdrop"
          onClick={() => setLightboxImage(null)}
        >
          <div className="kolo-lightbox-content">
            <img src={lightboxImage} alt="Preview" />
          </div>
        </div>
      )}

      {/* E2EE Safety Verification Modal */}
      {safetyModalOpen && (
        <SafetyVerificationModal
          chat={chat}
          currentUser={currentUser}
          customPassphrase={settings?.customChatKeys?.[chat.id] || ''}
          onSetCustomPassphrase={(psk) => {
            if (onUpdateSettings) {
              onUpdateSettings({
                customChatKeys: {
                  ...(settings?.customChatKeys || {}),
                  [chat.id]: psk,
                },
              });
            }
            setDecryptedMap({});
          }}
          onClose={() => setSafetyModalOpen(false)}
        />
      )}
    </main>
  );
};
