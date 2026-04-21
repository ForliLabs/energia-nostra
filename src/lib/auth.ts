import { cookies } from "next/headers";

export type UserRole = "admin" | "member" | "auditor" | "superadmin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  cerId: string | null;
}

export interface AuthSession {
  user: SessionUser;
  sessionId: string;
}

// Simple password hashing (SHA-256 based) — for demo/MVP purposes.
// In production, use bcrypt or argon2.
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "energia-nostra-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

export async function createPasswordHash(password: string): Promise<string> {
  return hashPassword(password);
}

// In-memory session store for MVP (mirrors InMemoryStore pattern)
const sessions = new Map<string, { userId: string; expiresAt: Date }>();
const users = new Map<string, {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  cerId: string | null;
}>();

// Seed demo users
async function ensureSeeded() {
  if (users.size > 0) return;
  const hash = await createPasswordHash("demo2025");
  users.set("admin@energianostra.it", {
    id: "user-admin-1",
    email: "admin@energianostra.it",
    name: "Admin CER Bertinoro",
    passwordHash: hash,
    role: "admin",
    cerId: "cer-bertinoro",
  });
  users.set("membro@energianostra.it", {
    id: "user-member-1",
    email: "membro@energianostra.it",
    name: "Mario Rossi",
    passwordHash: hash,
    role: "member",
    cerId: "cer-bertinoro",
  });
  users.set("auditor@energianostra.it", {
    id: "user-auditor-1",
    email: "auditor@energianostra.it",
    name: "Revisore CER",
    passwordHash: hash,
    role: "auditor",
    cerId: "cer-bertinoro",
  });
  users.set("super@energianostra.it", {
    id: "user-super-1",
    email: "super@energianostra.it",
    name: "Super Admin Piattaforma",
    passwordHash: hash,
    role: "superadmin",
    cerId: null,
  });
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  await ensureSeeded();
  const user = users.get(email.toLowerCase());
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, cerId: user.cerId };
}

export async function registerUser(email: string, password: string, name: string, role: UserRole = "member", cerId: string | null = "cer-bertinoro"): Promise<SessionUser | null> {
  await ensureSeeded();
  if (users.has(email.toLowerCase())) return null;
  const id = `user-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = await createPasswordHash(password);
  users.set(email.toLowerCase(), { id, email: email.toLowerCase(), name, passwordHash, role, cerId });
  return { id, email: email.toLowerCase(), name, role, cerId };
}

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  sessions.set(sessionId, { userId, expiresAt });
  return sessionId;
}

export async function getSessionFromCookie(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_id");
  if (!sessionCookie) return null;

  const session = sessions.get(sessionCookie.value);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionCookie.value);
    return null;
  }

  await ensureSeeded();
  const user = Array.from(users.values()).find((u) => u.id === session.userId);
  if (!user) return null;

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role, cerId: user.cerId },
    sessionId: sessionCookie.value,
  };
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
