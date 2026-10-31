import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/transactions/[id]
 * Read-only transaction inspection endpoint for statutory audit and review.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        importedFile: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/transactions/[id]
 * Blocked: Financial Ledger Immutability Rule
 * In compliance with Ind AS and Indian Companies Act 2013, recorded ledger transactions
 * cannot be mutated or altered after ingestion.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error:
        "Financial Ledger Immutability Violation: Recorded transactions cannot be modified. In compliance with Ind AS and statutory audit standards, all recorded ledger entries are immutable. Adjusting or contra entries must be posted instead.",
      code: "LEDGER_IMMUTABLE",
    },
    { status: 403 }
  );
}

/**
 * DELETE /api/transactions/[id]
 * Blocked: Financial Ledger Immutability Rule
 * In compliance with Ind AS and statutory audit requirements, recorded ledger transactions
 * cannot be deleted.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error:
        "Financial Ledger Immutability Violation: Recorded transactions cannot be deleted. FinOS enforces strict double-entry and audit trail immutability.",
      code: "LEDGER_IMMUTABLE",
    },
    { status: 403 }
  );
}
