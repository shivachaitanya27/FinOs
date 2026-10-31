import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action, notes, userId } = body;

    if (!alertId || !action) {
      return NextResponse.json(
        { error: "alertId and action are required" },
        { status: 400 }
      );
    }

    const alert = await prisma.riskAlert.findUnique({
      where: { id: alertId },
      include: { business: true },
    });

    if (!alert) {
      return NextResponse.json({ error: "Risk alert not found" }, { status: 404 });
    }

    let nextStatus = alert.status;
    let auditAction = "RISK_ALERT_UPDATED";

    if (action === "mark_reviewed") {
      nextStatus = "REVIEWED";
      auditAction = "RISK_ALERT_REVIEWED";
    } else if (action === "resolve") {
      nextStatus = "RESOLVED";
      auditAction = "RISK_ALERT_RESOLVED";
    } else if (action === "dismiss") {
      nextStatus = "DISMISSED";
      auditAction = "RISK_ALERT_DISMISSED";
    } else if (action === "add_notes") {
      auditAction = "RISK_ALERT_NOTES_ADDED";
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    // Update alert in DB
    const updatedAlert = await prisma.riskAlert.update({
      where: { id: alertId },
      data: {
        status: nextStatus,
        reviewNotes: notes !== undefined ? notes : alert.reviewNotes,
        reviewedAt: action === "mark_reviewed" ? new Date() : alert.reviewedAt,
        resolvedAt: action === "resolve" ? new Date() : alert.resolvedAt,
        reviewedBy: userId || "SYSTEM_USER",
      },
    });

    // Record in AuditLog
    await prisma.auditLog.create({
      data: {
        businessId: alert.businessId,
        userId: userId || null,
        action: auditAction,
        entityType: "RISK_ALERT",
        entityId: alert.id,
        details: JSON.stringify({
          alertTitle: alert.title,
          category: alert.category,
          severity: alert.severity,
          previousStatus: alert.status,
          newStatus: nextStatus,
          notes: notes || null,
          action,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
      message: `Risk alert ${action} completed successfully`,
    });
  } catch (error: any) {
    console.error("Error updating risk alert action:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update risk alert" },
      { status: 500 }
    );
  }
}

