import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendationId, action, notes, userId } = body;

    if (!recommendationId || !action) {
      return NextResponse.json(
        { error: "recommendationId and action are required" },
        { status: 400 }
      );
    }

    const rec = await prisma.aIRecommendation.findUnique({
      where: { id: recommendationId },
      include: { business: true },
    });

    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    let nextStatus = rec.status;
    let auditAction = "AI_RECOMMENDATION_UPDATED";

    if (action === "apply") {
      nextStatus = "APPLIED";
      auditAction = "AI_RECOMMENDATION_APPLIED";
    } else if (action === "dismiss") {
      nextStatus = "DISMISSED";
      auditAction = "AI_RECOMMENDATION_DISMISSED";
    } else if (action === "save_notes") {
      auditAction = "AI_RECOMMENDATION_NOTES_SAVED";
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    const updated = await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: nextStatus,
        notes: notes !== undefined ? notes : rec.notes,
        appliedAt: action === "apply" ? new Date() : rec.appliedAt,
      },
    });

    // Save into AuditLog
    await prisma.auditLog.create({
      data: {
        businessId: rec.businessId,
        userId: userId || null,
        action: auditAction,
        entityType: "AI_RECOMMENDATION",
        entityId: rec.id,
        details: JSON.stringify({
          title: rec.title,
          category: rec.category,
          estimatedSavings: rec.estimatedSavings,
          previousStatus: rec.status,
          newStatus: nextStatus,
          notes: notes || null,
          action,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      recommendation: updated,
      message: `Recommendation marked as ${action} successfully`,
    });
  } catch (error: any) {
    console.error("Error executing recommendation action:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update recommendation" },
      { status: 500 }
    );
  }
}

