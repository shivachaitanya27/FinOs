import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  syncNotifications,
} from "@/lib/notification-service.ts";
import { prisma } from "@/lib/prisma.ts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await getNotifications(businessId, limit);
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, markAll, businessId } = body;

    if (markAll) {
      const count = await markAllNotificationsAsRead(businessId);
      return NextResponse.json({ success: true, updatedCount: count });
    }

    if (id) {
      const ok = await markNotificationAsRead(id);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json(
      { success: false, error: "Either id or markAll must be provided" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, businessId, title, message, type, linkUrl } = body;

    if (action === "sync") {
      const result = await syncNotifications(businessId);
      return NextResponse.json({ success: true, ...result });
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "title and message are required" },
        { status: 400 }
      );
    }

    let bId = businessId;
    if (!bId) {
      const biz = await prisma.business.findFirst();
      bId = biz?.id;
    }

    if (!bId) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 }
      );
    }

    const notif = await createNotification({
      businessId: bId,
      title,
      message,
      type: type || "INFO",
      linkUrl,
    });

    return NextResponse.json({ success: true, notification: notif });
  } catch (error: any) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to handle notification" },
      { status: 500 }
    );
  }
}

