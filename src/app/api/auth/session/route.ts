import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("finos_session");

    if (!sessionCookie?.value) {
      // Check if any business exists, if so return demo fallback for preview convenience
      const defaultBiz = await prisma.business.findFirst({
        include: { memberships: { include: { user: true } } },
      });

      if (defaultBiz && defaultBiz.memberships.length > 0) {
        const mem = defaultBiz.memberships[0];
        const payload = {
          userId: mem.user.id,
          email: mem.user.email,
          name: mem.user.name,
          role: mem.role,
          businessId: defaultBiz.id,
          businessName: defaultBiz.name,
          currency: defaultBiz.currency,
        };
        return NextResponse.json({ authenticated: true, session: payload });
      }

      return NextResponse.json({ authenticated: false, session: null });
    }

    const session = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, session });
  } catch (error) {
    return NextResponse.json({ authenticated: false, session: null });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("finos_session");
  return response;
}
