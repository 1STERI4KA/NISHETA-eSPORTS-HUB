import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "nisheta_admin";

export function createAdminSessionToken(secret: string) {
  return createHmac("sha256", secret).update(ADMIN_SESSION_COOKIE).digest("base64url");
}

export async function isAdminSession() {
  const secret = process.env.ADMIN_SECRET;
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;

  if (!secret || !session) return false;

  const expected = Buffer.from(createAdminSessionToken(secret));
  const received = Buffer.from(session);

  return received.length === expected.length && timingSafeEqual(received, expected);
}
