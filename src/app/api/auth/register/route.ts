import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, businessName, industry } = await request.json();

    if (!email || !name || !businessName) {
      return NextResponse.json(
        { error: "Name, email, and business name are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create user and business in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: password || "secure_default",
          role: "OWNER",
        },
      });

      const business = await tx.business.create({
        data: {
          name: businessName,
          currency: "INR",
          industry: industry || "Technology & Services",
          fiscalYearStart: "APRIL",
          memberships: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
          accounts: {
            create: {
              name: "Primary Operating Bank Account",
              accountType: "BANK",
              currentBalance: 0,
              currency: "INR",
              isDefault: true,
            },
          },
        },
      });

      return { user, business };
    });

    const sessionPayload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: "OWNER",
      businessId: result.business.id,
      businessName: result.business.name,
      currency: result.business.currency,
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
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
