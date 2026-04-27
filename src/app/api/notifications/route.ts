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

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-admin-1";
  const view = searchParams.get("view");

  if (view === "unread-count") {
    const count = await getUnreadCount(userId);
    return Response.json({ count });
  }

  if (view === "preferences") {
    const prefs = await getNotificationPreferences(userId);
    return Response.json({ preferences: prefs });
  }

  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");
  const notifications = await getNotifications(userId, { unreadOnly, limit });
  return Response.json({ notifications });
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action: string;
    userId?: string;
    notificationId?: string;
    subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
    endpoint?: string;
    category?: NotificationCategory;
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
  };

  const userId = body.userId || "user-admin-1";

  switch (body.action) {
    case "mark-read": {
      if (!body.notificationId) {
        return Response.json({ error: "notificationId obbligatorio" }, { status: 400 });
      }
      await markAsRead(body.notificationId);
      return Response.json({ success: true });
    }

    case "mark-all-read": {
      await markAllAsRead(userId);
      return Response.json({ success: true });
    }

    case "subscribe-push": {
      if (!body.subscription) {
        return Response.json({ error: "subscription obbligatorio" }, { status: 400 });
      }
      await subscribePush(userId, body.subscription);
      return Response.json({ success: true });
    }

    case "unsubscribe-push": {
      if (!body.endpoint) {
        return Response.json({ error: "endpoint obbligatorio" }, { status: 400 });
      }
      await unsubscribePush(userId, body.endpoint);
      return Response.json({ success: true });
    }

    case "update-preference": {
      if (!body.category) {
        return Response.json({ error: "category obbligatorio" }, { status: 400 });
      }
      await updateNotificationPreference(userId, body.category, {
        pushEnabled: body.pushEnabled,
        emailEnabled: body.emailEnabled,
        inAppEnabled: body.inAppEnabled,
      });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
  }
}
