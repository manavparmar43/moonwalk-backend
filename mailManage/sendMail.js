const nodemailer = require('nodemailer');
const { smtpHost, smtpPort, smtpUser, smtpPass, mailFrom } = require('../config/envConfig');

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    })
  : null;

function buildOrderConfirmationEmail({ restaurantName, customerName, trackingUrl, itemsSummary, estimatedDuration }) {
  const estimatedText =
    typeof estimatedDuration === 'number' ? `${Math.ceil(estimatedDuration / 60000)} Min` : null;
  return `
  <div style="font-family:Arial,sans-serif;background:#0b0f1a;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#131a2b;border:1px solid #232c44;border-radius:10px;padding:28px;">
      <h2 style="color:#e6e8ef;margin:0 0 16px;">${restaurantName}</h2>
      <p style="color:#e6e8ef;margin:0 0 12px;">Hi ${customerName},</p>
      <p style="color:#e6e8ef;margin:0 0 20px;">Your order has been received and is waiting in the kitchen queue.</p>
      <div style="background:#0b0f1a;border:1px solid #232c44;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
        <p style="color:#8892a6;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">Order summary</p>
        <p style="color:#e6e8ef;margin:0;">${itemsSummary}</p>
        ${estimatedText ? `<p style="color:#8892a6;font-size:0.85rem;margin:8px 0 0;">Estimated duration is ${estimatedText}</p>` : ''}
      </div>
      <p style="text-align:center;margin:0 0 20px;">
        <a href="${trackingUrl}" style="background:#7dd3fc;color:#0b0f1a;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:6px;display:inline-block;">Track your order</a>
      </p>
      <p style="color:#8892a6;font-size:0.85rem;margin:0;">You can revisit this tracking link anytime to check your order's status.</p>
    </div>
  </div>`;
}

async function sendMail({ to, subject, html }) {
  if (process.env.NODE_ENV === 'test') {
    console.log(`Email skipped (test environment): "${subject}" -> ${to}`);
    return;
  }

  if (!transporter) {
    console.log(`Email skipped (SMTP not configured): "${subject}" -> ${to}`);
    return;
  }

  try {
    await transporter.sendMail({ from: mailFrom || smtpUser, to, subject, html });
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

async function sendOrderConfirmationMail({
  to,
  restaurantName,
  customerName,
  trackingUrl,
  itemsSummary,
  estimatedDuration,
}) {
  return sendMail({
    to,
    subject: `Order received - ${restaurantName}`,
    html: buildOrderConfirmationEmail({ restaurantName, customerName, trackingUrl, itemsSummary, estimatedDuration }),
  });
}

function queueOrderConfirmationMail({ to, restaurantName, customerName, trackingUrl, itemsSummary, estimatedDuration }) {
  setImmediate(async () => {
    try {
      await sendOrderConfirmationMail({ to, restaurantName, customerName, trackingUrl, itemsSummary, estimatedDuration });
    } catch (err) {
      console.error('Background mail send failed:', err.message);
    }
  });
}

module.exports = { sendMail, sendOrderConfirmationMail, buildOrderConfirmationEmail, queueOrderConfirmationMail };
