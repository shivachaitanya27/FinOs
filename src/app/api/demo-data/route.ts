import { NextRequest, NextResponse } from "next/server";
import { seedDemoData } from "@/lib/seed-data";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    let businessId: string | undefined;
    let userId: string | undefined;

    try {
      const body = await request.json();
      if (body?.businessId) businessId = body.businessId;
      if (body?.userId) userId = body.userId;
    } catch (_) {}

    // Fall back to authenticated session cookie
    if (!businessId) {
      const sessionCookie = request.cookies.get("finos_session")?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          if (session?.businessId) businessId = session.businessId;
          if (session?.userId && !userId) userId = session.userId;
        } catch (_) {}
      }
    }

    const result = await seedDemoData(businessId, userId);
    return NextResponse.json({
      success: true,
      message: `Sample enterprise dataset successfully seeded for ${result.businessName}`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error seeding sample data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed sample data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const businessIdParam = request.nextUrl.searchParams.get("businessId");

    let business = businessIdParam
      ? await prisma.business.findUnique({ where: { id: businessIdParam } })
      : await prisma.business.findFirst({
          where: { transactions: { some: {} } },
          orderBy: { createdAt: "desc" },
        }) || (await prisma.business.findFirst());

    const count = business
      ? await prisma.transaction.count({ where: { businessId: business.id } })
      : 0;

    return NextResponse.json({
      hasData: count > 0,
      transactionCount: count,
      business: business ? { id: business.id, name: business.name } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ hasData: false, error: error.message });
  }
}
