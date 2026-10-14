const nodemailer = require("nodemailer");

const getTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_EMAIL,
    SMTP_APP_PASSWORD,
  } = process.env;

  if (!SMTP_HOST || !SMTP_EMAIL || !SMTP_APP_PASSWORD) {
    throw new Error("SMTP configuration is incomplete.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_EMAIL,
      pass: SMTP_APP_PASSWORD.replace(/\s/g, ""),
    },
  });
};

const sendSalaryEmail = async ({
  to,
  employeeName,
  month,
  year,
  netSalary,
  status,
  paymentDate,
  paymentMethod,
  transactionReference,
}) => {
  try {
    if (!to) {
      throw new Error("Employee email address is missing.");
    }

    const transporter = getTransporter();

    const monthName = new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleString("en-IN", {
      month: "long",
    });

    const isPaid = status === "Paid";
    const formattedSalary = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(netSalary);

    const subject = isPaid
      ? `Salary Payment Confirmation - ${monthName} ${year}`
      : `Salary Statement - ${monthName} ${year}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
        <div style="background:#172554;color:white;padding:22px;border-radius:10px 10px 0 0">
          <h2 style="margin:0">Shiuli Technology</h2>
          <p style="margin:8px 0 0">Salary Notification</p>
        </div>

        <div style="padding:24px;border:1px solid #e5e7eb;border-top:0">
          <p>Hello ${escapeHtml(employeeName || "Employee")},</p>

          <p>
            Your salary record for <strong>${monthName} ${year}</strong>
            has been ${isPaid ? "marked as paid" : "created"}.
          </p>

          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:10px;border-bottom:1px solid #eee">Salary month</td>
              <td style="padding:10px;border-bottom:1px solid #eee">
                ${monthName} ${year}
              </td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #eee">Net salary</td>
              <td style="padding:10px;border-bottom:1px solid #eee">
                <strong>${formattedSalary}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:10px;border-bottom:1px solid #eee">Status</td>
              <td style="padding:10px;border-bottom:1px solid #eee">
                <strong>${status}</strong>
              </td>
            </tr>
            ${
              isPaid
                ? `
                  <tr>
                    <td style="padding:10px;border-bottom:1px solid #eee">Payment date</td>
                    <td style="padding:10px;border-bottom:1px solid #eee">
                      ${paymentDate ? new Date(paymentDate).toLocaleDateString("en-IN") : "Not specified"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px;border-bottom:1px solid #eee">Payment method</td>
                    <td style="padding:10px;border-bottom:1px solid #eee">
                      ${escapeHtml(paymentMethod || "Other")}
                    </td>
                  </tr>
                  ${
                    transactionReference
                      ? `
                        <tr>
                          <td style="padding:10px;border-bottom:1px solid #eee">Transaction reference</td>
                          <td style="padding:10px;border-bottom:1px solid #eee">
                            ${escapeHtml(transactionReference)}
                          </td>
                        </tr>
                      `
                      : ""
                  }
                `
                : ""
            }
          </table>

          <p style="margin-top:24px">
            ${isPaid
              ? "Thank you. Please contact the administration if you have any questions about this payment."
              : "Your salary is currently pending. This notification is not a confirmation of payment."}
          </p>

          <p style="color:#666;font-size:12px">
            This is an automated email from Shiuli Technology. Please do not reply directly.
          </p>
        </div>
      </div>
    `;

    const fromName = process.env.EMAIL_FROM_NAME || "Shiuli Technology";

    const result = await transporter.sendMail({
      from: {
        name: fromName,
        address: process.env.SMTP_EMAIL,
      },
      to,
      subject,
      html,
      text: `Hello ${employeeName || "Employee"}, your salary for ${monthName} ${year} is ${formattedSalary}. Status: ${status}.`,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Salary email failed:", error.message);

    return { success: false, message: error.message };
  }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

module.exports = { sendSalaryEmail };