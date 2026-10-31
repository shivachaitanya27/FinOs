import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TEMPLATES: Record<
  string,
  { filename: string; contentType: string; content: string }
> = {
  bank: {
    filename: "hdfc_bank_statement_template.csv",
    contentType: "text/csv; charset=utf-8",
    content: `Date,Narration,Chq/Ref No,Withdrawal (Debit),Deposit (Credit),Closing Balance
01/10/2024,"NEFT CR-HDFCN002931-ACME CORP-INV-8491",HDFCN002931,,145000.00,2630000.00
03/10/2024,"ACH DR-AMAZON AWS CLOUD INFRA MUMBAI",AWS-948102,18500.00,,2611500.00
05/10/2024,"SALARY BATCH OCT 2024 - 12 EMPLOYEES",CMS-839210,380000.00,,2231500.00
08/10/2024,"UPI-98213849102-CLIENT CONSULTING FEE",UPI9821384,,42000.00,2273500.00
12/10/2024,"SELF TRANSFER TO ICICI OPERATING A/C",UTR-HDFC0921,100000.00,,2173500.00
15/10/2024,"HDFC BANK WORKING CAPITAL LOAN DISBURSEMENT",WC-LN-88391,,500000.00,2673500.00
20/10/2024,"TERM LOAN PRINCIPAL EMI OCT",TL-PRIN-001,45000.00,,2628500.00
22/10/2024,"AWS CLOUD SERVICE REFUND CREDIT",REV-AWS-01,,3200.00,2631700.00
`,
  },
  tally: {
    filename: "tally_prime_export_template.csv",
    contentType: "text/csv; charset=utf-8",
    content: `Date,Particulars,Vch Type,Vch No,Debit,Credit
01-10-2024,Apex Infotech Private Limited,Sales,INV-2024-001,,220000.00
02-10-2024,WeWork Management Private Limited,Payment,VCH-0821,85000.00,
05-10-2024,Staff Salaries Payable,Payment,VCH-0822,380000.00,
10-10-2024,Contra - Transfer to ICICI Bank,Contra,CNT-0192,150000.00,
12-10-2024,Customer Advance - Cloud Nine Ltd,Receipt,RCT-0341,,95000.00
18-10-2024,GST Electronic Cash Ledger,Payment,GST-OCT-24,38500.00,
25-10-2024,Loan Repayment Principal - ICICI,Payment,LN-EMI-99,50000.00,
`,
  },
  zoho: {
    filename: "zoho_books_export_template.csv",
    contentType: "text/csv; charset=utf-8",
    content: `Date,Account,Description,Transaction Type,Debit,Credit,Reference Number
2024-10-01,HDFC Current A/c,Enterprise SaaS Annual Subscription,Invoice,,180000.00,INV-ZH-101
2024-10-04,HDFC Current A/c,GitHub Enterprise Organization Seats,Expense,12400.00,,EXP-GH-82
2024-10-08,ICICI Operating A/c,Digital Marketing & Paid Ads,Expense,45000.00,,EXP-MKT-09
2024-10-15,HDFC Current A/c,Bank Working Capital Loan Inflow,Other Inflow,,300000.00,WC-ZOHO-91
2024-10-20,HDFC Current A/c,Customer Overpayment Refund,Refund,15000.00,,RF-CUST-12
2024-10-25,ICICI Operating A/c,Statutory Legal & Compliance Fees,Expense,25000.00,,EXP-CA-44
`,
  },
  generic: {
    filename: "finos_generic_transaction_template.csv",
    contentType: "text/csv; charset=utf-8",
    content: `Date,Description,Amount,Transaction Type,Category,Reference Number,Counterparty,Payment Method
2024-10-01,"Annual Enterprise License - FinCorp",250000.00,REVENUE,Sales & Services,INV-001,"FinCorp Technologies",NEFT
2024-10-03,"Office Rent Koramangala Bengaluru",85000.00,EXPENSE,Office Rent,RENT-OCT-24,"Prestige Estates",RTGS
2024-10-05,"Core Engineering Salaries",380000.00,EXPENSE,Payroll & Salaries,SAL-OCT-24,"Staff Payroll Desk",NEFT
2024-10-07,"Google Workspace & Cloud Services",14200.00,EXPENSE,Cloud & Software,GGL-982104,"Google Cloud India",CREDIT_CARD
2024-10-10,"Fund Transfer from HDFC to ICICI",100000.00,TRANSFER,Internal Transfer,TRF-00109,"Internal Contra",NEFT
2024-10-14,"HDFC Business Loan Disbursement",500000.00,REVENUE,Loans & Borrowings,HDFC-LN-441,"HDFC Bank",RTGS
2024-10-22,"Vendor Server Fee Refund Credit",6500.00,EXPENSE,Cloud & Software,AWS-RF-009,"Amazon Web Services",UPI
`,
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "bank";

  const template = TEMPLATES[type] || TEMPLATES.generic;

  return new NextResponse(template.content, {
    status: 200,
    headers: {
      "Content-Type": template.contentType,
      "Content-Disposition": `attachment; filename="${template.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

