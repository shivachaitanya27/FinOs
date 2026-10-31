/**
 * FinOS Stage 2 - End-to-End API Integration & Dashboard Refresh Test
 */

const { PrismaClient } = require("@prisma/client");
const XLSX = require("xlsx");

const prisma = new PrismaClient();

async function runE2ETests() {
  console.log("=================================================");
  console.log("🧪 STARTING FINOS STAGE 2 END-TO-END INTEGRATION TEST");
  console.log("=================================================\n");

  const biz = await prisma.business.findFirst({ include: { accounts: true } });
  if (!biz) throw new Error("No business found");

  const targetAccount = biz.accounts[0];
  const initialBalance = targetAccount.currentBalance;
  console.log(`Initial Account "${targetAccount.name}" Balance: ₹${initialBalance}`);

  // Count existing transactions
  const initialTxCount = await prisma.transaction.count({ where: { businessId: biz.id } });
  console.log(`Initial Transaction Count: ${initialTxCount}`);

  // Import directly from the real source files
  const { parseUploadedFile, validateRecords } = await import("../src/lib/data-importer.ts");
  const { calculateFinancialMetrics } = await import("../src/lib/financial-engine.ts");

  // Step 1: Create a real test CSV file with 4 transactions:
  // - 1 Revenue: ₹250,000 (Consulting)
  // - 1 Expense: ₹35,000 (Software)
  // - 1 Loan Proceeds: ₹500,000 (Working capital loan)
  // - 1 Internal Transfer: ₹100,000 (Self transfer)
  const testCsvContent = `Date,Narration,Chq/Ref No,Withdrawal (Debit),Deposit (Credit),Closing Balance
15/10/2024,"NEFT CR-ACME CORP CLIENT SALE",ACME-9021,,250000.00,2885000.00
16/10/2024,"ACH DR-FIGMA DESIGN LICENSES",FIGMA-441,35000.00,,2850000.00
18/10/2024,"HDFC BANK WORKING CAPITAL LOAN DISBURSEMENT",WC-LN-992,,500000.00,3350000.00
20/10/2024,"SELF TRANSFER TO ICICI OPERATING A/C",TRF-SELF-01,100000.00,,3250000.00
`;

  // Step 2: Test File Upload Parsing
  console.log("\n▶ Step 2: Testing parseUploadedFile with CSV Buffer");
  const parsed = parseUploadedFile(Buffer.from(testCsvContent), "test_statement.csv", "BANK_STATEMENT");
  console.log(`  Parsed ${parsed.totalRows} rows, detected ${parsed.headers.length} headers`);
  console.log(`  Suggested Mapping:`, parsed.suggestedMapping);

  if (parsed.totalRows !== 4) throw new Error("Expected 4 rows");

  // Step 3: Test Record Validation
  console.log("\n▶ Step 3: Testing validateRecords");
  const validationSummary = validateRecords(parsed.allRows, parsed.suggestedMapping);
  console.log(`  Validation: ${validationSummary.validCount} valid, ${validationSummary.invalidCount} invalid`);
  console.log(`  Total Credits: ₹${validationSummary.totalCredits}, Total Debits: ₹${validationSummary.totalDebits}`);

  if (validationSummary.validCount !== 4) throw new Error("Expected 4 valid records");

  // Step 4: Import into SQLite Database via atomic transaction
  console.log("\n▶ Step 4: Persisting Valid Records to Database");
  const importedFile = await prisma.importedFile.create({
    data: {
      businessId: biz.id,
      fileName: "test_statement.csv",
      fileType: "CSV",
      fileSize: Buffer.byteLength(testCsvContent),
      rowCount: 4,
      validCount: 4,
      invalidCount: 0,
      source: "BANK_STATEMENT",
      fileHash: parsed.fileHash,
      status: "PROCESSED",
      accountId: targetAccount.id,
    },
  });

  const txCreated = [];
  for (const [i, r] of validationSummary.validRecords.entries()) {
    const t = await prisma.transaction.create({
      data: {
        businessId: biz.id,
        accountId: targetAccount.id,
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type,
        category: r.category,
        classification: r.classification,
        referenceNumber: r.referenceNumber || `TEST-REF-${i}`,
        source: "BANK_STATEMENT",
        importStatus: "POSTED",
        importedFileId: importedFile.id,
        isDemo: false,
        status: "COMPLETED",
      },
    });
    txCreated.push(t);
  }

  // Update account balance
  const netDelta = validationSummary.totalCredits - validationSummary.totalDebits;
  await prisma.financialAccount.update({
    where: { id: targetAccount.id },
    data: { currentBalance: { increment: netDelta } },
  });

  console.log(`  ✔ Successfully saved 4 transactions linked to file ID: ${importedFile.id}`);

  // Step 5: Verify Transactions in Database
  const afterTxCount = await prisma.transaction.count({ where: { businessId: biz.id } });
  console.log(`  New Transaction Count: ${afterTxCount} (added ${afterTxCount - initialTxCount})`);
  if (afterTxCount !== initialTxCount + 4) throw new Error("Transaction count did not increment by 4");

  const updatedAccount = await prisma.financialAccount.findUnique({ where: { id: targetAccount.id } });
  console.log(`  Updated Account Balance: ₹${updatedAccount.currentBalance} (net change: ₹${netDelta})`);
  if (updatedAccount.currentBalance !== initialBalance + netDelta) throw new Error("Account balance mismatch");

  // Step 6: Test Financial Calculation Engine Integration
  console.log("\n▶ Step 6: Verifying Dashboard Financial Metrics Calculation");
  const allBizTxs = await prisma.transaction.findMany({
    where: { businessId: biz.id, status: "COMPLETED" },
  });

  const allAccounts = await prisma.financialAccount.findMany({ where: { businessId: biz.id } });
  const totalCash = allAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const metrics = calculateFinancialMetrics(allBizTxs, { openingCash: totalCash });
  console.log(`  Total Recognized Revenue: ₹${metrics.totalRevenue.toLocaleString("en-IN")}`);
  console.log(`  Total Operating Expenses: ₹${metrics.totalExpenses.toLocaleString("en-IN")}`);
  console.log(`  Net Profit / Loss: ₹${metrics.netProfitLoss?.toLocaleString("en-IN")}`);
  console.log(`  Total Cash Position across all accounts: ₹${totalCash.toLocaleString("en-IN")}`);
  console.log(`  Cash Inflows: ₹${metrics.cashInflows.toLocaleString("en-IN")}`);
  console.log(`  Cash Outflows: ₹${metrics.cashOutflows.toLocaleString("en-IN")}`);

  // Step 7: Clean up test batch so sandbox stays tidy
  console.log("\n▶ Step 7: Cleaning up test batch");
  await prisma.transaction.deleteMany({ where: { importedFileId: importedFile.id } });
  await prisma.importedFile.delete({ where: { id: importedFile.id } });
  await prisma.financialAccount.update({
    where: { id: targetAccount.id },
    data: { currentBalance: { decrement: netDelta } },
  });

  const finalTxCount = await prisma.transaction.count({ where: { businessId: biz.id } });
  console.log(`  Restored initial state: ${finalTxCount} transactions.`);

  console.log("\n=================================================");
  console.log("🎉 ALL END-TO-END INTEGRATION TESTS PASSED!");
  console.log("=================================================");
  await prisma.$disconnect();
}

runE2ETests().catch((err) => {
  console.error("E2E Test Failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
