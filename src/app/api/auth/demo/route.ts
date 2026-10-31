import { NextResponse } from "next/server";
import { prisma, ensureDatabaseReady } from "@/lib/prisma";
import { seedDemoData } from "@/lib/seed-data";

export async function POST() {
  try {
    let user = null;

    try {
      user = await prisma.user.findUnique({
        where: { email: "aarav.sharma@bharattech.in" },
        include: {
          memberships: {
            include: { business: true },
          },
        },
      });
    } catch (dbErr: any) {
      console.warn("Database or tables not initialized, bootstrapping database:", dbErr.message);
      ensureDatabaseReady(true);
    }

    // If user not found or memberships empty, automatically seed fresh demo data
    if (!user || !user.memberships || user.memberships.length === 0) {
      console.log("Seeding fresh demo database for evaluation...");
      await seedDemoData();
      user = await prisma.user.findUnique({
        where: { email: "aarav.sharma@bharattech.in" },
        include: {
          memberships: {
            include: { business: true },
          },
        },
      });
    }

    if (!user || !user.memberships || user.memberships.length === 0) {
      return NextResponse.json(
        { error: "Could not initialize demo user. Please retry." },
        { status: 500 }
      );
    }

    const business = user.memberships[0].business;
    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.memberships[0].role,
      businessId: business.id,
      businessName: business.name,
      currency: business.currency,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set("finos_session", JSON.stringify(sessionPayload), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Demo login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
