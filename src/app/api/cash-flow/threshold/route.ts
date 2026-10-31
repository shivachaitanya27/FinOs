import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, minimumCashBalance, userId } = body;

    if (minimumCashBalance === undefined || isNaN(Number(minimumCashBalance))) {
      return NextResponse.json(
        { error: "A valid numerical minimumCashBalance is required" },
        { status: 400 }
      );
    }

    const numThreshold = Math.max(0, Number(minimumCashBalance));

    // Find business
    let business;
    if (businessId) {
      business = await prisma.business.findUnique({ where: { id: businessId } });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const previousThreshold = business.minimumCashBalance;

    // Update business threshold
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        minimumCashBalance: numThreshold,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        businessId: business.id,
        userId: userId || null,
        action: "MINIMUM_CASH_BALANCE_UPDATED",
        entityType: "BUSINESS",
        entityId: business.id,
        details: JSON.stringify({
          previousThreshold,
          newThreshold: numThreshold,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      business: updated,
      message: `Minimum cash reserve threshold updated to ₹${numThreshold.toLocaleString("en-IN")}`,
    });
  } catch (error: any) {
    console.error("Error updating cash threshold:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update cash threshold" },
      { status: 500 }
    );
  }
}

