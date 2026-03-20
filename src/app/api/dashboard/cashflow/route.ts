import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import Expense from "@/models/Expense";

function isoDay(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isoMonth(d: Date): string {
  return d.toISOString().slice(0, 7);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "month";

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date;
  let groupByFormat: string;
  let groupBy: "day" | "month";

  switch (period) {
    case "week":
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      groupByFormat = "%Y-%m-%d";
      groupBy = "day";
      break;
    case "year":
      startDate = new Date(endDate.getFullYear(), 0, 1);
      groupByFormat = "%Y-%m";
      groupBy = "month";
      break;
    default: // month
      startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      groupByFormat = "%Y-%m-%d";
      groupBy = "day";
  }

  const dateFilter = { $gte: startDate, $lte: endDate };

  const [paymentAgg, expenseAgg, totalIncomeAgg, totalExpensesAgg, allPayments, allExpenses] =
    await Promise.all([
      Payment.aggregate([
        { $match: { date: dateFilter } },
        {
          $group: {
            _id: { $dateToString: { format: groupByFormat, date: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Expense.aggregate([
        { $match: { date: dateFilter } },
        {
          $group: {
            _id: { $dateToString: { format: groupByFormat, date: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { date: dateFilter } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]),
      Expense.aggregate([
        { $match: { date: dateFilter } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]),
      Payment.find({ date: dateFilter })
        .populate("invoiceId", "invoiceNumber")
        .populate("clientId", "firstName lastName")
        .sort({ date: 1 })
        .lean(),
      Expense.find({ date: dateFilter })
        .populate("vehicleId", "brand model plate")
        .sort({ date: 1 })
        .lean(),
    ]);

  // Build chart periods
  const periods: string[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = groupBy === "day" ? isoDay(cur) : isoMonth(cur);
    if (!periods.includes(key)) periods.push(key);
    if (groupBy === "day") cur.setDate(cur.getDate() + 1);
    else cur.setMonth(cur.getMonth() + 1);
  }

  const incomeMap = new Map(paymentAgg.map((p) => [p._id, p.total]));
  const expenseMap = new Map(expenseAgg.map((e) => [e._id, e.total]));

  const chartData = periods.map((p) => ({
    period: p,
    income: incomeMap.get(p) ?? 0,
    expenses: expenseMap.get(p) ?? 0,
  }));

  // Build combined transaction list
  type TxBase = { _id: string; type: "income" | "expense"; amount: number; date: Date | string; description: string; reference: string; runningBalance: number };

  const payments: TxBase[] = allPayments.map((p) => {
    const client = p.clientId as { firstName?: string; lastName?: string } | null;
    const invoice = p.invoiceId as { invoiceNumber?: string } | null;
    return {
      _id: p._id.toString(),
      type: "income" as const,
      amount: p.amount,
      date: p.date ?? p.createdAt,
      description: client ? `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() : "Paiement",
      reference: invoice?.invoiceNumber ?? "",
      runningBalance: 0,
    };
  });

  const expenses: TxBase[] = allExpenses.map((e) => {
    const vehicle = e.vehicleId as { brand?: string; model?: string; plate?: string } | null;
    return {
      _id: e._id.toString(),
      type: "expense" as const,
      amount: e.amount,
      date: e.date,
      description: e.description,
      reference: vehicle ? `${vehicle.brand ?? ""} ${vehicle.model ?? ""} (${vehicle.plate ?? ""})` : "",
      runningBalance: 0,
    };
  });

  const transactions = [...payments, ...expenses].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let balance = 0;
  for (const tx of transactions) {
    balance += tx.type === "income" ? tx.amount : -tx.amount;
    tx.runningBalance = balance;
  }

  const totalIncome = totalIncomeAgg[0]?.sum ?? 0;
  const totalExpenses = totalExpensesAgg[0]?.sum ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      chartData,
      transactions,
    },
  });
}
