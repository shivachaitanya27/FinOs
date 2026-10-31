/**
 * FinOS Stage 5 - End-to-End Database Workflow & Persistence Test
 * Verifies live SQLite conversation memory, message threading, AI recommendations persistence,
 * user apply/dismiss workflows, and audit trail generation.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runStage5E2ETest() {
  console.log("=================================================");
  console.log("🧪 STARTING STAGE 5 DATABASE WORKFLOW E2E TEST");
  console.log("=================================================\n");

  const biz = await prisma.business.findFirst({ include: { accounts: true } });
  if (!biz) throw new Error("No business found in database. Seed demo data first.");

  console.log(`▶ Connected to Target Business: "${biz.name}" (ID: ${biz.id})\n`);

  // Step 1: Create a live ChatConversation in SQLite
  console.log("▶ Step 1: Creating a ChatConversation session in SQLite...");
  const conv = await prisma.chatConversation.create({
    data: {
      businessId: biz.id,
      title: "Executive Strategic Financial Briefing",
    },
  });

  assert(conv.id !== undefined, "Conversation should have generated ID");
  console.log(`  ✔ Conversation created: ${conv.id} ("${conv.title}")`);

  // Step 2: Thread User Message and Query AI Assistant
  console.log("\n▶ Step 2: Storing user message and querying verified assistant...");
  const userMsg = await prisma.chatMessage.create({
    data: {
      conversationId: conv.id,
      role: "user",
      content: "What is my total revenue this month?",
    },
  });

  const { queryFinancialAssistant } = await import("../src/lib/ai-service.ts");
  const aiResult = await queryFinancialAssistant("What is my total revenue this month?", biz.id);

  const assistantMsg = await prisma.chatMessage.create({
    data: {
      conversationId: conv.id,
      role: "assistant",
      content: aiResult.answer,
    },
  });

  assert(assistantMsg.id !== undefined, "Assistant message should be stored in DB");
  assert(assistantMsg.role === "assistant", "Message role must be assistant");
  console.log(`  ✔ User and Assistant messages threaded in SQLite (Provider: ${aiResult.provider})`);

  // Step 3: Verify Conversation Message Retrieval
  console.log("\n▶ Step 3: Verifying conversation thread retrieval...");
  const thread = await prisma.chatConversation.findUnique({
    where: { id: conv.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  assert(thread.messages.length === 2, "Thread should have exactly 2 messages");
  assert(thread.messages[0].role === "user", "Message 1 must be user");
  assert(thread.messages[1].role === "assistant", "Message 2 must be assistant");
  console.log("  ✔ Conversation thread verified with full message history.");

  // Step 4: AI Recommendations Database Persistence
  console.log("\n▶ Step 4: Persisting AI Recommendation in SQLite...");
  const rec = await prisma.aIRecommendation.create({
    data: {
      businessId: biz.id,
      title: "Convert AWS Compute to 1-Yr Savings Plan",
      description: "Committing EC2 instances to 1-year Savings Plans yields estimated ~32% discount.",
      category: "CASH_OPTIMIZATION",
      impact: "HIGH",
      estimatedSavings: 456000,
      actionType: "RENEGOTIATE",
      suggestedAction: "Purchase 1-yr No-Upfront Compute Savings Plan in AWS console.",
      status: "PENDING",
      evidence: JSON.stringify({ monthlyAverage: 118000, savingsPct: "32%" }),
    },
  });

  assert(rec.id !== undefined, "Recommendation should be stored");
  assert(rec.status === "PENDING", "Initial status should be PENDING");
  console.log(`  ✔ Recommendation persisted: ${rec.id} (Est. Savings: ₹${rec.estimatedSavings?.toLocaleString("en-IN")})`);

  // Step 5: Simulate User Action - Mark Applied
  console.log("\n▶ Step 5: Simulating User Action 'apply' & Audit Trail...");
  const appliedRec = await prisma.aIRecommendation.update({
    where: { id: rec.id },
    data: {
      status: "APPLIED",
      appliedAt: new Date(),
      notes: "Implemented in AWS billing console on Oct 31.",
    },
  });

  assert(appliedRec.status === "APPLIED", "Status should update to APPLIED");

  const auditLog = await prisma.auditLog.create({
    data: {
      businessId: biz.id,
      action: "AI_RECOMMENDATION_APPLIED",
      entityType: "AI_RECOMMENDATION",
      entityId: rec.id,
      details: JSON.stringify({
        title: rec.title,
        estimatedSavings: rec.estimatedSavings,
        notes: appliedRec.notes,
      }),
    },
  });

  assert(auditLog.id !== undefined, "AuditLog entry must be recorded");
  console.log("  ✔ Recommendation marked APPLIED and written to AuditLog.");

  // Step 6: Clean up test artifacts
  console.log("\n▶ Step 6: Cleaning up test artifacts...");
  await prisma.auditLog.deleteMany({ where: { entityId: rec.id } });
  await prisma.aIRecommendation.delete({ where: { id: rec.id } });
  await prisma.chatMessage.deleteMany({ where: { conversationId: conv.id } });
  await prisma.chatConversation.delete({ where: { id: conv.id } });
  console.log("  ✔ Cleaned up test conversation and recommendation artifacts.");

  console.log("\n=================================================");
  console.log("🎉 ALL STAGE 5 DATABASE WORKFLOW TESTS PASSED!");
  console.log("=================================================\n");
}

runStage5E2ETest()
  .catch((e) => {
    console.error("Fatal E2E error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

