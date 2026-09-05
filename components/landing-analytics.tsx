"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "mobile" as const;
  if (width < 1024) return "tablet" as const;
  return "desktop" as const;
}

export function LandingAnalytics() {
  useEffect(() => {
    let sessionId = window.sessionStorage.getItem("barba10_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      window.sessionStorage.setItem("barba10_session_id", sessionId);
    }

    const supabase = createClient();
    const referrer = document.referrer || null;
    const source = new URLSearchParams(window.location.search).get("utm_source");

    void supabase.from("site_events").insert({
      event_type: "page_view",
      path: window.location.pathname,
      session_id: sessionId,
      referrer,
      source,
      device_type: getDeviceType(),
    });
  }, []);

  return null;
}

export async function trackLandingCta() {
  const sessionId =
    window.sessionStorage.getItem("barba10_session_id") ?? crypto.randomUUID();

  window.sessionStorage.setItem("barba10_session_id", sessionId);

  const supabase = createClient();
  await supabase.from("site_events").insert({
    event_type: "cta_signup_click",
    path: window.location.pathname,
    session_id: sessionId,
    referrer: document.referrer || null,
    source: new URLSearchParams(window.location.search).get("utm_source"),
    device_type: getDeviceType(),
  });
}
