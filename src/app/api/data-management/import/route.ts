import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ValidatedTransaction } from "@/lib/data-importer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      validRecords,
      fileName,
      fileType,
      fileSize,
      fileHash,
      source,
      accountId,
      businessId,
      invalidCount = 0,
      totalRows = 0,
    } = body;

    if (!validRecords || !Array.isArray(validRecords) || validRecords.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions were provided to import." },
        { status: 400 }
      );
    }

    // 1. Identify business
    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const biz = await prisma.business.findFirst();
      if (!biz) {
        return NextResponse.json({ error: "No business found" }, { status: 400 });
      }
      targetBusinessId = biz.id;
    }

    // 2. Identify or verify target account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      // Default to default account or first account
      const defaultAcc = await prisma.financialAccount.findFirst({
        where: { businessId: targetBusinessId, isDefault: true },
      });
      if (defaultAcc) {
        targetAccountId = defaultAcc.id;
      } else {
        const firstAcc = await prisma.financialAccount.findFirst({
          where: { businessId: targetBusinessId },
        });
        if (firstAcc) targetAccountId = firstAcc.id;
      }
    }

    // 3. Compute net financial delta for the account
    let totalDebitSum = 0;
    let totalCreditSum = 0;
    for (const rec of validRecords as ValidatedTransaction[]) {
      if (rec.type === "REVENUE") {
        totalCreditSum += rec.amount;
      } else if (rec.type === "EXPENSE") {
        totalDebitSum += rec.amount;
      }
    }
    const netAccountDelta = totalCreditSum - totalDebitSum;

    // 4. Atomic database commit using Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create ImportedFile tracking record
      const importedFile = await tx.importedFile.create({
        data: {
          businessId: targetBusinessId,
          fileName: fileName || "imported_statement.csv",
          fileType: fileType || "CSV",
          fileSize: fileSize || 0,
          rowCount: totalRows || validRecords.length,
          validCount: validRecords.length,
          invalidCount: invalidCount,
          source: source || "BANK_STATEMENT",
          fileHash: fileHash || null,
          status: "PROCESSED",
          accountId: targetAccountId || null,
        },
      });

      // Prepare transactions
      const txData = (validRecords as ValidatedTransaction[]).map((rec, i) => ({
        businessId: targetBusinessId,
        accountId: targetAccountId || null,
        date: new Date(rec.date),
        description: rec.description,
        amount: rec.amount,
        type: rec.type,
        category: rec.category,
        classification: rec.classification,
        referenceNumber:
          rec.referenceNumber ||
          `IMP-${importedFile.id.slice(-4)}-${(i + 1).toString().padStart(4, "0")}`,
        counterparty: rec.counterparty || null,
        notes: rec.notes || `Imported via ${fileName}`,
        source: source || "BANK_STATEMENT",
        importStatus: "POSTED",
        importedFileId: importedFile.id,
        isDemo: false,
        isDuplicate: Boolean(rec.isDuplicateSuspect),
        status: "COMPLETED",
      }));

      // Create transactions
      for (const t of txData) {
        await tx.transaction.create({ data: t });
      }

      // Update FinancialAccount balance if account is specified
      if (targetAccountId && netAccountDelta !== 0) {
        await tx.financialAccount.update({
          where: { id: targetAccountId },
          data: {
            currentBalance: {
              increment: netAccountDelta,
            },
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          businessId: targetBusinessId,
          action: "FILE_IMPORTED",
          entityType: "TRANSACTION",
          entityId: importedFile.id,
          details: `Imported ${validRecords.length} records from ${fileName}. Credits: ₹${totalCreditSum.toFixed(2)}, Debits: ₹${totalDebitSum.toFixed(2)}.`,
        },
      });

      return importedFile;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${validRecords.length} transactions into ledger.`,
      importedFileId: result.id,
      importedCount: validRecords.length,
      invalidCount,
      totalDebits: totalDebitSum,
      totalCredits: totalCreditSum,
      accountId: targetAccountId,
    });
  } catch (error: any) {
    console.error("Import commit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to persist imported transactions to database." },
      { status: 500 }
    );
  }
}

