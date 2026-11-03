import { createECDH, timingSafeEqual } from "node:crypto";
import { validPushKey } from "./water-push";

/** Server-only. Never return privateKey or secret to clients or logs. */
export function waterPushConfig() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY, privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT, secret = process.env.WATER_PUSH_CRON_SECRET;
  if (!validPushKey(publicKey, 65) || !validPushKey(privateKey, 32) || !secret || secret.length < 32 || !subject || !/^(mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/.test(subject)) return null;
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));
    const expected = ecdh.getPublicKey(), provided = Buffer.from(publicKey, "base64url");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  } catch { return null; }
  return { publicKey, privateKey, subject, secret };
}
