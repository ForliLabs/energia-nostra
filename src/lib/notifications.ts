/**
 * Notification Hub — Multi-channel notification delivery (in-app, push, email).
 * Handles notification preferences, web push (VAPID), and email templates.
 */

import { prisma } from "@/lib/prisma";
import { eventBus } from "@/lib/events";
import type { DomainEvent, DomainEventType } from "@/lib/events";

// ── Types ──

export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  read: boolean;
  channel: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  categories: {
    category: string;
    pushEnabled: boolean;
    emailEnabled: boolean;
    inAppEnabled: boolean;
  }[];
}

export type NotificationCategory =
  | "billing"
  | "voting"
  | "energy"
  | "trading"
  | "governance"
  | "gamification";

const EVENT_TO_CATEGORY: Record<string, NotificationCategory> = {
  "vote.cast": "voting",
  "vote.opened": "voting",
  "vote.closed": "voting",
  "trade.created": "trading",
  "trade.matched": "trading",
  "trade.settled": "trading",
  "invoice.generated": "billing",
  "invoice.paid": "billing",
  "meter.uploaded": "energy",
  "anomaly.detected": "energy",
  "achievement.earned": "gamification",
  "document.signed": "governance",
  "document.generated": "governance",
  "member.joined": "governance",
  "challenge.completed": "gamification",
};

const EVENT_TO_NOTIFICATION: Record<string, { title: string; bodyTemplate: string; actionUrl?: string }> = {
  "vote.opened": {
    title: "Nuova votazione aperta",
    bodyTemplate: "Una nuova votazione è stata aperta: {voteTitle}",
    actionUrl: "/dashboard/voting",
  },
  "vote.closed": {
    title: "Votazione conclusa",
    bodyTemplate: "La votazione '{voteTitle}' si è conclusa",
    actionUrl: "/dashboard/voting",
  },
  "trade.matched": {
    title: "Scambio energetico completato",
    bodyTemplate: "Scambio di {kwhTraded} kWh a €{pricePerKwh}/kWh confermato",
    actionUrl: "/dashboard/trading",
  },
  "invoice.generated": {
    title: "Nuova fattura emessa",
    bodyTemplate: "Fattura {invoiceNumber} di €{amountEuro} per il periodo {period}",
    actionUrl: "/dashboard/billing",
  },
  "invoice.paid": {
    title: "Pagamento ricevuto",
    bodyTemplate: "Pagamento di €{amount} ricevuto tramite {provider}",
    actionUrl: "/dashboard/payments",
  },
  "anomaly.detected": {
    title: "⚠️ Anomalia rilevata",
    bodyTemplate: "Anomalia nei dati di {memberName}: {description}",
    actionUrl: "/dashboard/meter-data",
  },
  "achievement.earned": {
    title: "🏆 Nuovo badge ottenuto!",
    bodyTemplate: "Hai ottenuto il badge '{achievementName}' (+{points} punti)",
    actionUrl: "/dashboard/gamification",
  },
  "document.signed": {
    title: "Documento firmato",
    bodyTemplate: "{signerName} ha firmato '{documentTitle}'",
    actionUrl: "/dashboard/documents",
  },
  "member.joined": {
    title: "Nuovo membro",
    bodyTemplate: "Un nuovo membro si è unito alla CER",
    actionUrl: "/dashboard/members",
  },
};

// ── Notification Creation ──

function formatTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  options?: { actionUrl?: string; cerId?: string; channel?: string }
): Promise<NotificationRecord> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      actionUrl: options?.actionUrl || null,
      cerId: options?.cerId || null,
      channel: options?.channel || "in_app",
    },
  });

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    actionUrl: notification.actionUrl,
    read: notification.read,
    channel: notification.channel,
    createdAt: notification.createdAt.toISOString(),
  };
}

/**
 * Create notifications for all affected users based on a domain event.
 */
export async function notifyFromEvent(event: DomainEvent): Promise<void> {
  const config = EVENT_TO_NOTIFICATION[event.type];
  if (!config) return;

  const title = config.title;
  const body = formatTemplate(config.bodyTemplate, event.payload as Record<string, unknown>);

  // Find affected users (all users in the CER)
  const cerId = event.cerId || "cer-forli-centro";
  const users = await prisma.user.findMany({
    where: { cerId },
    select: { id: true },
  });

  const category = EVENT_TO_CATEGORY[event.type];

  for (const user of users) {
    // Check notification preferences
    if (category) {
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId_category: { userId: user.id, category } },
      });
      if (pref && !pref.inAppEnabled) continue;
    }

    await createNotification(user.id, event.type, title, body, {
      actionUrl: config.actionUrl,
      cerId,
    });
  }

  // Send push notifications for high-priority events
  const highPriorityEvents: DomainEventType[] = [
    "vote.opened", "anomaly.detected", "invoice.generated", "achievement.earned",
  ];

  if (highPriorityEvents.includes(event.type as DomainEventType)) {
    await sendPushToUsers(users.map(u => u.id), title, body, config.actionUrl);
  }
}

// ── Web Push (VAPID) ──

export async function subscribePush(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribePush(userId: string, endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });
}

async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  actionUrl?: string
): Promise<void> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey || subscriptions.length === 0) {
    return;
  }

  const messagePayload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: actionUrl || "/dashboard" },
  });
  void messagePayload;

  // In production, use web-push library
  // For now, log the push attempt
  for (const sub of subscriptions) {
    try {
      // web-push.sendNotification(sub, payload, { vapidDetails: { ... } })
      console.log(`[Push] Sending to ${sub.endpoint.slice(0, 50)}...: ${title}`);
    } catch {
      // Remove expired subscription
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    }
  }
}

// ── Email Templates (Italian) ──

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function getEmailTemplate(
  templateName: string,
  data: Record<string, string>
): EmailTemplate {
  const templates: Record<string, (d: Record<string, string>) => EmailTemplate> = {
    welcome: (d) => ({
      subject: "Benvenuto in EnergiaNostra!",
      html: `<h1>Benvenuto, ${d.name}!</h1>
<p>La tua iscrizione alla CER <strong>${d.cerName}</strong> è stata confermata.</p>
<p>Accedi al portale per visualizzare i tuoi consumi e partecipare alle decisioni della comunità.</p>
<p><a href="${d.loginUrl}">Accedi al portale →</a></p>
<p>Cordiali saluti,<br>Il team EnergiaNostra</p>`,
      text: `Benvenuto, ${d.name}! La tua iscrizione alla CER ${d.cerName} è stata confermata.`,
    }),

    invoice: (d) => ({
      subject: `Fattura ${d.invoiceNumber} - EnergiaNostra`,
      html: `<h2>Fattura ${d.invoiceNumber}</h2>
<p>Gentile ${d.memberName},</p>
<p>È stata emessa una fattura per il periodo <strong>${d.period}</strong>.</p>
<table><tr><td>Importo:</td><td><strong>€${d.amount}</strong></td></tr>
<tr><td>Scadenza:</td><td>${d.dueDate}</td></tr></table>
<p><a href="${d.paymentUrl}">Paga ora →</a></p>`,
      text: `Fattura ${d.invoiceNumber} di €${d.amount} - Scadenza: ${d.dueDate}`,
    }),

    vote_invitation: (d) => ({
      subject: `Votazione: ${d.voteTitle} - EnergiaNostra`,
      html: `<h2>Votazione aperta</h2>
<p>Gentile membro,</p>
<p>È stata aperta la votazione: <strong>${d.voteTitle}</strong></p>
<p>${d.voteDescription}</p>
<p>La votazione chiude il <strong>${d.closesAt}</strong>.</p>
<p><a href="${d.voteUrl}">Vota ora →</a></p>`,
      text: `Votazione aperta: ${d.voteTitle}. Chiude il ${d.closesAt}.`,
    }),

    monthly_summary: (d) => ({
      subject: `Riepilogo mensile - ${d.month} - EnergiaNostra`,
      html: `<h2>Riepilogo ${d.month}</h2>
<p>Gentile ${d.memberName},</p>
<p>Ecco il riepilogo della tua CER per ${d.month}:</p>
<ul>
<li>Energia prodotta: <strong>${d.productionKwh} kWh</strong></li>
<li>Energia condivisa: <strong>${d.sharedKwh} kWh</strong></li>
<li>Risparmio: <strong>€${d.savings}</strong></li>
<li>CO₂ evitata: <strong>${d.co2Avoided} kg</strong></li>
</ul>`,
      text: `Riepilogo ${d.month}: Produzione ${d.productionKwh} kWh, Risparmio €${d.savings}`,
    }),

    password_reset: (d) => ({
      subject: "Reset password - EnergiaNostra",
      html: `<h2>Reset Password</h2>
<p>Hai richiesto il reset della password.</p>
<p><a href="${d.resetUrl}">Reimposta la password →</a></p>
<p>Il link scade tra 1 ora.</p>
<p>Se non hai richiesto il reset, ignora questa email.</p>`,
      text: `Reset password: ${d.resetUrl}`,
    }),
  };

  const templateFn = templates[templateName];
  if (!templateFn) {
    return {
      subject: "EnergiaNostra",
      html: `<p>${JSON.stringify(data)}</p>`,
      text: JSON.stringify(data),
    };
  }
  return templateFn(data);
}

/**
 * Send email via configured provider (SendGrid/Resend).
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "noreply@energianostra.it";
  const fromName = process.env.EMAIL_FROM_NAME || "EnergiaNostra";

  if (!apiKey) {
    console.log(`[Email] (demo) To: ${to} | Subject: ${template.subject}`);
    return { success: true, messageId: `demo_${crypto.randomUUID().slice(0, 8)}` };
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject: template.subject,
        content: [
          { type: "text/plain", value: template.text },
          { type: "text/html", value: template.html },
        ],
      }),
    });

    return {
      success: response.ok,
      messageId: response.headers.get("x-message-id") || undefined,
    };
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return { success: false };
  }
}

// ── Notification Preferences ──

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId },
  });

  const allCategories: NotificationCategory[] = [
    "billing", "voting", "energy", "trading", "governance", "gamification",
  ];

  return {
    userId,
    categories: allCategories.map(cat => {
      const existing = prefs.find(p => p.category === cat);
      return {
        category: cat,
        pushEnabled: existing?.pushEnabled ?? true,
        emailEnabled: existing?.emailEnabled ?? true,
        inAppEnabled: existing?.inAppEnabled ?? true,
      };
    }),
  };
}

export async function updateNotificationPreference(
  userId: string,
  category: NotificationCategory,
  updates: { pushEnabled?: boolean; emailEnabled?: boolean; inAppEnabled?: boolean }
): Promise<void> {
  await prisma.notificationPreference.upsert({
    where: { userId_category: { userId, category } },
    update: updates,
    create: {
      userId,
      category,
      pushEnabled: updates.pushEnabled ?? true,
      emailEnabled: updates.emailEnabled ?? true,
      inAppEnabled: updates.inAppEnabled ?? true,
    },
  });
}

// ── Notification Queries ──

export async function getNotifications(
  userId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<NotificationRecord[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit || 50,
  });

  return notifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    actionUrl: n.actionUrl,
    read: n.read,
    channel: n.channel,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

// ── Event Bus Integration ──
// Wire domain events to notification creation

export function setupNotificationListeners(): void {
  eventBus.on("*", async (event: DomainEvent) => {
    try {
      await notifyFromEvent(event);
    } catch (err) {
      console.error("[Notifications] Error processing event:", err);
    }
  });
}
