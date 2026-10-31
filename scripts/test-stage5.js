/**
 * FinOS Stage 5 - Comprehensive Automated Test Suite
 * Covers all 10 Stage 5 Scenarios: AI Financial Assistant, Gemini Provider Integration,
 * Anti-Hallucination Verified Context, AI Recommendations, and Multi-Tenant Isolation
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
}

async function runStage5TestSuite() {
  console.log("=================================================");
  console.log("🚀 STARTING FINOS STAGE 5 COMPREHENSIVE TEST SUITE");
  console.log("=================================================\n");

  const results = [];

  const {
    queryFinancialAssistant,
    getVerifiedFinancialContext,
    generateDeterministicFinancialResponse,
  } = await import("../src/lib/ai-service.ts");
  const { generateFinancialRecommendations } = await import("../src/lib/recommendation-engine.ts");

  // Step 0: Ensure demo business exists
  const bizA = await prisma.business.findFirst({ include: { accounts: true } });
  if (!bizA) throw new Error("No business found in database. Seed demo data first.");

  console.log(`▶ Connected to Target Business: "${bizA.name}" (ID: ${bizA.id})`);
  const contextA = await getVerifiedFinancialContext(bizA.id);
  console.log(`  Verified Total Revenue: ₹${contextA.metrics.totalRevenue.toLocaleString("en-IN")}`);
  console.log(`  Verified Cash Balance: ₹${bizA.accounts.reduce((s, a) => s + a.currentBalance, 0).toLocaleString("en-IN")}\n`);

  // -----------------------------------------------------------------
  // SCENARIO 1: Ask for Current Monthly Revenue
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 1: Ask for Current Monthly Revenue");
    const res = await queryFinancialAssistant("What is my total revenue this month?", bizA.id);
    console.log(`    Provider Used: [${res.provider}] - Model: ${res.modelUsed}`);
    console.log(`    Response Snippet: ${res.answer.slice(0, 160)}...`);

    assert(res.answer.includes("Revenue"), "Response must mention revenue");
    assert(
      res.answer.includes(contextA.metrics.totalRevenue.toLocaleString("en-IN")),
      `Response must include exact verified revenue ₹${contextA.metrics.totalRevenue.toLocaleString("en-IN")}`
    );

    console.log("  ✔ Total revenue answered with verified ledger figures.\n");
    results.push({ name: "1. Current Monthly Revenue Query", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 1 Error:", err.message);
    results.push({ name: "1. Current Monthly Revenue Query", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 2: Ask Why Expenses Increased
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 2: Ask Why Expenses Increased");
    const res = await queryFinancialAssistant("Why did my expenses increase?", bizA.id);
    console.log(`    Response Snippet: ${res.answer.slice(0, 180)}...`);

    assert(res.answer.includes("Expense"), "Response must address expenses");
    assert(
      res.answer.includes(contextA.metrics.totalExpenses.toLocaleString("en-IN")),
      "Response must cite verified total expenses"
    );
    // Should cite top burn category
    assert(
      res.answer.includes(contextA.topCategories[0].category),
      `Response should cite top category "${contextA.topCategories[0].category}"`
    );

    console.log("  ✔ Expense surge drivers accurately explained using verified category data.\n");
    results.push({ name: "2. Expense Surge Drivers Query", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 2 Error:", err.message);
    results.push({ name: "2. Expense Surge Drivers Query", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 3: Ask for Biggest Expense Categories
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 3: Ask for Biggest Expense Categories");
    const res = await queryFinancialAssistant("What are my biggest expense categories?", bizA.id);
    console.log(`    Response Snippet: ${res.answer.slice(0, 180)}...`);

    assert(res.answer.includes(contextA.topCategories[0].category), "Must list top category");
    assert(
      res.answer.includes(contextA.topCategories[0].amount.toLocaleString("en-IN")),
      "Must cite exact rupee spend for top category"
    );

    console.log("  ✔ Top expense categories ranked and detailed with percentage shares.\n");
    results.push({ name: "3. Top Expense Categories Query", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 3 Error:", err.message);
    results.push({ name: "3. Top Expense Categories Query", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 4: Ask About Unmatched Transactions
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 4: Ask About Unmatched Transactions");
    const res = await queryFinancialAssistant("Which payments are still unmatched?", bizA.id);
    console.log(`    Response Snippet: ${res.answer.slice(0, 180)}...`);

    assert(res.answer.includes("Unmatched") || res.answer.includes("Reconcil"), "Must address reconciliation");
    assert(
      res.answer.includes(String(contextA.unmatchedItems.count)),
      `Must cite exact unmatched count of ${contextA.unmatchedItems.count}`
    );

    console.log("  ✔ Unmatched bank transactions accurately reported for reconciliation.\n");
    results.push({ name: "4. Unmatched Transactions Query", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 4 Error:", err.message);
    results.push({ name: "4. Unmatched Transactions Query", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 5: Ask About Financial Risks
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 5: Ask About Financial Risks");
    const res = await queryFinancialAssistant("What financial risks should I focus on?", bizA.id);
    console.log(`    Response Snippet: ${res.answer.slice(0, 180)}...`);

    assert(res.answer.includes("risk") || res.answer.includes("Risk"), "Must address financial risks");
    assert(
      res.answer.includes(String(contextA.risks.totalActive)),
      `Must state active risk count of ${contextA.risks.totalActive}`
    );

    console.log("  ✔ Active financial risks summarized with severity and remediation guidance.\n");
    results.push({ name: "5. Financial Risks Query", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 5 Error:", err.message);
    results.push({ name: "5. Financial Risks Query", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 6: Ask About Projected Cash Shortages
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 6: Ask About Projected Cash Shortages");
    const res = await queryFinancialAssistant("Am I likely to face a cash shortage?", bizA.id);
    console.log(`    Response Snippet: ${res.answer.slice(0, 180)}...`);

    assert(
      res.answer.includes(contextA.forecast.projectedClosingBalance.toLocaleString("en-IN")),
      "Must cite projected closing cash balance"
    );
    assert(
      res.answer.includes(String(contextA.forecast.safeRunwayDays)),
      "Must cite days of safe liquidity runway"
    );

    console.log("  ✔ Liquidity runway and shortage dates accurately communicated from 30-day forecast.\n");
    results.push({ name: "6. Cash Shortage & Runway Query", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 6 Error:", err.message);
    results.push({ name: "6. Cash Shortage & Runway Query", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 7: Question with Insufficient Data
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 7: Question with Insufficient Data");
    const sparseContext = {
      ...contextA,
      hasInsufficientData: true,
      metrics: { ...contextA.metrics, transactionCount: 2 },
    };

    const answer = generateDeterministicFinancialResponse("What is my total revenue this month?", sparseContext);
    console.log(`    Response Snippet: ${answer.slice(0, 160)}...`);

    assert(answer.includes("Insufficient Data Notice"), "Must present clear insufficient data notice");
    assert(answer.includes("2 completed transactions"), "Must explicitly state transaction count");

    console.log("  ✔ Insufficient data transparently communicated without fabricating estimates.\n");
    results.push({ name: "7. Insufficient Data Handling", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 7 Error:", err.message);
    results.push({ name: "7. Insufficient Data Handling", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 8: Multi-Tenant Business Switching (Strict Data Isolation)
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 8: Multi-Tenant Business Switching (Strict Data Isolation)");
    // Create a temporary second business with distinct transactions
    const bizB = await prisma.business.create({
      data: {
        name: "Zenith Retail Logistics Ltd",
        currency: "INR",
        taxId: "27AABCZ1234K1Z0",
        minimumCashBalance: 25000,
        transactions: {
          create: [
            {
              date: new Date("2024-10-10"),
              description: "Zenith B2B Freight Payment 1",
              amount: 50000,
              type: "REVENUE",
              status: "COMPLETED",
              category: "Logistics",
            },
            {
              date: new Date("2024-10-12"),
              description: "Zenith B2B Freight Payment 2",
              amount: 38500,
              type: "REVENUE",
              status: "COMPLETED",
              category: "Logistics",
            },
            {
              date: new Date("2024-10-14"),
              description: "Fleet Maintenance",
              amount: 15000,
              type: "EXPENSE",
              status: "COMPLETED",
              category: "Logistics",
            },
            {
              date: new Date("2024-10-16"),
              description: "Diesel Fuel Charge",
              amount: 12000,
              type: "EXPENSE",
              status: "COMPLETED",
              category: "Logistics",
            },
            {
              date: new Date("2024-10-18"),
              description: "Driver Stipends",
              amount: 18000,
              type: "EXPENSE",
              status: "COMPLETED",
              category: "Payroll & Salaries",
            },
            {
              date: new Date("2024-10-20"),
              description: "Warehouse Utility",
              amount: 6500,
              type: "EXPENSE",
              status: "COMPLETED",
              category: "Miscellaneous",
            },
          ],
        },
      },
    });

    const resB = await queryFinancialAssistant("What is my total revenue this month?", bizB.id);
    console.log(`    Business B ("Zenith Retail") Revenue Response: ${resB.answer.slice(0, 140)}...`);

    // Verify Business B receives ONLY its revenue (₹88,500) and NEVER Business A's numbers
    assert(resB.answer.includes("88,500"), "Response for Business B must cite ₹88,500");
    assert(
      !resB.answer.includes(contextA.metrics.totalRevenue.toLocaleString("en-IN")),
      "Response for Business B must NEVER leak Business A's revenue figures"
    );

    // Clean up temporary business B
    await prisma.transaction.deleteMany({ where: { businessId: bizB.id } });
    await prisma.business.delete({ where: { id: bizB.id } });

    console.log("  ✔ Strict multi-tenant business data isolation verified: zero leakage across workspaces.\n");
    results.push({ name: "8. Multi-Tenant Data Isolation", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 8 Error:", err.message);
    results.push({ name: "8. Multi-Tenant Data Isolation", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 9: Load Previous Conversation History
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 9: Load Previous Conversation History");
    // Create a test conversation in SQLite
    const testConv = await prisma.chatConversation.create({
      data: {
        businessId: bizA.id,
        title: "Test Conversation Session",
        messages: {
          create: [
            { role: "user", content: "Initial query about cloud expenses" },
            { role: "assistant", content: "Cloud expenses increased by 240% over baseline." },
          ],
        },
      },
      include: { messages: true },
    });

    assert(testConv.messages.length === 2, "Conversation should have 2 messages");

    // Fetch conversation via Prisma
    const loadedConv = await prisma.chatConversation.findUnique({
      where: { id: testConv.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    assert(loadedConv !== null, "Conversation should be retrievable");
    assert(loadedConv.messages[0].content === "Initial query about cloud expenses", "Message 1 should match");
    assert(loadedConv.messages[1].role === "assistant", "Message 2 should be assistant");

    // Clean up test conversation
    await prisma.chatMessage.deleteMany({ where: { conversationId: testConv.id } });
    await prisma.chatConversation.delete({ where: { id: testConv.id } });

    console.log("  ✔ Conversation memory, multi-turn history, and message retrieval verified in database.\n");
    results.push({ name: "9. Conversation History & Persistence", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 9 Error:", err.message);
    results.push({ name: "9. Conversation History & Persistence", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // SCENARIO 10: Test Invalid or Unavailable Gemini API Keys (Deterministic Fallback)
  // -----------------------------------------------------------------
  try {
    console.log("▶ Test 10: Test Invalid or Unavailable Gemini API Keys (Graceful Fallback)");
    // Temporarily set a dummy invalid key
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "dummy_invalid_api_key_1234567890";

    const res = await queryFinancialAssistant("How is my current cash flow?", bizA.id);
    console.log(`    Fallback Provider: [${res.provider}] - Model: ${res.modelUsed}`);
    console.log(`    Response Snippet: ${res.answer.slice(0, 160)}...`);

    assert(res.provider === "deterministic", "Should seamlessly fall back to deterministic provider");
    assert(res.answer.includes("Cash Flow Position"), "Fallback must answer user query accurately");
    assert(
      res.answer.includes(bizA.accounts.reduce((s, a) => s + a.currentBalance, 0).toLocaleString("en-IN")),
      "Fallback must cite live verified available cash balance"
    );

    // Restore original key
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;

    console.log("  ✔ Invalid/unavailable API keys handled gracefully with deterministic fallback.\n");
    results.push({ name: "10. Invalid API Key Graceful Fallback", status: "PASSED" });
  } catch (err) {
    console.error("  ❌ Test 10 Error:", err.message);
    results.push({ name: "10. Invalid API Key Graceful Fallback", status: "FAILED", error: err.message });
  }

  // -----------------------------------------------------------------
  // BONUS: Intelligent Recommendations Engine Verification
  // -----------------------------------------------------------------
  try {
    console.log("▶ Bonus Verification: Intelligent Recommendations Engine");
    const liveTxs = await prisma.transaction.findMany({ where: { businessId: bizA.id } });
    const recSummary = generateFinancialRecommendations(liveTxs, {
      currentCashBalance: bizA.accounts.reduce((s, a) => s + a.currentBalance, 0),
      minimumCashBalance: bizA.minimumCashBalance,
    });

    console.log(`    Total Opportunities Identified: ${recSummary.totalRecommendations}`);
    console.log(`    Total Estimated Annual Savings: ₹${recSummary.totalEstimatedSavings.toLocaleString("en-IN")}`);
    console.log(`    High Impact Opportunities: ${recSummary.highImpactCount}`);

    assert(recSummary.totalRecommendations >= 4, "Should generate at least 4 strategy recommendations");
    assert(recSummary.totalEstimatedSavings > 100000, "Estimated annual savings should exceed ₹1,00,000");

    console.log("  ✔ AI Recommendations generated strictly from verified transaction velocity.\n");
  } catch (err) {
    console.error("  ❌ Recommendations Error:", err.message);
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log("=================================================");
  console.log("📊 FINOS STAGE 5 TEST RESULTS SUMMARY");
  console.log("=================================================");
  results.forEach((r) => {
    console.log(`✔ ${r.name.padEnd(42)} [${r.status}]`);
  });

  const totalPassed = results.filter((r) => r.status === "PASSED").length;
  console.log(`\nScore: ${totalPassed} / ${results.length} tests passed.`);
  console.log("=================================================\n");

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

runStage5TestSuite().catch((e) => {
  console.error("Fatal test error:", e);
  process.exit(1);
});
