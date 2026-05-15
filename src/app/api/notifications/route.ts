import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  subscribePush,
  unsubscribePush,
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/notifications";
import type { NotificationCategory } from "@/lib/notifications";
import { createApiHandler, ApiError } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = createApiHandler({
  auth: { required: true },
  handler: async ({ session, searchParams }) => {
    const userId = session!.user.id;
    const view = searchParams.get("view");

    if (view === "unread-count") {
      const count = await getUnreadCount(userId);
      return { data: { count } };
    }

    if (view === "preferences") {
      const prefs = await getNotificationPreferences(userId);
      return { data: { preferences: prefs } };
    }

    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50") || 50, 1), 200);
    const notifications = await getNotifications(userId, { unreadOnly, limit });
    return { data: { notifications } };
  },
});

export const POST = createApiHandler({
  auth: { required: true },
  handler: async ({ request, session }) => {
    const userId = session!.user.id;

    let body: {
      action?: string;
      notificationId?: string;
      subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
      endpoint?: string;
      category?: NotificationCategory;
      pushEnabled?: boolean;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
    };

    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Corpo della richiesta non valido (JSON malformato).");
    }

    if (!body || typeof body !== "object" || typeof body.action !== "string") {
      throw new ApiError(400, "Campo 'action' obbligatorio.");
    }

    switch (body.action) {
      case "mark-read": {
        if (!body.notificationId) {
          throw new ApiError(400, "notificationId obbligatorio");
        }
        await markAsRead(body.notificationId);
        return { data: { success: true } };
      }

      case "mark-all-read": {
        await markAllAsRead(userId);
        return { data: { success: true } };
      }

      case "subscribe-push": {
        if (!body.subscription) {
          throw new ApiError(400, "subscription obbligatorio");
        }
        await subscribePush(userId, body.subscription);
        return { data: { success: true } };
      }

      case "unsubscribe-push": {
        if (!body.endpoint) {
          throw new ApiError(400, "endpoint obbligatorio");
        }
        await unsubscribePush(userId, body.endpoint);
        return { data: { success: true } };
      }

      case "update-preference": {
        if (!body.category) {
          throw new ApiError(400, "category obbligatorio");
        }
        await updateNotificationPreference(userId, body.category, {
          pushEnabled: body.pushEnabled,
          emailEnabled: body.emailEnabled,
          inAppEnabled: body.inAppEnabled,
        });
        return { data: { success: true } };
      }

      default:
        throw new ApiError(400, "Azione non riconosciuta");
    }
  },
});
