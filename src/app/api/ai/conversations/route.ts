import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const businessIdParam = request.nextUrl.searchParams.get("businessId");

    let business;
    if (businessIdParam) {
      business = await prisma.business.findUnique({ where: { id: businessIdParam } });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { businessId: business.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const formatted = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      businessId: c.businessId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.content || "No messages yet",
    }));

    return NextResponse.json({ success: true, conversations: formatted });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId: bodyBizId, title, userId } = body;

    let business;
    if (bodyBizId) {
      business = await prisma.business.findUnique({ where: { id: bodyBizId } });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const conversation = await prisma.chatConversation.create({
      data: {
        businessId: business.id,
        userId: userId || null,
        title: title || "New Financial Conversation",
      },
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}

