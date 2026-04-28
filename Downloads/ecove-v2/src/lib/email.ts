import nodemailer from 'nodemailer';
import { getSmtpConfig } from './config';

// Transporter is created fresh per-send so DB config changes take effect immediately.
// Nodemailer caches the connection pool internally so this is efficient.
async function getTransporter() {
  const smtp = await getSmtpConfig();
  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw new Error('SMTP not configured. Set SMTP settings in Admin → Settings → Email.');
  }
  return nodemailer.createTransport({
    host:   smtp.host,
    port:   smtp.port,
    secure: smtp.secure,
    auth:   { user: smtp.user, pass: smtp.pass },
  });
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ecove.com.ng';

async function send(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const smtp = await getSmtpConfig();
    const from = smtp.from || 'Ecove Marketplace <noreply@ecove.com.ng>';
    const transport = await getTransporter();
    await transport.sendMail({ from, to, subject, html });
    return true;
  } catch (err: any) {
    // Log but never throw — a failed email must not crash the API response
    console.error('[email] Failed to send email:', {
      to, subject, error: err?.message || String(err),
    });
    return false;
  }
}

function layout(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
    body{font-family:'Helvetica Neue',sans-serif;background:#f5f5f5;margin:0;padding:0}
    .wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
    .header{background:#f68b1f;padding:24px 32px;text-align:center}
    .logo{font-size:28px;font-weight:800;color:#fff;letter-spacing:-1px}
    .body{padding:32px}
    h2{margin:0 0 16px;color:#313131;font-size:20px}
    p{color:#555;line-height:1.7;margin:0 0 14px;font-size:14px}
    .btn{display:inline-block;background:#f68b1f;color:#fff!important;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px}
    .footer{background:#fafafa;border-top:1px solid #eee;padding:16px 32px;text-align:center;font-size:11px;color:#aaa}
  </style></head><body>
  <div class="wrap">
    <div class="header"><div class="logo">ecove</div></div>
    <div class="body">${content}</div>
    <div class="footer">© ${new Date().getFullYear()} Ecove Marketplace · ecove.com.ng<br/>You received this email because you have an account on Ecove.</div>
  </div></body></html>`;
}

// ── Auth emails ──────────────────────────────────────────────────────────────

export async function sendVerifyEmail(to: string, firstName: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`;
  await send(to, 'Verify your Ecove account', layout(`
    <h2>Welcome to Ecove, ${firstName}! 🎉</h2>
    <p>Thanks for signing up. Click the button below to verify your email address and activate your account.</p>
    <p style="text-align:center"><a href="${link}" class="btn">Verify Email Address</a></p>
    <p>Or copy this link: <a href="${link}">${link}</a></p>
    <p>This link expires in 24 hours.</p>
  `));
}

export async function sendPasswordReset(to: string, firstName: string, token: string) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  await send(to, 'Reset your Ecove password', layout(`
    <h2>Password Reset Request</h2>
    <p>Hi ${firstName}, we received a request to reset your Ecove password.</p>
    <p style="text-align:center"><a href="${link}" class="btn">Reset Password</a></p>
    <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `));
}

// ── Vendor emails ────────────────────────────────────────────────────────────

export async function sendVendorApplicationReceived(to: string, businessName: string) {
  await send(to, 'Vendor Application Received – Ecove', layout(`
    <h2>Application Received! 📋</h2>
    <p>Hi, thank you for applying to sell on Ecove Marketplace as <strong>${businessName}</strong>.</p>
    <p>Our admin team will review your application within <strong>24–48 hours</strong>. You'll receive an email notification once a decision is made.</p>
    <p>While you wait, you can explore the marketplace at <a href="${APP_URL}">${APP_URL}</a></p>
  `));
}

export async function sendVendorApproved(to: string, businessName: string) {
  const link = `${APP_URL}/vendor/dashboard`;
  await send(to, '🎉 Your Ecove Vendor Account is Approved!', layout(`
    <h2>Congratulations! You're now an Ecove Vendor 🎉</h2>
    <p>Your vendor application for <strong>${businessName}</strong> has been <strong>approved</strong>!</p>
    <p>You can now log in and start listing products. Every product requires admin approval before going live.</p>
    <p style="text-align:center"><a href="${link}" class="btn">Go to Vendor Dashboard</a></p>
  `));
}

export async function sendVendorRejected(to: string, businessName: string, reason: string) {
  await send(to, 'Ecove Vendor Application Update', layout(`
    <h2>Application Update</h2>
    <p>Hi, we've reviewed your application for <strong>${businessName}</strong>.</p>
    <p>Unfortunately, we are unable to approve your application at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>You may reapply after addressing the feedback above. Contact us at vendors@ecove.com.ng if you have questions.</p>
  `));
}

export async function sendVendorSuspended(to: string, businessName: string, reason: string) {
  await send(to, 'Your Ecove Vendor Account Has Been Suspended', layout(`
    <h2>Account Suspended ⚠️</h2>
    <p>Your vendor account for <strong>${businessName}</strong> has been suspended.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Contact us at vendors@ecove.com.ng to appeal this decision.</p>
  `));
}

// ── Product emails ───────────────────────────────────────────────────────────

export async function sendProductApproved(to: string, productName: string) {
  const link = `${APP_URL}/vendor/products`;
  await send(to, `✅ Product Approved: ${productName}`, layout(`
    <h2>Product Approved!</h2>
    <p>Great news! Your product <strong>"${productName}"</strong> has been approved and is now <strong>live on Ecove Marketplace</strong>.</p>
    <p>Customers can now find and purchase it.</p>
    <p style="text-align:center"><a href="${link}" class="btn">View My Products</a></p>
  `));
}

export async function sendProductRejected(to: string, productName: string, reason: string) {
  const link = `${APP_URL}/vendor/products`;
  await send(to, `Product Needs Revision: ${productName}`, layout(`
    <h2>Product Requires Changes</h2>
    <p>Your product <strong>"${productName}"</strong> could not be approved in its current form.</p>
    <p><strong>Reason from admin:</strong> ${reason}</p>
    <p>Please edit your product, address the feedback, and resubmit for review.</p>
    <p style="text-align:center"><a href="${link}" class="btn">Edit My Products</a></p>
  `));
}

// ── Order emails ─────────────────────────────────────────────────────────────

export async function sendOrderConfirmation(
  to: string,
  firstName: string,
  orderNumber: string,
  total: string
) {
  const link = `${APP_URL}/orders/${orderNumber}`;
  await send(to, `Order Confirmed #${orderNumber}`, layout(`
    <h2>Order Confirmed! 📦</h2>
    <p>Hi ${firstName}, your order <strong>#${orderNumber}</strong> has been confirmed.</p>
    <p><strong>Total Paid:</strong> ${total}</p>
    <p>You can track your order status anytime:</p>
    <p style="text-align:center"><a href="${link}" class="btn">Track Order</a></p>
  `));
}

export async function sendVendorNewOrder(
  to: string,
  vendorName: string,
  orderNumber: string,
  itemSummary: string
) {
  const link = `${APP_URL}/vendor/orders`;
  await send(to, `New Order Received – #${orderNumber}`, layout(`
    <h2>You have a new order! 🛍️</h2>
    <p>Hi ${vendorName}, a customer just placed an order for your products.</p>
    <p><strong>Order #${orderNumber}</strong><br/>${itemSummary}</p>
    <p>Please process and ship this order within your stated handling time.</p>
    <p style="text-align:center"><a href="${link}" class="btn">View Order</a></p>
  `));
}

// ── Payout emails ────────────────────────────────────────────────────────────

export async function sendPayoutApproved(to: string, vendorName: string, amount: string) {
  await send(to, `Payout Approved – ${amount}`, layout(`
    <h2>Payout Approved! 💸</h2>
    <p>Hi ${vendorName}, your withdrawal request of <strong>${amount}</strong> has been approved.</p>
    <p>The funds will be transferred to your registered bank account within <strong>2–5 business days</strong>.</p>
  `));
}

export async function sendPayoutPaid(to: string, vendorName: string, amount: string, ref: string) {
  await send(to, `Payment Sent – ${amount}`, layout(`
    <h2>Payment Sent! ✅</h2>
    <p>Hi ${vendorName}, your payout of <strong>${amount}</strong> has been sent to your bank account.</p>
    <p><strong>Transfer Reference:</strong> ${ref}</p>
    <p>Please allow 1–2 business days for the funds to reflect.</p>
  `));
}

export async function sendTestEmail(to: string): Promise<boolean> {
  return send(to, 'Ecove SMTP Test ✓', layout(`
    <h2>SMTP Test Successful</h2>
    <p>Your email settings are configured correctly.</p>
    <p>If you received this, transactional emails (order confirmations, password resets, vendor notifications) will work.</p>
    <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:13px;color:#166534;">
      ✅ SMTP connection: working<br/>
      ✅ Authentication: valid<br/>
      ✅ Delivery: confirmed
    </div>
  `))
}
