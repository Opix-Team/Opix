// lib/opix-callbacks.ts
import type { Authorization } from "@/types"; // or your actual path

export async function sendOpixCallback(
  auth: Authorization,
  event: string,
  data: unknown
) {
  if (!auth.is_active || !auth.redirect_uri) return;

  const payload = {
    event,
    client_id: auth.client_id,
    timestamp: Date.now(),
    data,
  };

  const res = await fetch(auth.redirect_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Opix-Client-ID": auth.client_id,
    },
    body: JSON.stringify(payload),
  });

  // Optional: log failures
  if (!res.ok) {
    console.error(
      `Opix callback failed for ${auth.app_name} (${auth.client_id}):`,
      res.status,
      await res.text()
    );
  }
}
