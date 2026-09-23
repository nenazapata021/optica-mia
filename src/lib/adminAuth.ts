import { NextRequest } from "next/server";
import crypto from "crypto";

const ADMIN_COOKIE = "optica_admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.WOMPI_EVENT_SECRET || "change-me-in-prod";

export function signAdminToken(email: string): string {
  const payload = `${email.toLowerCase()}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
    if (sig.length !== expected.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const [email] = payload.split(":");
    if (!ADMIN_EMAIL) return false;
    return email.toLowerCase() === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

export function isAdminRequest(req: NextRequest | Request): boolean {
  // @ts-ignore
  const cookie = (req as NextRequest).cookies?.get?.(ADMIN_COOKIE)?.value || (req.headers as unknown as { get: (k:string)=>string|null })?.get?.("cookie")?.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`))?.[1];
  if (!cookie) return false;
  return verifyAdminToken(decodeURIComponent(cookie));
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
