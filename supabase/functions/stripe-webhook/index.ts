import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Set by you in Project Settings -> Edge Functions -> Secrets:
//   STRIPE_SECRET_KEY      - your Stripe secret key (sk_...)
//   STRIPE_WEBHOOK_SECRET  - the signing secret for this endpoint (whsec_...),
//                            shown when you add the endpoint in the Stripe Dashboard
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// No verify_jwt here — Stripe calls this directly (no Supabase auth token).
// Authenticity instead comes from verifying Stripe's own request signature below.
Deno.serve(async (req: Request) => {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Invalid signature: ${(err as Error).message}`, { status: 400 });
  }

  async function setStatusByCustomer(customerId: string, status: string, subscriptionId?: string) {
    await admin
      .from("profiles")
      .update({
        subscription_status: status,
        ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_customer_id", customerId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer) {
        await setStatusByCustomer(session.customer as string, "active", session.subscription as string);
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";
      await setStatusByCustomer(sub.customer as string, status, sub.id);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await setStatusByCustomer(sub.customer as string, "canceled", sub.id);
      break;
    }
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
