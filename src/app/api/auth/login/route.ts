import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDemoData } from "@/lib/seed-data";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: { business: true },
          },
        },
      });
    } catch (queryErr: any) {
      console.warn("Database error during login, attempting schema auto-sync:", queryErr.message);
      try {
        execSync("npx prisma db push --skip-generate", { stdio: "pipe" });
        await seedDemoData();
        user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: { business: true },
            },
          },
        });
      } catch (recoveryErr) {
        console.error("Auto-sync recovery error:", recoveryErr);
      }
    }

    // If attempting to login as demo user and database is empty, seed automatically
    if (!user && (email.includes("bharattech.in") || email === "aarav.sharma@bharattech.in")) {
      await seedDemoData();
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: { business: true },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials or account not found" },
        { status: 401 }
      );
    }

    // Default business
    const business = user.memberships[0]?.business || (await prisma.business.findFirst());

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.memberships[0]?.role || "ADMIN",
      businessId: business?.id || "default",
      businessName: business?.name || "BharatTech Solutions",
      currency: business?.currency || "INR",
    };

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set("finos_session", JSON.stringify(sessionPayload), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
