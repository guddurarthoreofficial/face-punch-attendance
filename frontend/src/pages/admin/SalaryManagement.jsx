
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api";

const currentDate = new Date();

const initialForm = {
    employeeId: "",
    month: String(currentDate.getMonth() + 1),
    year: String(currentDate.getFullYear()),
    basicSalary: "",
    allowances: "0",
    deductions: "0",
    remarks: "",
};

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

export default function SalaryManagement() {
    const [employees, setEmployees] = useState([]);
    const [salaries, setSalaries] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterMonth, setFilterMonth] = useState(
        String(currentDate.getMonth() + 1)
    );
    const [filterYear, setFilterYear] = useState(
        String(currentDate.getFullYear())
    );

    const netSalary =
        (Number(form.basicSalary) || 0) +
        (Number(form.allowances) || 0) -
        (Number(form.deductions) || 0);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [employeeResponse, salaryResponse] = await Promise.all([
                apiRequest("/employees"),
                apiRequest(
                    `/salaries?month=${filterMonth}&year=${filterYear}`
                ),
            ]);

            setEmployees(employeeResponse.employees || []);
            setSalaries(salaryResponse.salaries || []);
        } catch (err) {
            setError(err.message || "Failed to load salary data.");
        } finally {
            setLoading(false);
        }
    }, [filterMonth, filterYear]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleCreate = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!form.employeeId) {
            setError("Please select an employee.");
            return;
        }

        if (
            !form.basicSalary ||
            Number(form.basicSalary) < 0 ||
            netSalary < 0
        ) {
            setError("Please enter valid salary amounts.");
            return;
        }

        setSaving(true);

        try {
            await apiRequest("/salaries", {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    month: Number(form.month),
                    year: Number(form.year),
                    basicSalary: Number(form.basicSalary),
                    allowances: Number(form.allowances),
                    deductions: Number(form.deductions),
                }),
            });

            setSuccess("Salary record created successfully. Email notification was requested.");
            setForm(initialForm);
            await loadData();
        } catch (err) {
            setError(err.message || "Could not create salary record.");
        } finally {
            setSaving(false);
        }
    };

    const markAsPaid = async (salary) => {
        if (salary.status === "Paid") return;

        const confirmed = window.confirm(
            `Mark ${salary.employee?.name || "this employee"}'s salary as Paid?`
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            await apiRequest(`/salaries/${salary._id}`, {
                method: "PUT",
                body: JSON.stringify({
                    status: "Paid",
                    paymentDate: new Date().toISOString(),
                    paymentMethod: "Bank Transfer",
                    remarks: salary.remarks || "Salary payment completed",
                }),
            });

            setSuccess("Salary marked as Paid successfully.");
            await loadData();
        } catch (err) {
            setError(err.message || "Could not update salary status.");
        }
    };

    const filteredSalaries = salaries.filter(
        (salary) =>
            filterStatus === "All" || salary.status === filterStatus
    );

    const totalAmount = filteredSalaries.reduce(
        (total, salary) => total + (Number(salary.netSalary) || 0),
        0
    );

    const paidAmount = filteredSalaries
        .filter((salary) => salary.status === "Paid")
        .reduce((total, salary) => total + (Number(salary.netSalary) || 0), 0);

    const pendingAmount = filteredSalaries
        .filter((salary) => salary.status === "Pending")
        .reduce((total, salary) => total + (Number(salary.netSalary) || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-slate-400">Payroll / Administration</p>
                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                    Salary Management
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Create salary records, track payments and manage employee payroll.
                </p>
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                </div>
            )}

            {success && (
                <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                    {success}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                    { label: "Total Payroll", value: totalAmount, color: "text-white" },
                    { label: "Paid Amount", value: paidAmount, color: "text-emerald-400" },
                    { label: "Pending Amount", value: pendingAmount, color: "text-amber-400" },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                        <p className="text-sm text-slate-400">{item.label}</p>
                        <p className={`mt-3 text-2xl font-bold ${item.color}`}>
                            {formatCurrency(item.value)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                            {formatMonth(filterMonth, filterYear)}
                        </p>
                    </div>
                ))}
            </div>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white">Create Salary Record</h2>
                <p className="mt-1 text-sm text-slate-400">
                    Enter the employee's monthly salary details.
                </p>

                <form onSubmit={handleCreate} className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                        <label htmlFor="employeeId" className="mb-2 block text-sm text-slate-300">
                            Employee *
                        </label>
                        <select
                            id="employeeId"
                            name="employeeId"
                            value={form.employeeId}
                            onChange={handleChange}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-indigo-500"
                        >
                            <option value="">Select employee</option>
                            {employees.map((employee) => (
                                <option key={employee._id} value={employee._id}>
                                    {employee.name} ({employee.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="month" className="mb-2 block text-sm text-slate-300">
                            Salary Month *
                        </label>
                        <select
                            id="month"
                            name="month"
                            value={form.month}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                        >
                            {Array.from({ length: 12 }, (_, index) => (
                                <option key={index + 1} value={index + 1}>
                                    {new Date(2000, index, 1).toLocaleString("en-IN", { month: "long" })}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="year" className="mb-2 block text-sm text-slate-300">
                            Year *
                        </label>
                        <input
                            id="year"
                            name="year"
                            type="number"
                            min="2020"
                            max="2100"
                            value={form.year}
                            onChange={handleChange}
                            required
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                        />
                    </div>

                    {[
                        { name: "basicSalary", label: "Basic Salary (₹)", min: "0" },
                        { name: "allowances", label: "Allowances (₹)", min: "0" },
                        { name: "deductions", label: "Deductions (₹)", min: "0" },
                    ].map((field) => (
                        <div key={field.name}>
                            <label htmlFor={field.name} className="mb-2 block text-sm text-slate-300">
                                {field.label}
                            </label>
                            <input
                                id={field.name}
                                name={field.name}
                                type="number"
                                min={field.min}
                                step="0.01"
                                value={form[field.name]}
                                onChange={handleChange}
                                required
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                            />
                        </div>
                    ))}

                    <div>
                        <label htmlFor="remarks" className="mb-2 block text-sm text-slate-300">
                            Remarks
                        </label>
                        <input
                            id="remarks"
                            name="remarks"
                            value={form.remarks}
                            onChange={handleChange}
                            placeholder="Optional note"
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 sm:col-span-2 xl:col-span-3">
                        <div>
                            <p className="text-sm text-indigo-200">Calculated Net Salary</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Basic + allowances − deductions
                            </p>
                        </div>
                        <p className="text-xl font-bold text-white sm:text-2xl">
                            {formatCurrency(netSalary)}
                        </p>
                    </div>

                    <div className="sm:col-span-2 xl:col-span-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                            {saving ? "Saving..." : "Create Salary Record"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Salary Records</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Review monthly payroll and payment status.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            aria-label="Filter month"
                            value={filterMonth}
                            onChange={(event) => setFilterMonth(event.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        >
                            {Array.from({ length: 12 }, (_, index) => (
                                <option key={index + 1} value={index + 1}>
                                    {new Date(2000, index, 1).toLocaleString("en-IN", { month: "short" })}
                                </option>
                            ))}
                        </select>

                        <input
                            aria-label="Filter year"
                            type="number"
                            min="2020"
                            max="2100"
                            value={filterYear}
                            onChange={(event) => setFilterYear(event.target.value)}
                            className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        />

                        <select
                            aria-label="Filter payment status"
                            value={filterStatus}
                            onChange={(event) => setFilterStatus(event.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                        >
                            <option value="All">All statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className="py-10 text-center text-slate-400">Loading salary records...</p>
                ) : filteredSalaries.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="font-medium text-white">No salary records found</p>
                        <p className="mt-2 text-sm text-slate-400">
                            Try another month or create a new salary record.
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400">
                                    <th className="px-3 py-4 font-medium">Employee</th>
                                    <th className="px-3 py-4 font-medium">Month</th>
                                    <th className="px-3 py-4 font-medium">Basic</th>
                                    <th className="px-3 py-4 font-medium">Net Salary</th>
                                    <th className="px-3 py-4 font-medium">Payment Method</th>
                                    <th className="px-3 py-4 font-medium">Status</th>
                                    <th className="px-3 py-4 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSalaries.map((salary) => (
                                    <tr key={salary._id} className="border-b border-slate-800/70 last:border-0">
                                        <td className="px-3 py-4">
                                            <p className="font-medium text-white">
                                                {salary.employee?.name || "Unknown"}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {salary.employee?.email || ""}
                                            </p>
                                        </td>
                                        <td className="px-3 py-4 text-slate-300">
                                            {formatMonth(salary.month, salary.year)}
                                        </td>
                                        <td className="px-3 py-4 text-slate-300">
                                            {formatCurrency(salary.basicSalary)}
                                        </td>
                                        <td className="px-3 py-4 font-semibold text-white">
                                            {formatCurrency(salary.netSalary)}
                                        </td>
                                        <td className="px-3 py-4 text-slate-300">
                                            {salary.paymentMethod || "Other"}
                                        </td>
                                        <td className="px-3 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${salary.status === "Paid"
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : "bg-amber-500/10 text-amber-400"
                                                }`}>
                                                {salary.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-4">
                                            {salary.status === "Pending" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => markAsPaid(salary)}
                                                    className="rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                                                >
                                                    Mark Paid
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    Completed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
