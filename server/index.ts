import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { THEME_PRESETS } from '../src/themes/presets.ts';
import type { Chat, Message, ThemeConfig, User } from '../src/types/messenger.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'kolo.db.json');
const SECRET_FILE = path.join(DATA_DIR, 'kolo.secret');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function getServerSecret(): string {
  try {
    if (fs.existsSync(SECRET_FILE)) {
      return fs.readFileSync(SECRET_FILE, 'utf-8').trim();
    }
  } catch {
    // ignore
  }
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, secret, 'utf-8');
  return secret;
}

const SERVER_SECRET = getServerSecret();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function signToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, iat: Date.now() })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token?: string): string | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return typeof data.sub === 'string' ? data.sub : null;
  } catch {
    return null;
  }
}

interface StoredUser extends User {
  passwordHash?: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  chats: Chat[];
  messages: Message[];
}

function sanitizeUser(u: StoredUser): User {
  const { passwordHash: _omitted, ...safe } = u;
  return safe;
}

const FAKE_USER_IDS = new Set(['u_you', 'u_olena', 'u_maksym', 'u_bot']);
const FAKE_CHAT_IDS = new Set(['c_studio', 'c_olena', 'c_bot', 'c_news']);

function createEmptyDatabase(): DatabaseSchema {
  const adminUser: StoredUser = {
    id: 'u_admin_master',
    username: 'admin',
    email: 'admin@kolo.app',
    displayName: 'KOLO Admin 🛡️',
    avatarColor: '#f43f5e',
    avatarEmoji: '🛡️',
    statusEmoji: '⚡',
    bio: 'Головний адміністратор KOLO Messenger',
    role: 'admin',
    isBanned: false,
    online: false,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword('AdminKolo2026!'),
    savedTheme: THEME_PRESETS[0],
    savedPresets: [],
  };
  return {
    users: [adminUser],
    chats: [
      {
        id: 'c_global',
        type: 'group',
        title: 'KOLO Загальний Чат',
        handle: 'kolo_global',
        description: 'Загальний публічний чат для всіх учасників KOLO Messenger.',
        avatarColor: '#6366f1',
        avatarEmoji: '⚡',
        memberIds: ['u_admin_master'],
        isPublic: true,
        createdAt: new Date().toISOString(),
      },
    ],
    messages: [],
  };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;

      // Remove all test/demo users
      parsed.users = (parsed.users || []).filter(
        (u) => !FAKE_USER_IDS.has(u.id) && !u.isBot
      );

      // Ensure Master Admin account exists
      let adminUser = parsed.users.find((u) => u.username === 'admin');
      if (!adminUser) {
        adminUser = {
          id: 'u_admin_master',
          username: 'admin',
          email: 'admin@kolo.app',
          displayName: 'KOLO Admin 🛡️',
          avatarColor: '#f43f5e',
          avatarEmoji: '🛡️',
          statusEmoji: '⚡',
          bio: 'Головний адміністратор KOLO Messenger',
          role: 'admin',
          isBanned: false,
          online: false,
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          passwordHash: hashPassword('AdminKolo2026!'),
          savedTheme: THEME_PRESETS[0],
          savedPresets: [],
        };
        parsed.users.unshift(adminUser);
      } else {
        adminUser.role = 'admin';
        adminUser.isBanned = false;
        if (!adminUser.passwordHash) {
          adminUser.passwordHash = hashPassword('AdminKolo2026!');
        }
      }

      const validUserIds = new Set(parsed.users.map((u) => u.id));

      // Remove demo chats and clean memberIds
      parsed.chats = (parsed.chats || [])
        .filter(
          (c) =>
            !FAKE_CHAT_IDS.has(c.id) &&
            !c.id.startsWith('c_bot_') &&
            !(
              c.type === 'dm' &&
              c.memberIds.some((id) => FAKE_USER_IDS.has(id))
            )
        )
        .map((c) => ({
          ...c,
          memberIds: c.memberIds.filter((id) => validUserIds.has(id)),
        }));

      // Ensure c_global exists and contains all real users
      let globalChat = parsed.chats.find((c) => c.id === 'c_global');
      if (!globalChat) {
        globalChat = {
          id: 'c_global',
          type: 'group',
          title: 'KOLO Загальний Чат',
          handle: 'kolo_global',
          description: 'Загальний публічний чат для всіх учасників KOLO Messenger.',
          avatarColor: '#6366f1',
          avatarEmoji: '⚡',
          memberIds: Array.from(validUserIds),
          isPublic: true,
          createdAt: new Date().toISOString(),
        };
        parsed.chats.push(globalChat);
      } else {
        for (const uid of validUserIds) {
          if (!globalChat.memberIds.includes(uid)) {
            globalChat.memberIds.push(uid);
          }
        }
      }

      // Auto-prune any orphaned groups with 0 members
      parsed.chats = parsed.chats.filter(
        (c) => c.id === 'c_global' || (c.memberIds && c.memberIds.length > 0)
      );

      const validChatIds = new Set(parsed.chats.map((c) => c.id));
      parsed.messages = (parsed.messages || []).filter(
        (m) =>
          validChatIds.has(m.chatId) &&
          !FAKE_USER_IDS.has(m.senderId) &&
          !(m.attachment?.type === 'voice' && !m.attachment.url)
      );

      saveDatabase(parsed);
      return parsed;
    }
  } catch (err) {
    console.error('Error loading DB, creating fresh DB:', err);
  }
  const fresh = createEmptyDatabase();
  saveDatabase(fresh);
  return fresh;
}

let db: DatabaseSchema = loadDatabase();

function saveDatabase(data: DatabaseSchema = db): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed saving DB:', err);
  }
}

// Automatically purge groups and channels when 0 members remain
function pruneEmptyChats(): boolean {
  const empty = db.chats.filter(
    (c) => c.id !== 'c_global' && (!c.memberIds || c.memberIds.length === 0)
  );
  if (empty.length > 0) {
    const emptyIds = new Set(empty.map((c) => c.id));
    db.chats = db.chats.filter((c) => !emptyIds.has(c.id));
    db.messages = db.messages.filter((m) => !emptyIds.has(m.chatId));
    saveDatabase();
    io.emit('chats:update', db.chats);
    for (const emptyId of emptyIds) {
      io.emit('chat:deleted', { chatId: emptyId });
    }
    return true;
  }
  return false;
}

function getAuthUserFromRequest(req: express.Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const userId = verifyToken(token);
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

// IP Brute-Force Rate Limiter for Login Protection
interface RateLimitRecord {
  attempts: number;
  blockedUntil?: number;
}
const loginRateLimiter = new Map<string, RateLimitRecord>();

function checkLoginRateLimit(ip: string): { blocked: boolean; retryAfterSec?: number } {
  const rec = loginRateLimiter.get(ip);
  if (!rec) return { blocked: false };
  const now = Date.now();
  if (rec.blockedUntil && rec.blockedUntil > now) {
    return { blocked: true, retryAfterSec: Math.ceil((rec.blockedUntil - now) / 1000) };
  }
  if (rec.blockedUntil && rec.blockedUntil <= now) {
    loginRateLimiter.delete(ip);
    return { blocked: false };
  }
  return { blocked: false };
}

function recordFailedLogin(ip: string): void {
  const rec = loginRateLimiter.get(ip) || { attempts: 0 };
  rec.attempts += 1;
  if (rec.attempts >= 5) {
    rec.blockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout after 5 fails
  }
  loginRateLimiter.set(ip, rec);
}

function clearLoginAttempts(ip: string): void {
  loginRateLimiter.delete(ip);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 30 * 1024 * 1024,
});

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Check username availability
app.get('/api/auth/check-username', (req, res) => {
  const raw = String(req.query.username || '').trim().toLowerCase();
  const clean = raw.replace(/[^a-z0-9_]/g, '');
  if (!clean || clean.length < 3) {
    res.json({ available: false, reason: 'Мінімум 3 символи (a-z, 0-9, _)' });
    return;
  }
  const exists = db.users.some((u) => u.username.toLowerCase() === clean);
  res.json({
    available: !exists,
    reason: exists ? 'Цей @username вже зайнятий' : 'Вільний!',
  });
});

// Register new user
app.post('/api/auth/register', (req, res) => {
  const {
    displayName,
    username,
    email,
    password,
    bio,
    avatarColor,
    avatarEmoji,
    avatarUrl,
    statusEmoji,
  } = req.body;

  if (!displayName || !String(displayName).trim()) {
    res.status(400).json({ error: 'Введіть ваше ім’я' });
    return;
  }
  if (!password || String(password).length < 4) {
    res.status(400).json({ error: 'Пароль має містити щонайменше 4 символи' });
    return;
  }

  const cleanUsername = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  if (!cleanUsername || cleanUsername.length < 3) {
    res.status(400).json({
      error:
        'Нікнейм (@username) має містити щонайменше 3 латинські символи або цифри',
    });
    return;
  }

  if (db.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    res.status(409).json({ error: 'Користувач з таким @username вже існує' });
    return;
  }

  const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
  if (cleanEmail && db.users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
    res.status(409).json({ error: 'Цей email вже використовується' });
    return;
  }

  const nowIso = new Date().toISOString();
  const newUser: StoredUser = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    username: cleanUsername,
    email: cleanEmail,
    displayName: String(displayName).trim(),
    avatarColor: avatarColor || '#6366f1',
    avatarEmoji: avatarEmoji || '⚡',
    avatarUrl: avatarUrl || undefined,
    statusEmoji: statusEmoji || '✨',
    bio: (bio && String(bio).trim()) || 'Учасник KOLO Messenger',
    online: true,
    lastSeen: nowIso,
    createdAt: nowIso,
    passwordHash: hashPassword(String(password)),
    savedTheme: THEME_PRESETS[0],
    savedPresets: [],
  };

  db.users.push(newUser);

  // Add user to global public chat
  const globalChat = db.chats.find((c) => c.id === 'c_global');
  if (globalChat && !globalChat.memberIds.includes(newUser.id)) {
    globalChat.memberIds.push(newUser.id);
    const joinMsg: Message = {
      id: `m_join_${Date.now()}`,
      chatId: 'c_global',
      senderId: newUser.id,
      text: `👋 ${newUser.displayName} (@${newUser.username}) приєднався(-лася) до KOLO!`,
      createdAt: nowIso,
      reactions: [],
      readBy: [newUser.id],
      isSystem: true,
    };
    db.messages.push(joinMsg);
    io.emit('message:new', joinMsg);
  }

  saveDatabase();
  io.emit('users:update', db.users.map(sanitizeUser));
  io.emit('chats:update', db.chats);

  const token = signToken(newUser.id);
  res.json({ token, user: sanitizeUser(newUser) });
});

// Login with username/email + password
app.post('/api/auth/login', (req, res) => {
  const clientIp = String(
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  );
  const rateLimit = checkLoginRateLimit(clientIp);
  if (rateLimit.blocked) {
    res.status(429).json({
      error: `Забагато невдалих спроб входу. Задля захисту акаунта від підбору доступ заблоковано на ${Math.ceil(
        (rateLimit.retryAfterSec || 60) / 60
      )} хв.`,
    });
    return;
  }

  const { login, password } = req.body;
  const cleanLogin = String(login || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');

  const user = db.users.find(
    (u) =>
      u.username.toLowerCase() === cleanLogin ||
      (u.email && u.email.toLowerCase() === cleanLogin)
  );

  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
    recordFailedLogin(clientIp);
    res.status(401).json({ error: 'Невірний @username / email або пароль' });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ error: 'Ваш акаунт заблоковано адміністрацією' });
    return;
  }

  // Clear failed rate limit counter on success
  clearLoginAttempts(clientIp);

  user.online = true;
  user.lastSeen = new Date().toISOString();
  saveDatabase();
  io.emit('users:update', db.users.map(sanitizeUser));

  const token = signToken(user.id);
  res.json({ token, user: sanitizeUser(user) });
});

// Get current authenticated user
app.get('/api/auth/me', (req, res) => {
  const user = getAuthUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  res.json({ user: sanitizeUser(user) });
});

// Update current user's profile
app.put('/api/users/me', (req, res) => {
  const user = getAuthUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const {
    displayName,
    username,
    bio,
    avatarColor,
    avatarEmoji,
    avatarUrl,
    statusEmoji,
    newPassword,
  } = req.body;

  if (username !== undefined) {
    const cleanUsername = String(username)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      res.status(400).json({ error: 'Нікнейм має містити мінімум 3 символи' });
      return;
    }
    const taken = db.users.some(
      (u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername
    );
    if (taken) {
      res.status(409).json({
        error: 'Цей @username вже зайнятий іншим користувачем',
      });
      return;
    }
    user.username = cleanUsername;
  }

  if (displayName && String(displayName).trim()) {
    user.displayName = String(displayName).trim();
  }
  if (bio !== undefined) user.bio = String(bio).trim();
  if (avatarColor) user.avatarColor = avatarColor;
  if (avatarEmoji !== undefined) user.avatarEmoji = avatarEmoji;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (statusEmoji !== undefined) user.statusEmoji = statusEmoji;

  if (newPassword && String(newPassword).length >= 4) {
    user.passwordHash = hashPassword(String(newPassword));
  }

  saveDatabase();
  io.emit('users:update', db.users.map(sanitizeUser));
  res.json({ user: sanitizeUser(user) });
});

// Save user's active theme & custom presets to their profile in DB
app.put('/api/users/me/theme', (req, res) => {
  const user = getAuthUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { savedTheme, savedPresets } = req.body as {
    savedTheme?: ThemeConfig;
    savedPresets?: ThemeConfig[];
  };
  if (savedTheme) user.savedTheme = savedTheme;
  if (Array.isArray(savedPresets)) user.savedPresets = savedPresets;
  saveDatabase();
  res.json({ ok: true });
});

// Bootstrap data scoped for the authenticated user
app.get('/api/bootstrap', (req, res) => {
  const user = getAuthUserFromRequest(req);
  const userId = user?.id;

  const visibleChats = db.chats.filter((c) => {
    if (!userId) return c.isPublic;
    if (c.type === 'dm') {
      return c.memberIds.includes(userId);
    }
    return c.memberIds.includes(userId) || c.isPublic !== false;
  });

  const visibleChatIds = new Set(visibleChats.map((c) => c.id));
  const visibleMessages = db.messages.filter((m) =>
    visibleChatIds.has(m.chatId)
  );

  res.json({
    users: db.users.map(sanitizeUser),
    chats: visibleChats,
    messages: visibleMessages,
  });
});

// Create a new chat (DM, group, or channel)
app.post('/api/chats', (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  const {
    type,
    title,
    handle,
    description,
    avatarColor,
    avatarEmoji,
    memberIds,
    ownerId,
    isPublic,
  } = req.body;

  const creatorId = authUser?.id || ownerId;

  if (type === 'dm' && Array.isArray(memberIds) && memberIds.length === 2) {
    const existing = db.chats.find(
      (c) =>
        c.type === 'dm' &&
        c.memberIds.length === 2 &&
        c.memberIds.includes(memberIds[0]) &&
        c.memberIds.includes(memberIds[1])
    );
    if (existing) {
      res.json(existing);
      return;
    }
  }

  const newChat: Chat = {
    id: `c_${Date.now()}`,
    type: type || 'group',
    title: title || 'Новий чат',
    handle: handle || `kolo_${Date.now().toString().slice(-4)}`,
    description: description || '',
    avatarColor: avatarColor || '#6366f1',
    avatarEmoji:
      avatarEmoji ||
      (type === 'channel' ? '📢' : type === 'group' ? '💬' : '👤'),
    memberIds:
      Array.isArray(memberIds) && memberIds.length > 0
        ? Array.from(new Set(creatorId ? [creatorId, ...memberIds] : memberIds))
        : creatorId
        ? [creatorId]
        : [],
    ownerId: creatorId,
    isPublic: type === 'dm' ? false : isPublic !== false,
    createdAt: new Date().toISOString(),
  };

  db.chats.unshift(newChat);
  saveDatabase();
  io.emit('chat:created', newChat);
  res.json(newChat);
});

// Join a public group or channel
app.post('/api/chats/:chatId/join', (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const chat = db.chats.find((c) => c.id === req.params.chatId);
  if (!chat) {
    res.status(404).json({ error: 'Чат не знайдено' });
    return;
  }
  if (!chat.memberIds.includes(authUser.id)) {
    chat.memberIds.push(authUser.id);
    const joinMsg: Message = {
      id: `m_join_${Date.now()}`,
      chatId: chat.id,
      senderId: authUser.id,
      text: `✨ ${authUser.displayName} (@${
        authUser.username
      }) приєднався(-лася) до ${
        chat.type === 'channel' ? 'каналу' : 'групи'
      }`,
      createdAt: new Date().toISOString(),
      reactions: [],
      readBy: [authUser.id],
      isSystem: true,
    };
    db.messages.push(joinMsg);
    saveDatabase();
    io.emit('chats:update', db.chats);
    io.emit('message:new', joinMsg);
  }
  res.json(chat);
});

// Leave a group or channel
app.post('/api/chats/:chatId/leave', (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const chat = db.chats.find((c) => c.id === req.params.chatId);
  if (!chat) {
    res.status(404).json({ error: 'Чат не знайдено' });
    return;
  }
  chat.memberIds = chat.memberIds.filter((id) => id !== authUser.id);

  // If the chat has 0 members left and is not the global lobby, automatically delete it and its messages!
  if (chat.id !== 'c_global' && chat.memberIds.length === 0) {
    db.chats = db.chats.filter((c) => c.id !== chat.id);
    db.messages = db.messages.filter((m) => m.chatId !== chat.id);
    saveDatabase();
    io.emit('chats:update', db.chats);
    io.emit('chat:deleted', { chatId: chat.id });
    res.json({ ok: true, deleted: true });
    return;
  }

  saveDatabase();
  io.emit('chats:update', db.chats);
  res.json({ ok: true });
});

// Terminate all other active sessions for current user
app.post('/api/auth/terminate-other-sessions', (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const currentSocketId = req.headers['x-socket-id'] as string | undefined;
  for (const [sockId, uid] of socketUsers.entries()) {
    if (uid === authUser.id && sockId !== currentSocketId) {
      const s = io.sockets.sockets.get(sockId);
      if (s) {
        s.emit('auth:error', { message: 'Сесію завершено з іншого пристрою' });
        s.disconnect(true);
      }
      socketUsers.delete(sockId);
    }
  }
  res.json({ ok: true, message: 'Усі інші активні сесії успішно закрито' });
});

// Configure Disappearing / Ephemeral Messages Timer for a chat
app.post('/api/chats/:chatId/ephemeral', (req, res) => {
  const authUser = getAuthUserFromRequest(req);
  if (!authUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const chat = db.chats.find((c) => c.id === req.params.chatId);
  if (!chat) {
    res.status(404).json({ error: 'Чат не знайдено' });
    return;
  }
  const { ttlSeconds } = req.body;
  const ttl = typeof ttlSeconds === 'number' ? Math.max(0, ttlSeconds) : 0;
  chat.ephemeralTimerSeconds = ttl;

  const timerLabel =
    ttl === 0
      ? 'вимкнено'
      : ttl < 60
      ? `${ttl} сек`
      : ttl < 3600
      ? `${Math.round(ttl / 60)} хв`
      : `${Math.round(ttl / 3600)} год`;

  const sysMsg: Message = {
    id: `m_sys_eph_${Date.now()}`,
    chatId: chat.id,
    senderId: authUser.id,
    text: `⏱️ ${authUser.displayName} встановив(-ла) таймер зникнення повідомлень: ${timerLabel}`,
    createdAt: new Date().toISOString(),
    reactions: [],
    readBy: [authUser.id],
    isSystem: true,
  };
  db.messages.push(sysMsg);
  saveDatabase();
  io.emit('chats:update', db.chats);
  io.emit('message:new', sysMsg);
  res.json({ ok: true, ephemeralTimerSeconds: chat.ephemeralTimerSeconds });
});

// Upload file / image / voice audio / avatar
app.post('/api/upload', (req, res) => {
  try {
    const { name, mimeType, base64Data } = req.body;
    if (!base64Data || typeof base64Data !== 'string') {
      res.status(400).json({ error: 'No base64Data provided' });
      return;
    }

    // Properly strip ANY data URI header (even with parameters like audio/webm;codecs=opus;base64,)
    const base64Marker = ';base64,';
    const markerIndex = base64Data.indexOf(base64Marker);
    const rawBase64 =
      markerIndex !== -1
        ? base64Data.slice(markerIndex + base64Marker.length)
        : base64Data;

    const buffer = Buffer.from(rawBase64, 'base64');

    const safeExt =
      path.extname(name || '').replace(/[^a-zA-Z0-9.]/g, '') || '.bin';
    const filename = `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}${safeExt}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    res.json({
      url: `/uploads/${filename}`,
      name: name || filename,
      size: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Admin Middleware & Endpoints
function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = getAuthUserFromRequest(req);
  if (!user || user.role !== 'admin' || user.isBanned) {
    res
      .status(403)
      .json({ error: 'Доступ заборонено (потрібні права адміністратора)' });
    return;
  }
  next();
}

app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const onlineCount = db.users.filter((u) => u.online).length;
  const bannedCount = db.users.filter((u) => u.isBanned).length;
  const adminCount = db.users.filter((u) => u.role === 'admin').length;
  res.json({
    totalUsers: db.users.length,
    onlineUsers: onlineCount,
    bannedUsers: bannedCount,
    adminUsers: adminCount,
    totalChats: db.chats.length,
    totalMessages: db.messages.length,
    uptimeSec: Math.floor(process.uptime()),
  });
});

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const usersWithStats = db.users.map((u) => ({
    ...sanitizeUser(u),
    isBanned: Boolean(u.isBanned),
    role: u.role || 'user',
    messagesCount: db.messages.filter((m) => m.senderId === u.id).length,
    chatsCount: db.chats.filter((c) => c.memberIds.includes(u.id)).length,
  }));
  res.json(usersWithStats);
});

app.post('/api/admin/users/:userId/toggle-ban', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const target = db.users.find((u) => u.id === userId);
  if (!target) {
    res.status(404).json({ error: 'Користувача не знайдено' });
    return;
  }
  if (target.id === 'u_admin_master') {
    res.status(400).json({ error: 'Неможливо заблокувати головного адміністратора' });
    return;
  }

  target.isBanned = !target.isBanned;
  target.online = target.isBanned ? false : target.online;
  saveDatabase();

  // If user was banned, disconnect their active sockets
  if (target.isBanned) {
    for (const [sockId, uid] of socketUsers.entries()) {
      if (uid === target.id) {
        const sock = io.sockets.sockets.get(sockId);
        sock?.emit('auth:error', { message: 'Ваш акаунт було заблоковано адміністрацією' });
        sock?.disconnect(true);
      }
    }
  }

  io.emit('users:update', db.users.map(sanitizeUser));
  res.json({ ok: true, isBanned: target.isBanned });
});

app.post('/api/admin/users/:userId/toggle-role', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const target = db.users.find((u) => u.id === userId);
  if (!target) {
    res.status(404).json({ error: 'Користувача не знайдено' });
    return;
  }
  if (target.id === 'u_admin_master') {
    res.status(400).json({ error: 'Неможливо змінити роль головного адміністратора' });
    return;
  }

  target.role = target.role === 'admin' ? 'user' : 'admin';
  saveDatabase();
  io.emit('users:update', db.users.map(sanitizeUser));
  res.json({ ok: true, role: target.role });
});

app.post('/api/admin/users/:userId/reset-password', requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  const target = db.users.find((u) => u.id === userId);
  if (!target) {
    res.status(404).json({ error: 'Користувача не знайдено' });
    return;
  }

  const pass = String(newPassword || 'kolo123');
  target.passwordHash = hashPassword(pass);
  saveDatabase();
  res.json({ ok: true, message: `Пароль успішно змінено на: ${pass}` });
});

app.delete('/api/admin/users/:userId', requireAdmin, (req, res) => {
  const { userId } = req.params;
  if (userId === 'u_admin_master') {
    res.status(400).json({ error: 'Неможливо видалити головного адміністратора' });
    return;
  }

  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    res.status(404).json({ error: 'Користувача не знайдено' });
    return;
  }

  db.users.splice(idx, 1);
  // Remove user from all chats
  for (const c of db.chats) {
    c.memberIds = c.memberIds.filter((id) => id !== userId);
  }
  // Delete user's personal DMs
  db.chats = db.chats.filter(
    (c) => !(c.type === 'dm' && c.memberIds.length < 2)
  );

  // Prune any non-global groups that now have 0 members
  pruneEmptyChats();

  saveDatabase();
  io.emit('users:update', db.users.map(sanitizeUser));
  io.emit('chats:update', db.chats);
  res.json({ ok: true });
});

app.get('/api/admin/chats', requireAdmin, (_req, res) => {
  const chatsWithStats = db.chats.map((c) => ({
    ...c,
    messagesCount: db.messages.filter((m) => m.chatId === c.id).length,
  }));
  res.json(chatsWithStats);
});

app.delete('/api/admin/chats/:chatId', requireAdmin, (req, res) => {
  const { chatId } = req.params;
  if (chatId === 'c_global') {
    res.status(400).json({ error: 'Неможливо видалити головний загальний чат' });
    return;
  }

  const idx = db.chats.findIndex((c) => c.id === chatId);
  if (idx === -1) {
    res.status(404).json({ error: 'Чат не знайдено' });
    return;
  }

  db.chats.splice(idx, 1);
  db.messages = db.messages.filter((m) => m.chatId !== chatId);
  saveDatabase();
  io.emit('chats:update', db.chats);
  res.json({ ok: true });
});

app.post('/api/admin/broadcast', requireAdmin, (req, res) => {
  const { text } = req.body;
  const adminUser = getAuthUserFromRequest(req);
  if (!text || !text.trim() || !adminUser) {
    res.status(400).json({ error: 'Текст повідомлення обов’язковий' });
    return;
  }

  const broadcastMsg: Message = {
    id: `m_admin_bcast_${Date.now()}`,
    chatId: 'c_global',
    senderId: adminUser.id,
    text: `🛡️ [ОФІЦІЙНЕ ПОВІДОМЛЕННЯ АДМІНІСТРАЦІЇ]\n\n${text.trim()}`,
    createdAt: new Date().toISOString(),
    reactions: [{ emoji: '⚡', userIds: [adminUser.id] }],
    readBy: [adminUser.id],
    isSystem: true,
  };

  db.messages.push(broadcastMsg);
  saveDatabase();
  io.emit('message:new', broadcastMsg);
  io.emit('admin:broadcast', {
    text: text.trim(),
    senderName: adminUser.displayName,
    time: broadcastMsg.createdAt,
  });

  res.json({ ok: true, message: broadcastMsg });
});

// Serve built frontend in production if dist exists
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/socket.io')
    ) {
      next();
      return;
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Ephemeral / Disappearing message real-time garbage collector
setInterval(() => {
  const now = Date.now();
  const expired = db.messages.filter(
    (m) => m.expiresAt && new Date(m.expiresAt).getTime() <= now
  );
  if (expired.length > 0) {
    const expiredIds = new Set(expired.map((m) => m.id));
    db.messages = db.messages.filter((m) => !expiredIds.has(m.id));
    saveDatabase();
    for (const exp of expired) {
      io.emit('message:deleted', { messageId: exp.id, chatId: exp.chatId });
    }
  }
}, 1000);

// Track connected sockets -> userId
const socketUsers = new Map<string, string>();

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token as string | undefined;
  const verifiedUserId = verifyToken(token);
  if (verifiedUserId) {
    const user = db.users.find((u) => u.id === verifiedUserId);
    if (user) {
      if (user.isBanned) {
        socket.emit('auth:error', { message: 'Ваш акаунт заблоковано' });
        socket.disconnect(true);
        return;
      }
      socketUsers.set(socket.id, verifiedUserId);
      user.online = true;
      user.lastSeen = new Date().toISOString();
      saveDatabase();
      io.emit('users:update', db.users.map(sanitizeUser));
    }
  }

  socket.on('auth:identify', (tokenOrUserId: string) => {
    const uid = verifyToken(tokenOrUserId) || tokenOrUserId;
    const user = db.users.find((u) => u.id === uid);
    if (user) {
      if (user.isBanned) {
        socket.emit('auth:error', { message: 'Ваш акаунт заблоковано' });
        socket.disconnect(true);
        return;
      }
      socketUsers.set(socket.id, uid);
      user.online = true;
      user.lastSeen = new Date().toISOString();
      saveDatabase();
      io.emit('users:update', db.users.map(sanitizeUser));
    }
  });

  socket.on(
    'chat:typing',
    (payload: { chatId: string; userId: string; isTyping: boolean }) => {
      socket.broadcast.emit('chat:typing', payload);
    }
  );

  socket.on(
    'message:send',
    (payload: {
      chatId: string;
      senderId: string;
      text: string;
      replyToId?: string;
      attachment?: Message['attachment'];
      ttlSeconds?: number;
    }) => {
      const authedId = socketUsers.get(socket.id) || payload.senderId;
      const chat = db.chats.find((c) => c.id === payload.chatId);
      const ttl = payload.ttlSeconds || chat?.ephemeralTimerSeconds || 0;
      const expiresAt =
        ttl > 0 ? new Date(Date.now() + ttl * 1000).toISOString() : undefined;

      const isEncrypted =
        typeof payload.text === 'string' &&
        payload.text.startsWith('🔒[E2EE:v1:');

      const newMsg: Message = {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        chatId: payload.chatId,
        senderId: authedId,
        text: payload.text || '',
        createdAt: new Date().toISOString(),
        replyToId: payload.replyToId,
        reactions: [],
        attachment: payload.attachment,
        readBy: [authedId],
        isEncrypted,
        ttlSeconds: ttl > 0 ? ttl : undefined,
        expiresAt,
      };

      db.messages.push(newMsg);
      saveDatabase();
      io.emit('message:new', newMsg);
    }
  );

  socket.on('message:edit', (payload: { messageId: string; text: string }) => {
    const authedId = socketUsers.get(socket.id);
    const msg = db.messages.find((m) => m.id === payload.messageId);
    if (msg && (!authedId || msg.senderId === authedId)) {
      msg.text = payload.text;
      msg.editedAt = new Date().toISOString();
      saveDatabase();
      io.emit('message:updated', msg);
    }
  });

  socket.on('message:delete', (payload: { messageId: string }) => {
    const authedId = socketUsers.get(socket.id);
    const idx = db.messages.findIndex((m) => m.id === payload.messageId);
    if (idx !== -1) {
      const deleted = db.messages[idx];
      if (!authedId || deleted.senderId === authedId) {
        db.messages.splice(idx, 1);
        saveDatabase();
        io.emit('message:deleted', {
          messageId: deleted.id,
          chatId: deleted.chatId,
        });
      }
    }
  });

  socket.on(
    'message:react',
    (payload: { messageId: string; userId: string; emoji: string }) => {
      const authedId = socketUsers.get(socket.id) || payload.userId;
      const msg = db.messages.find((m) => m.id === payload.messageId);
      if (!msg) return;

      let group = msg.reactions.find((r) => r.emoji === payload.emoji);
      if (!group) {
        group = { emoji: payload.emoji, userIds: [authedId] };
        msg.reactions.push(group);
      } else {
        if (group.userIds.includes(authedId)) {
          group.userIds = group.userIds.filter((id) => id !== authedId);
        } else {
          group.userIds.push(authedId);
        }
        msg.reactions = msg.reactions.filter((r) => r.userIds.length > 0);
      }

      saveDatabase();
      io.emit('message:updated', msg);
    }
  );

  socket.on('message:pin', (payload: { chatId: string; messageId?: string }) => {
    const chat = db.chats.find((c) => c.id === payload.chatId);
    if (chat) {
      chat.pinnedMessageId =
        chat.pinnedMessageId === payload.messageId
          ? undefined
          : payload.messageId;
      saveDatabase();
      io.emit('chats:update', db.chats);
    }
  });

  socket.on('message:read', (payload: { chatId: string; userId: string }) => {
    const authedId = socketUsers.get(socket.id) || payload.userId;
    let changed = false;
    for (const msg of db.messages) {
      if (msg.chatId === payload.chatId && !msg.readBy.includes(authedId)) {
        msg.readBy.push(authedId);
        changed = true;
      }
    }
    if (changed) {
      saveDatabase();
      io.emit('messages:read', { chatId: payload.chatId, userId: authedId });
    }
  });

  socket.on('disconnect', () => {
    const userId = socketUsers.get(socket.id);
    socketUsers.delete(socket.id);
    if (userId) {
      const stillConnected = Array.from(socketUsers.values()).includes(userId);
      if (!stillConnected) {
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.online = false;
          user.lastSeen = new Date().toISOString();
          saveDatabase();
          io.emit('users:update', db.users.map(sanitizeUser));
        }
      }
    }
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ KOLO Realtime Server listening on http://0.0.0.0:${PORT}`);
});
