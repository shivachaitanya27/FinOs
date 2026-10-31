import { prisma } from "./prisma.ts";

export interface FinNotification {
  id: string;
  businessId?: string | null;
  userId?: string | null;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: Date;
}

/**
 * Synchronizes in-app notifications with active business risks, bank reconciliation statuses,
 * imported files, and cash shortages.
 */
export async function syncNotifications(targetBusinessId?: string): Promise<{ createdCount: number }> {
  try {
    let businessId = targetBusinessId;
    if (!businessId) {
      const defaultBiz = await prisma.business.findFirst({ select: { id: true } });
      if (!defaultBiz) return { createdCount: 0 };
      businessId = defaultBiz.id;
    }

    let createdCount = 0;

    // 1. Check existing notifications within the last 7 days to avoid duplicates
    const existingNotifications = await prisma.notification.findMany({
      where: {
        businessId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { title: true },
    });
    const existingTitles = new Set(existingNotifications.map((n) => n.title));

    // 2. Scan active RiskAlert records in DB
    const activeRiskAlerts = await prisma.riskAlert.findMany({
      where: {
        businessId,
        status: "ACTIVE",
        severity: { in: ["CRITICAL", "HIGH"] },
      },
      take: 5,
    });

    for (const alert of activeRiskAlerts) {
      if (!existingTitles.has(alert.title)) {
        await prisma.notification.create({
          data: {
            businessId,
            title: alert.title,
            message: alert.description,
            type: alert.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
            linkUrl: "/financial-risks",
            isRead: false,
          },
        });
        existingTitles.add(alert.title);
        createdCount++;
      }
    }

    // 3. Scan Unreconciled Bank Records
    const unmatchedCount = await prisma.transaction.count({
      where: {
        businessId,
        reconciledWithId: null,
        status: { not: "RECONCILED" },
      },
    });

    const unrecTitle = "Pending Bank Reconciliation";
    if (unmatchedCount > 0 && !existingTitles.has(unrecTitle)) {
      await prisma.notification.create({
        data: {
          businessId,
          title: unrecTitle,
          message: `${unmatchedCount} imported bank transactions require reconciliation against books.`,
          type: "WARNING",
          linkUrl: "/reconciliation",
          isRead: false,
        },
      });
      existingTitles.add(unrecTitle);
      createdCount++;
    }

    // 4. Scan Recent File Imports
    const recentImport = await prisma.importedFile.findFirst({
      where: { businessId },
      orderBy: { uploadedAt: "desc" },
    });

    if (recentImport) {
      const importTitle = `Import Completed: ${recentImport.fileName}`;
      if (!existingTitles.has(importTitle)) {
        await prisma.notification.create({
          data: {
            businessId,
            title: importTitle,
            message: `Successfully processed ${recentImport.validCount} transactions (${recentImport.source}).`,
            type: "SUCCESS",
            linkUrl: "/data-management",
            isRead: false,
          },
        });
        existingTitles.add(importTitle);
        createdCount++;
      }
    }

    // 5. If no notifications exist yet at all, add a welcome guidance notification
    const totalExisting = await prisma.notification.count({ where: { businessId } });
    if (totalExisting === 0) {
      await prisma.notification.create({
        data: {
          businessId,
          title: "Welcome to FinOS Intelligence",
          message: "Financial risk monitoring and daily reconciliation alerts are active for your workspace.",
          type: "INFO",
          linkUrl: "/reports",
          isRead: false,
        },
      });
      createdCount++;
    }

    return { createdCount };
  } catch (error) {
    console.error("Failed to sync notifications:", error);
    return { createdCount: 0 };
  }
}

/**
 * Get all notifications for the active business, auto-syncing if needed.
 */
export async function getNotifications(
  businessId?: string,
  limit: number = 20
): Promise<{ notifications: FinNotification[]; unreadCount: number }> {
  try {
    let bId = businessId;
    if (!bId) {
      const defaultBiz = await prisma.business.findFirst({ select: { id: true } });
      if (!defaultBiz) return { notifications: [], unreadCount: 0 };
      bId = defaultBiz.id;
    }

    // Auto sync state
    await syncNotifications(bId);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { businessId: bId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { businessId: bId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        businessId: n.businessId,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: (n.type as any) || "INFO",
        isRead: n.isRead,
        linkUrl: n.linkUrl,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return true;
  } catch (error) {
    console.error(`Failed to mark notification ${id} as read:`, error);
    return false;
  }
}

/**
 * Mark all unread notifications for a business as read.
 */
export async function markAllNotificationsAsRead(businessId?: string): Promise<number> {
  try {
    let bId = businessId;
    if (!bId) {
      const defaultBiz = await prisma.business.findFirst({ select: { id: true } });
      if (!defaultBiz) return 0;
      bId = defaultBiz.id;
    }

    const res = await prisma.notification.updateMany({
      where: { businessId: bId, isRead: false },
      data: { isRead: true },
    });
    return res.count;
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return 0;
  }
}

/**
 * Manually insert a high-priority notification.
 */
export async function createNotification(data: {
  businessId: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  linkUrl?: string;
}): Promise<FinNotification | null> {
  try {
    const record = await prisma.notification.create({
      data: {
        businessId: data.businessId,
        title: data.title,
        message: data.message,
        type: data.type,
        linkUrl: data.linkUrl || null,
        isRead: false,
      },
    });
    return {
      id: record.id,
      businessId: record.businessId,
      userId: record.userId,
      title: record.title,
      message: record.message,
      type: record.type as any,
      isRead: record.isRead,
      linkUrl: record.linkUrl,
      createdAt: record.createdAt,
    };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
