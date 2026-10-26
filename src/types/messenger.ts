export type ChatType = 'dm' | 'group' | 'channel';

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji?: string;
  avatarUrl?: string;
  statusEmoji?: string;
  bio: string;
  online: boolean;
  lastSeen: string;
  isBot?: boolean;
  role?: 'admin' | 'user';
  isBanned?: boolean;
  createdAt?: string;
  savedTheme?: ThemeConfig;
  savedPresets?: ThemeConfig[];
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface ReactionGroup {
  emoji: string;
  userIds: string[];
}

export type AttachmentType = 'image' | 'file' | 'voice' | 'theme';

export interface MessageAttachment {
  type: AttachmentType;
  url?: string;
  name?: string;
  size?: number;
  mimeType?: string;
  duration?: number; // for voice messages in seconds
  waveform?: number[]; // normalized 0..1 bars for voice visualization
  themeData?: ThemeConfig; // when sharing a custom theme in chat
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  replyToId?: string;
  reactions: ReactionGroup[];
  attachment?: MessageAttachment;
  readBy: string[];
  pinned?: boolean;
  isSystem?: boolean;
}

export interface Chat {
  id: string;
  type: ChatType;
  title: string;
  handle?: string;
  description?: string;
  avatarColor: string;
  avatarEmoji?: string;
  avatarUrl?: string;
  memberIds: string[];
  ownerId?: string;
  isPublic?: boolean;
  pinnedMessageId?: string;
  createdAt: string;
}

export type LiveBgMode =
  | 'aurora'
  | 'particles'
  | 'orbs'
  | 'matrix'
  | 'pattern'
  | 'media'
  | 'solid';

export type PatternPreset = 'space' | 'cats' | 'geometry' | 'circuit';
export type BubbleAnimation = 'pop-elastic' | 'slide-up' | 'fade-blur' | 'glitch' | 'none';
export type BubbleTailStyle = 'curved' | 'sharp' | 'none';
export type BubbleDensity = 'compact' | 'normal' | 'relaxed';
export type AvatarShape = 'circle' | 'squircle' | 'hexagon' | 'sharp';
export type FontFamilyOption =
  | 'Inter'
  | 'JetBrains Mono'
  | 'Montserrat'
  | 'Nunito'
  | 'Playfair Display';

export interface ThemeConfig {
  id: string;
  name: string;
  author?: string;

  // Colors & Glassmorphism
  bgPrimary: string; // Base app canvas color
  surfaceColor: string; // Sidebar / Header / Panels RGB hex
  surfaceOpacity: number; // 0.15 to 0.98
  glassBlur: number; // 0 to 40 (px)
  borderGlowOpacity: number; // 0 to 0.6
  accentColor: string;
  accentSecondary: string;
  neonGlow: boolean;
  textPrimary: string;
  textSecondary: string;

  // Outgoing & Incoming Bubble Colors/Gradients
  outBubbleColor1: string;
  outBubbleColor2: string;
  outBubbleGradientAngle: number; // 0..360
  outBubbleText: string;
  inBubbleColor1: string;
  inBubbleColor2: string;
  inBubbleOpacity: number; // 0.3 to 1.0
  inBubbleText: string;

  // Bubble Shape & Typography
  bubbleRadius: number; // 0 to 28 (px)
  bubbleTail: BubbleTailStyle;
  bubbleDensity: BubbleDensity;
  bubbleMaxWidth: number; // 50 to 85 (%)
  bubbleAnimation: BubbleAnimation;
  bubbleGlow: boolean;
  fontFamily: FontFamilyOption;
  fontSize: number; // 13 to 18 (px)

  // Live Background
  bgMode: LiveBgMode;
  bgColor1: string;
  bgColor2: string;
  bgColor3: string;
  bgSpeed: number; // 0.2 to 3.0
  bgParticleCount: number; // 20 to 120
  bgInteractiveMouse: boolean;
  bgPatternPreset: PatternPreset;
  bgPatternOpacity: number; // 0.03 to 0.4
  bgPatternAnimated: boolean;
  bgMediaUrl: string;
  bgMediaType: 'image' | 'video';
  bgMediaDim: number; // 0 to 0.85
  bgMediaBlur: number; // 0 to 24

  // Layout
  sidebarPosition: 'left' | 'right';
  avatarShape: AvatarShape;
  compactSidebar: boolean;
}
