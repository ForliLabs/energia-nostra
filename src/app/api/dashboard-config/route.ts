import {
  getDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout,
  completeTour,
  toggleWidget,
  reorderWidgets,
  getOnboardingTour,
  getAvailableWidgets,
  getNavItemsForRole,
} from "@/lib/dashboard-config";
import type { UserRole } from "@/lib/auth";
import type { WidgetConfig } from "@/lib/dashboard-config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-admin-1";
  const role = (searchParams.get("role") || "admin") as UserRole;
  const view = searchParams.get("view");

  if (view === "tour") {
    const tour = getOnboardingTour(role);
    return Response.json({ tour });
  }

  if (view === "widgets") {
    const widgets = getAvailableWidgets(role);
    return Response.json({ widgets });
  }

  if (view === "nav") {
    const navItems = getNavItemsForRole(role);
    return Response.json({ navItems });
  }

  const layout = await getDashboardLayout(userId, role);
  return Response.json(layout);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action: string;
    userId?: string;
    role?: UserRole;
    widgets?: WidgetConfig[];
    widgetId?: string;
    visible?: boolean;
    orderedIds?: string[];
  };

  const userId = body.userId || "user-admin-1";
  const role = body.role || "admin";

  switch (body.action) {
    case "save": {
      if (!body.widgets) {
        return Response.json({ error: "widgets obbligatorio" }, { status: 400 });
      }
      await saveDashboardLayout(userId, body.widgets);
      return Response.json({ success: true });
    }

    case "reset": {
      await resetDashboardLayout(userId);
      return Response.json({ success: true, message: "Layout ripristinato ai valori predefiniti" });
    }

    case "complete-tour": {
      await completeTour(userId);
      return Response.json({ success: true });
    }

    case "toggle-widget": {
      if (!body.widgetId || body.visible === undefined) {
        return Response.json({ error: "widgetId e visible obbligatori" }, { status: 400 });
      }
      const widgets = await toggleWidget(userId, body.widgetId, body.visible, role);
      return Response.json({ widgets });
    }

    case "reorder": {
      if (!body.orderedIds) {
        return Response.json({ error: "orderedIds obbligatorio" }, { status: 400 });
      }
      const widgets = await reorderWidgets(userId, body.orderedIds, role);
      return Response.json({ widgets });
    }

    default:
      return Response.json({ error: "Azione non riconosciuta" }, { status: 400 });
  }
}
