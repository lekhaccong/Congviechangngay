import { createClient } from "npm:@supabase/supabase-js@2";

type NotificationEvent = {
  id: string;
  title: string;
  body: string;
  route: string;
  actor_id: string | null;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const appId = Deno.env.get("ONESIGNAL_APP_ID");
  const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!appId || !apiKey || !supabaseUrl || !serviceKey) return new Response("Push secrets are missing", { status: 500 });

  const payload = await request.json();
  const record = payload.record as NotificationEvent | undefined;
  if (!record?.id) return new Response("Missing notification record", { status: 400 });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: profiles, error: profileError } = await admin.from("profiles").select("id").eq("active", true);
  if (profileError) return new Response(profileError.message, { status: 500 });
  const recipients = (profiles ?? []).map((item) => item.id).filter((id) => id !== record.actor_id);
  if (!recipients.length) {
    await admin.from("notification_events").update({ delivered_at: new Date().toISOString() }).eq("id", record.id);
    return Response.json({ delivered: 0 });
  }

  const publicUrl = (Deno.env.get("APP_PUBLIC_URL") ?? "").replace(/\/$/, "");
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: recipients },
      target_channel: "push",
      headings: { vi: record.title, en: record.title },
      contents: { vi: record.body || record.title, en: record.body || record.title },
      data: { route: record.route, notification_event_id: record.id },
      ...(publicUrl ? { url: `${publicUrl}/#${record.route}` } : {}),
    }),
  });
  const result = await response.text();
  await admin.from("notification_events").update(response.ok
    ? { delivered_at: new Date().toISOString(), delivery_error: null }
    : { delivery_error: result.slice(0, 1000) }).eq("id", record.id);
  return new Response(result, { status: response.status, headers: { "Content-Type": "application/json" } });
});
