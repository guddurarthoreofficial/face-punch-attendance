
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatMonth = (month, year) =>
  new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

function downloadPayslip(salary, employee) {
  const employeeName = escapeHtml(employee?.name || "Employee");
  const employeeEmail = escapeHtml(employee?.email || "—");
  const monthName = escapeHtml(formatMonth(salary.month, salary.year));
  const status = escapeHtml(salary.status || "Pending");
  const paymentMethod = escapeHtml(salary.paymentMethod || "—");
  const transactionReference = escapeHtml(
    salary.transactionReference || "—"
  );
  const paymentDate = escapeHtml(formatDate(salary.paymentDate));
  const remarks = escapeHtml(salary.remarks || "—");
  const generatedDate = escapeHtml(formatDate(new Date()));

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Payslip - ${monthName}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 32px;
          font-family: Arial, Helvetica, sans-serif;
          color: #172033;
          background: #f1f5f9;
        }
        .sheet {
          max-width: 760px;
          margin: 0 auto;
          padding: 36px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 2px solid #4f46e5;
          padding-bottom: 22px;
        }
        h1 { margin: 0 0 8px; font-size: 26px; }
        h2 { margin: 0 0 20px; font-size: 18px; }
        p { margin: 6px 0; color: #64748b; font-size: 13px; }
        .label { color: #64748b; font-size: 12px; }
        .value { color: #172033; font-weight: 600; }
        .badge {
          display: inline-block;
          padding: 7px 12px;
          border-radius: 20px;
          background: ${salary.status === "Paid" ? "#dcfce7" : "#fef3c7"};
          color: ${salary.status === "Paid" ? "#166534" : "#92400e"};
          font-size: 12px;
          font-weight: bold;
        }
        .section { margin-top: 28px; }
        .details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 18px;
          background: #f8fafc;
          border-radius: 8px;
        }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td {
          padding: 13px 10px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
          font-size: 13px;
        }
        th { background: #f8fafc; }
        td:last-child, th:last-child { text-align: right; }
        .total td {
          font-size: 16px;
          font-weight: bold;
          color: #312e81;
          background: #eef2ff;
        }
        .footer {
          margin-top: 30px;
          padding-top: 18px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }
        .print-btn {
          display: block;
          margin: 20px auto;
          padding: 12px 20px;
          border: 0;
          border-radius: 8px;
          color: white;
          background: #4f46e5;
          cursor: pointer;
        }
        @media print {
          body { padding: 0; background: white; }
          .sheet { max-width: none; border: 0; border-radius: 0; padding: 12px; }
          .print-btn { display: none; }
          @page { size: A4; margin: 14mm; }
        }
        @media (max-width: 500px) {
          body { padding: 10px; }
          .sheet { padding: 18px; }
          .details { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">
        Print / Save as PDF
      </button>

      <main class="sheet">
        <header class="header">
          <div>
            <h1>Shiuli Technology</h1>
            <p>Employee Salary Statement</p>
            <p>Salary period: ${monthName}</p>
          </div>
          <div>
            <strong class="badge">${status}</strong>
            <p>Generated: ${generatedDate}</p>
          </div>
        </header>

        <section class="section">
          <h2>Employee Information</h2>
          <div class="details">
            <div>
              <p class="label">Employee Name</p>
              <p class="value">${employeeName}</p>
            </div>
            <div>
              <p class="label">Email</p>
              <p class="value">${employeeEmail}</p>
            </div>
            <div>
              <p class="label">Salary Period</p>
              <p class="value">${monthName}</p>
            </div>
            <div>
              <p class="label">Payment Status</p>
              <p class="value">${status}</p>
            </div>
          </div>
        </section>

        <section class="section">
          <h2>Salary Breakdown</h2>
          <table>
            <thead>
              <tr><th>Description</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>Basic Salary</td><td>${formatCurrency(salary.basicSalary)}</td></tr>
              <tr><td>Allowances</td><td>${formatCurrency(salary.allowances)}</td></tr>
              <tr><td>Deductions</td><td>− ${formatCurrency(salary.deductions)}</td></tr>
              <tr class="total"><td>Net Salary</td><td>${formatCurrency(salary.netSalary)}</td></tr>
            </tbody>
          </table>
        </section>

        <section class="section">
          <h2>Payment Details</h2>
          <div class="details">
            <div>
              <p class="label">Payment Method</p>
              <p class="value">${paymentMethod}</p>
            </div>
            <div>
              <p class="label">Payment Date</p>
              <p class="value">${paymentDate}</p>
            </div>
            <div>
              <p class="label">Transaction Reference</p>
              <p class="value">${transactionReference}</p>
            </div>
            <div>
              <p class="label">Remarks</p>
              <p class="value">${remarks}</p>
            </div>
          </div>
        </section>

        <footer class="footer">
          <p>This is a system-generated salary statement.</p>
          <p>For any discrepancy, please contact your administrator.</p>
        </footer>
      </main>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Please allow pop-ups to open and download your payslip.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export default function MyPayslips() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadPayslips = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/salaries/my");
      setSalaries(response.salaries || []);
    } catch (err) {
      setError(err.message || "Unable to load your payslips.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const filteredSalaries = salaries.filter(
    (salary) =>
      statusFilter === "All" || salary.status === statusFilter
  );

  const totalPaid = salaries
    .filter((salary) => salary.status === "Paid")
    .reduce((sum, salary) => sum + (Number(salary.netSalary) || 0), 0);

  const totalPending = salaries
    .filter((salary) => salary.status === "Pending")
    .reduce((sum, salary) => sum + (Number(salary.netSalary) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Employee Portal / Payroll</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            My Payslips
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            View your salary history and download salary statements.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPayslips}
          disabled={loading}
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Total Paid Salary</p>
          <p className="mt-3 text-2xl font-bold text-emerald-400">
            {formatCurrency(totalPaid)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Sum of all paid salary records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-400">Pending Salary</p>
          <p className="mt-3 text-2xl font-bold text-amber-400">
            {formatCurrency(totalPending)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Salary awaiting payment
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Salary History
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {salaries.length} salary record(s) found
            </p>
          </div>

          <select
            aria-label="Filter salary status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
          >
            <option value="All">All statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-400">
            Loading your payslips...
          </p>
        ) : filteredSalaries.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl">
              💰
            </div>
            <h3 className="mt-4 font-semibold text-white">
              No payslips found
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Your salary records will appear here when they are created.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredSalaries.map((salary) => (
              <article
                key={salary._id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-white">
                        {formatMonth(salary.month, salary.year)}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          salary.status === "Paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {salary.status}
                      </span>
                    </div>

                    <p className="mt-3 text-2xl font-bold text-white">
                      {formatCurrency(salary.netSalary)}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-slate-500">Basic Salary</p>
                        <p className="mt-1 text-slate-300">
                          {formatCurrency(salary.basicSalary)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Allowances</p>
                        <p className="mt-1 text-slate-300">
                          {formatCurrency(salary.allowances)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Deductions</p>
                        <p className="mt-1 text-slate-300">
                          {formatCurrency(salary.deductions)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Payment Date</p>
                        <p className="mt-1 text-slate-300">
                          {formatDate(salary.paymentDate)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Payment Method</p>
                        <p className="mt-1 text-slate-300">
                          {salary.paymentMethod || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Transaction Ref.</p>
                        <p className="mt-1 break-all text-slate-300">
                          {salary.transactionReference || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      downloadPayslip(salary, {
                        name: "Employee",
                        email: "",
                      })
                    }
                    className="shrink-0 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Download Payslip
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
