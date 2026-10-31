import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/seed-data";

export async function POST() {
  try {
    const result = await seedDemoData();
    return NextResponse.json({
      success: true,
      message: "Demo data successfully seeded for BharatTech Solutions",
      data: result,
    });
  } catch (error: any) {
    console.error("Error seeding demo data:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed demo data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Quick check if demo business exists
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.transaction.count();
    const business = await prisma.business.findFirst();

    return NextResponse.json({
      hasData: count > 0,
      transactionCount: count,
      business: business ? { id: business.id, name: business.name } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ hasData: false, error: error.message });
  }
}
