import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

let cachedTransporter = null;

function normalizePhone(phone = "") {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return digits;
  if (digits.startsWith("0")) return `94${digits.slice(1)}`;
  return digits;
}

function publicUrl(link = "") {
  const path = String(link || "").trim();
  if (!path) return env.clientUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${env.clientUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function plainMessage({ title, message, link }) {
  const lines = [title, "", message];
  if (link) lines.push("", `Open: ${publicUrl(link)}`);
  return lines.filter(Boolean).join("\n");
}

function htmlMessage({ title, message, link }) {
  const safeTitle = String(title || "SmartSell notification");
  const safeMessage = String(message || "").replaceAll("\n", "<br />");
  const action = link
    ? `<p style="margin:24px 0 0"><a href="${publicUrl(link)}" style="background:#2563eb;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">Open SmartSell</a></p>`
    : "";

  return `
  <div style="font-family:Arial,sans-serif;background:#f8fbff;padding:24px;color:#0f172a">
    <div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:28px">
      <p style="margin:0 0 10px;color:#2563eb;font-weight:700;letter-spacing:.04em;text-transform:uppercase">${env.brandName}</p>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${safeTitle}</h1>
      <p style="margin:0;color:#475569;line-height:1.7">${safeMessage}</p>
      ${action}
      <p style="margin:26px 0 0;color:#94a3b8;font-size:13px">This is an automated SmartSell notification.</p>
    </div>
  </div>`;
}

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { smtp } = env.notifications;
  if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from) return null;

  const nodemailer = await import("nodemailer");
  cachedTransporter = nodemailer.default.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return cachedTransporter;
}

export async function sendEmailNotification({ to, title, message, link }) {
  if (!env.notifications.emailEnabled) return { sent: false, reason: "email_disabled" };
  if (!to) return { sent: false, reason: "missing_email" };

  const transporter = await getTransporter();
  if (!transporter) return { sent: false, reason: "smtp_not_configured" };

  await transporter.sendMail({
    from: env.notifications.smtp.from,
    to,
    subject: `[${env.brandName}] ${title}`,
    text: plainMessage({ title, message, link }),
    html: htmlMessage({ title, message, link }),
  });

  return { sent: true, channel: "email" };
}

export async function sendWhatsAppNotification({ to, title, message, link }) {
  if (!env.notifications.whatsappEnabled) return { sent: false, reason: "whatsapp_disabled" };

  const phone = normalizePhone(to);
  if (!phone) return { sent: false, reason: "missing_phone" };

  const body = plainMessage({ title, message, link });
  const { webhookUrl, bearerToken, from } = env.notifications.whatsapp;

  if (!webhookUrl) {
    return {
      sent: false,
      reason: "whatsapp_webhook_not_configured",
      manualLink: `https://wa.me/${phone}?text=${encodeURIComponent(body)}`,
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
    body: JSON.stringify({ to: phone, from, message: body, title, link: link ? publicUrl(link) : null }),
  });

  if (!response.ok) {
    return { sent: false, reason: `whatsapp_webhook_${response.status}` };
  }

  return { sent: true, channel: "whatsapp" };
}

export async function deliverContactNotification({ email, phone, title, message, link }) {
  const results = await Promise.allSettled([
    sendEmailNotification({ to: email, title, message, link }),
    sendWhatsAppNotification({ to: phone, title, message, link }),
  ]);

  return results.map((result) => (result.status === "fulfilled" ? result.value : { sent: false, reason: result.reason?.message || "delivery_failed" }));
}

export async function deliverUserNotification({ userId, title, message, link }) {
  if (!userId) return [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true },
  });
  if (!user) return [];
  return deliverContactNotification({ email: user.email, phone: user.phone, title, message, link });
}

export function notificationChannelStatus() {
  return {
    email: {
      enabled: env.notifications.emailEnabled,
      configured: Boolean(env.notifications.smtp.host && env.notifications.smtp.user && env.notifications.smtp.pass && env.notifications.smtp.from),
      from: env.notifications.smtp.from || null,
    },
    whatsapp: {
      enabled: env.notifications.whatsappEnabled,
      configured: Boolean(env.notifications.whatsapp.webhookUrl),
      from: env.notifications.whatsapp.from || null,
    },
  };
}

export async function sendNotificationChannelTest({ email, phone }) {
  return deliverContactNotification({
    email,
    phone,
    title: "SmartSell notification test",
    message: "Your SmartSell email/WhatsApp notification channel is connected.",
    link: "/notifications",
  });
}
