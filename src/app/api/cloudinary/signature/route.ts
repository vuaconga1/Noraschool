import { createHash } from "crypto";
import { requireStaff } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    await requireStaff();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return jsonError("NOT_CONFIGURED", "Cloudinary chưa cấu hình", 503);
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest("hex");
    return jsonOk({ cloudName, apiKey, timestamp, signature });
  } catch (err) {
    return handleRouteError(err);
  }
}
