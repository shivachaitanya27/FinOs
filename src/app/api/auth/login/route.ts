import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { business: true },
        },
      },
    });

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
      businessName: business?.name || "My Business",
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
