import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 7000,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: {
    minVersion: "TLSv1.2",
  },
});

export const sendOtpEmail = async (to: string, otp: string, purpose: "signup" | "login" | "password-reset") => {
  const subjectMap = {
    signup: "Verify your FahRide account",
    login: "Your FahRide login OTP",
    "password-reset": "Reset your FahRide password",
  };

  const purposeText = {
    signup: "signup",
    login: "login",
    "password-reset": "password reset",
  };

  const subject = subjectMap[purpose];
  const textContent = `Your FahRide OTP for ${purposeText[purpose]} is ${otp}. It expires in a few minutes.`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>FahRide OTP</h2>
      <p>Your one-time password for <strong>${purposeText[purpose]}</strong> is:</p>
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 8px; margin: 20px 0;">${otp}</div>
      <p>This OTP expires in a few minutes. If you did not request this, ignore this email.</p>
    </div>
  `;

  // Always send email
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text: textContent,
    html: htmlContent,
    ...(env.SMTP_REPLY_TO ? { replyTo: env.SMTP_REPLY_TO } : {}),
  });
};
