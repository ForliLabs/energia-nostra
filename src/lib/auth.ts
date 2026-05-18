/**
 * Authentication — Demo/MVP implementation with in-memory session store.
 *
 * Provides email/password authentication with SHA-256 password hashing and
 * cookie-based session management. This module is intended for local
 * development and demo environments only.
 *
 * For production deployments, use {@link module:auth-production} instead,
 * which adds PBKDF2 hashing, database-backed sessions, CSRF protection,
 * rate limiting, and SPID/CIE SAML authentication.
 *
 * @module auth
 * @see {@link module:auth-production} for the production implementation
 */

import { cookies } from "next/headers";

/**
 * Available user roles in the platform.
 * - `admin` — Full CER management, member CRUD, GSE reports
 * - `member` — View energy data, vote, manage own profile
 * - `auditor` — Read-only access to all CER data
 * - `superadmin` — Platform-wide tenant management
 */
export type UserRole = "admin" | "member" | "auditor" | "superadmin";

/** Authenticated user data returned after login or session lookup. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** The CER this user belongs to, or `null` for platform-level users (superadmin). */
  cerId: string | null;
}

/** A validated authentication session containing the user and session identifier. */
export interface AuthSession {
  user: SessionUser;
  sessionId: string;
}

/**
 * Hash a password using SHA-256 with a static salt.
 *
 * **⚠️ Demo only** — not suitable for production. Use PBKDF2/bcrypt/argon2 instead.
 *
 * @internal
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "energia-nostra-salt-2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a password against a stored SHA-256 hash.
 *
 * @param password - The plaintext password to verify.
 * @param hash - The stored hex-encoded SHA-256 hash.
 * @returns `true` if the password matches.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

/**
 * Create a SHA-256 password hash for storage.
 *
 * @param password - The plaintext password to hash.
 * @returns Hex-encoded SHA-256 hash.
 */
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
    cerId: "cer-forli-centro",
  });
  users.set("membro@energianostra.it", {
    id: "user-member-1",
    email: "membro@energianostra.it",
    name: "Mario Rossi",
    passwordHash: hash,
    role: "member",
    cerId: "cer-forli-centro",
  });
  users.set("auditor@energianostra.it", {
    id: "user-auditor-1",
    email: "auditor@energianostra.it",
    name: "Revisore CER",
    passwordHash: hash,
    role: "auditor",
    cerId: "cer-forli-centro",
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

/**
 * Authenticate a user by email and password.
 *
 * Looks up the user in the in-memory store and verifies the password hash.
 * Returns `null` if the user is not found or the password is incorrect.
 *
 * @param email - User email address (case-insensitive).
 * @param password - Plaintext password.
 * @returns The authenticated user, or `null` on failure.
 *
 * @example
 * ```ts
 * const user = await authenticateUser("admin@energianostra.it", "demo2025");
 * if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });
 * ```
 */
export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  await ensureSeeded();
  const user = users.get(email.toLowerCase());
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, cerId: user.cerId };
}

/**
 * Register a new user account.
 *
 * @param email - User email address (case-insensitive, must be unique).
 * @param password - Plaintext password (will be hashed).
 * @param name - Display name.
 * @param role - User role. Defaults to `"member"`.
 * @param cerId - CER to assign the user to. Defaults to `"cer-forli-centro"`.
 * @returns The created user, or `null` if the email is already registered.
 */
export async function registerUser(email: string, password: string, name: string, role: UserRole = "member", cerId: string | null = "cer-forli-centro"): Promise<SessionUser | null> {
  await ensureSeeded();
  if (users.has(email.toLowerCase())) return null;
  const id = `user-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = await createPasswordHash(password);
  users.set(email.toLowerCase(), { id, email: email.toLowerCase(), name, passwordHash, role, cerId });
  return { id, email: email.toLowerCase(), name, role, cerId };
}

/**
 * Create a new session for a user.
 *
 * Sessions are stored in-memory and expire after 7 days.
 *
 * @param userId - The ID of the authenticated user.
 * @returns A unique session ID (UUID v4).
 */
export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  sessions.set(sessionId, { userId, expiresAt });
  return sessionId;
}

/**
 * Retrieve the current user session from the `session_id` cookie.
 *
 * Reads the cookie from the Next.js `cookies()` API, validates the session
 * exists and hasn't expired, then returns the associated user.
 *
 * @returns The active session, or `null` if not authenticated or session expired.
 */
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

/**
 * Delete a session, effectively logging the user out.
 *
 * @param sessionId - The session ID to invalidate.
 */
export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Check if a user's role is among the allowed roles.
 *
 * @param userRole - The user's current role.
 * @param allowedRoles - List of roles that are permitted.
 * @returns `true` if the user's role is in the allowed list.
 *
 * @example
 * ```ts
 * if (!requireRole(session.user.role, ["admin", "superadmin"])) {
 *   return Response.json({ error: "Forbidden" }, { status: 403 });
 * }
 * ```
 */
export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
