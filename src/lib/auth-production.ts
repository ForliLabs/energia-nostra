/**
 * Production Auth Module — SPID/CIE + bcrypt + DB sessions + CSRF + rate limiting
 * Replaces the demo SHA-256 auth in auth.ts for production use.
 */

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export type UserRole = "admin" | "member" | "auditor" | "superadmin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  cerId: string | null;
  authProvider: string;
}

export interface AuthSession {
  user: SessionUser;
  sessionId: string;
  csrfToken: string;
}

// ── Password Hashing (production-grade using Web Crypto PBKDF2) ──

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

async function generateSalt(): Promise<string> {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return bufferToHex(salt);
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

export async function hashPasswordProduction(password: string): Promise<string> {
  const salt = await generateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-512" },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const hash = bufferToHex(new Uint8Array(derivedBits));
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

export async function verifyPasswordProduction(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith("pbkdf2:")) {
    // Legacy SHA-256 fallback for existing demo passwords
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "energia-nostra-salt-2025");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const computed = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    return computed === storedHash;
  }
  const [, iterStr, salt, expectedHash] = storedHash.split(":");
  const iterations = parseInt(iterStr, 10);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBuffer(salt), iterations, hash: "SHA-512" },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const computedHash = bufferToHex(new Uint8Array(derivedBits));
  return computedHash === expectedHash;
}

// ── Password Validation ──

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  if (password.length < 8) errors.push("La password deve avere almeno 8 caratteri");
  if (!/[A-Z]/.test(password)) errors.push("La password deve contenere almeno una lettera maiuscola");
  if (!/[a-z]/.test(password)) errors.push("La password deve contenere almeno una lettera minuscola");
  if (!/[0-9]/.test(password)) errors.push("La password deve contenere almeno un numero");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("La password deve contenere almeno un carattere speciale");
  return { valid: errors.length === 0, errors };
}

// ── CSRF Token ──

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

export function validateCsrfToken(requestToken: string | null, sessionToken: string): boolean {
  if (!requestToken) return false;
  return requestToken === sessionToken;
}

// ── Rate Limiting (in-memory, per-IP) ──

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(identifier: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

// ── Database-Backed Sessions ──

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createDbSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ sessionId: string; refreshToken: string; csrfToken: string }> {
  const csrfToken = generateCsrfToken();
  const refreshToken = crypto.randomUUID();

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      refreshToken,
      refreshExpiresAt: new Date(Date.now() + REFRESH_DURATION_MS),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      csrfToken,
    },
  });

  return { sessionId: session.id, refreshToken, csrfToken };
}

export async function getDbSession(sessionId: string): Promise<AuthSession | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || "",
      role: session.user.role as UserRole,
      cerId: session.user.cerId,
      authProvider: session.user.authProvider ?? "local",
    },
    sessionId: session.id,
    csrfToken: session.csrfToken || "",
  };
}

export async function refreshDbSession(refreshToken: string): Promise<{
  sessionId: string;
  newRefreshToken: string;
  csrfToken: string;
} | null> {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
  });

  if (!session || !session.refreshExpiresAt || session.refreshExpiresAt < new Date()) {
    return null;
  }

  const newRefreshToken = crypto.randomUUID();
  const newCsrfToken = generateCsrfToken();

  await prisma.session.update({
    where: { id: session.id },
    data: {
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      refreshToken: newRefreshToken,
      refreshExpiresAt: new Date(Date.now() + REFRESH_DURATION_MS),
      csrfToken: newCsrfToken,
    },
  });

  return { sessionId: session.id, newRefreshToken, csrfToken: newCsrfToken };
}

export async function deleteDbSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function getActiveSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });
}

// ── User Authentication (DB-backed) ──

export async function authenticateUserDb(
  email: string,
  password: string,
  ipAddress?: string
): Promise<SessionUser | null> {
  void ipAddress;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return null;
  }

  const valid = await verifyPasswordProduction(password, user.passwordHash);
  if (!valid) {
    const attempts = (user.failedAttempts ?? 0) + 1;
    const updateData: Record<string, unknown> = { failedAttempts: attempts };
    if (attempts >= MAX_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + WINDOW_MS);
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    return null;
  }

  // Reset failed attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role as UserRole,
    cerId: user.cerId,
    authProvider: user.authProvider ?? "local",
  };
}

export async function registerUserDb(
  email: string,
  password: string,
  name: string,
  role: UserRole = "member",
  cerId: string | null = "cer-bertinoro"
): Promise<SessionUser | null> {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return null;

  const passwordHash = await hashPasswordProduction(password);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role,
      cerId,
      authProvider: "local",
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role as UserRole,
    cerId: user.cerId,
    authProvider: "local",
  };
}

// ── SPID/CIE Integration Types ──

export interface SpidAttributes {
  spidCode: string;       // Codice SPID
  fiscalNumber: string;   // Codice Fiscale
  name: string;
  familyName: string;
  email: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  address?: string;
}

export interface CieAttributes {
  cieId: string;
  fiscalNumber: string;
  name: string;
  familyName: string;
  email?: string;
}

export interface SamlConfig {
  entityId: string;
  assertionConsumerServiceUrl: string;
  singleLogoutServiceUrl: string;
  idpMetadataUrl: string;
  certificate: string;
  privateKey: string;
  signatureAlgorithm: string;
}

/**
 * SPID Service Provider configuration.
 * In production, configure via environment variables.
 */
export function getSpidConfig(): SamlConfig {
  return {
    entityId: process.env.SPID_ENTITY_ID || "https://energianostra.it/spid/metadata",
    assertionConsumerServiceUrl: process.env.SPID_ACS_URL || "https://energianostra.it/api/auth/spid/callback",
    singleLogoutServiceUrl: process.env.SPID_SLO_URL || "https://energianostra.it/api/auth/spid/logout",
    idpMetadataUrl: process.env.SPID_IDP_METADATA_URL || "https://idp.spid.gov.it/metadata",
    certificate: process.env.SPID_CERTIFICATE || "",
    privateKey: process.env.SPID_PRIVATE_KEY || "",
    signatureAlgorithm: "sha256",
  };
}

/**
 * CIE (Carta d'Identità Elettronica) configuration.
 */
export function getCieConfig(): SamlConfig {
  return {
    entityId: process.env.CIE_ENTITY_ID || "https://energianostra.it/cie/metadata",
    assertionConsumerServiceUrl: process.env.CIE_ACS_URL || "https://energianostra.it/api/auth/cie/callback",
    singleLogoutServiceUrl: process.env.CIE_SLO_URL || "https://energianostra.it/api/auth/cie/logout",
    idpMetadataUrl: process.env.CIE_IDP_METADATA_URL || "https://idserver.servizicie.interno.gov.it/idp/shibboleth",
    certificate: process.env.CIE_CERTIFICATE || "",
    privateKey: process.env.CIE_PRIVATE_KEY || "",
    signatureAlgorithm: "sha256",
  };
}

/**
 * Handle SPID authentication callback.
 * Maps SPID attributes to local user, creating if necessary.
 */
export async function handleSpidCallback(attributes: SpidAttributes): Promise<SessionUser | null> {
  // Look up by SPID ID first
  let user = await prisma.user.findUnique({ where: { spidId: attributes.spidCode } });

  if (!user) {
    // Try to match by fiscal code or email
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { fiscalCode: attributes.fiscalNumber },
          { email: attributes.email.toLowerCase() },
        ],
      },
    });

    if (user) {
      // Link existing user to SPID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          spidId: attributes.spidCode,
          fiscalCode: attributes.fiscalNumber,
          authProvider: "spid",
          name: `${attributes.name} ${attributes.familyName}`,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new user from SPID
      user = await prisma.user.create({
        data: {
          email: attributes.email.toLowerCase(),
          name: `${attributes.name} ${attributes.familyName}`,
          passwordHash: "spid-auth-no-password",
          role: "member",
          spidId: attributes.spidCode,
          fiscalCode: attributes.fiscalNumber,
          authProvider: "spid",
          lastLoginAt: new Date(),
        },
      });
    }
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role as UserRole,
    cerId: user.cerId,
    authProvider: "spid",
  };
}

/**
 * Handle CIE authentication callback.
 */
export async function handleCieCallback(attributes: CieAttributes): Promise<SessionUser | null> {
  let user = await prisma.user.findUnique({ where: { cieId: attributes.cieId } });

  if (!user) {
    user = await prisma.user.findFirst({
      where: { fiscalCode: attributes.fiscalNumber },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          cieId: attributes.cieId,
          authProvider: "cie",
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: attributes.email?.toLowerCase() || `${attributes.fiscalNumber.toLowerCase()}@cie.placeholder`,
          name: `${attributes.name} ${attributes.familyName}`,
          passwordHash: "cie-auth-no-password",
          role: "member",
          cieId: attributes.cieId,
          fiscalCode: attributes.fiscalNumber,
          authProvider: "cie",
          lastLoginAt: new Date(),
        },
      });
    }
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    role: user.role as UserRole,
    cerId: user.cerId,
    authProvider: "cie",
  };
}

// ── Session from Cookie (DB-backed replacement) ──

export async function getProductionSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_id");
  if (!sessionCookie) return null;
  return getDbSession(sessionCookie.value);
}

// ── Audit Logging ──

export async function logAuthEvent(
  action: string,
  userId: string | null,
  details?: string
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      entity: "auth",
      entityId: userId || "unknown",
      userId,
      details,
    },
  });
}

// ── Middleware helper ──

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
