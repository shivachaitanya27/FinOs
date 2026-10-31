import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateRecords, ColumnMapping } from "@/lib/data-importer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rows, mapping, businessId, accountId } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No transaction rows provided for validation." },
        { status: 400 }
      );
    }

    if (!mapping || !mapping.date || !mapping.description) {
      return NextResponse.json(
        {
          error: "Incomplete column mapping: Date and Description are strictly required.",
        },
        { status: 400 }
      );
    }

    const hasAmount = Boolean(mapping.amount);
    const hasDebitCredit = Boolean(mapping.debit || mapping.credit);
    if (!hasAmount && !hasDebitCredit) {
      return NextResponse.json(
        {
          error: "Incomplete column mapping: Either Amount or Debit/Credit columns must be mapped.",
        },
        { status: 400 }
      );
    }

    // Identify business
    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const biz = await prisma.business.findFirst();
      if (!biz) {
        return NextResponse.json({ error: "No business found" }, { status: 400 });
      }
      targetBusinessId = biz.id;
    }

    // Load existing reference numbers to flag suspected duplicate references
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        businessId: targetBusinessId,
        referenceNumber: { not: null },
      },
      select: { referenceNumber: true },
    });

    const existingRefs = new Set<string>();
    for (const t of existingTransactions) {
      if (t.referenceNumber) {
        existingRefs.add(t.referenceNumber.trim());
      }
    }

    // Run validation
    const validationSummary = validateRecords(rows, mapping as ColumnMapping, existingRefs);

    return NextResponse.json({
      success: true,
      summary: validationSummary,
    });
  } catch (error: any) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate records." },
      { status: 500 }
    );
  }
}

