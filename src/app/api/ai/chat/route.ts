import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryFinancialAssistant, ChatMessageInput } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, businessId: bodyBizId, userId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Resolve active business
    let business;
    if (bodyBizId) {
      business = await prisma.business.findUnique({ where: { id: bodyBizId } });
    } else {
      business = await prisma.business.findFirst();
    }

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 2. Resolve or create ChatConversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      // Guard: Ensure conversation belongs to the requested business (Business-level isolation!)
      if (conversation && conversation.businessId !== business.id) {
        return NextResponse.json(
          { error: "Unauthorized: Conversation does not belong to the selected business" },
          { status: 403 }
        );
      }
    }

    if (!conversation) {
      // Create new conversation with clean title from message snippet
      const titleSnippet = message.slice(0, 32).trim() + (message.length > 32 ? "..." : "");
      conversation = await prisma.chatConversation.create({
        data: {
          businessId: business.id,
          userId: userId || null,
          title: titleSnippet || "Financial Strategy Chat",
        },
        include: { messages: true },
      });
    }

    // 3. Save User Message to database
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message.trim(),
      },
    });

    // 4. Prepare conversation history
    const history: ChatMessageInput[] = (conversation.messages || []).map((m) => ({
      role: m.role as any,
      content: m.content,
    }));

    // 5. Query AI Assistant (using verified business financial context)
    const result = await queryFinancialAssistant(message, business.id, history);

    // 6. Save Assistant Response to database
    const assistantMsg = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: result.answer,
      },
    });

    // Update conversation updatedAt timestamp
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: {
        id: assistantMsg.id,
        role: "assistant",
        content: result.answer,
        createdAt: assistantMsg.createdAt,
      },
      provider: result.provider,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process AI chat message" },
      { status: 500 }
    );
  }
}

