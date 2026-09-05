"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "mobile" as const;
  if (width < 1024) return "tablet" as const;
  return "desktop" as const;
}

export async function trackLandingEvent(
  eventType: "page_view" | "cta_signup_click" | "signup_started" | "signup_completed",
  path = window.location.pathname
) {
  const sessionId =
    window.sessionStorage.getItem("barba10_session_id") ?? crypto.randomUUID();

  window.sessionStorage.setItem("barba10_session_id", sessionId);

  const supabase = createClient();
  await supabase.from("site_events").insert({
    event_type: eventType,
    path,
    session_id: sessionId,
    referrer: document.referrer || null,
    source: new URLSearchParams(window.location.search).get("utm_source"),
    device_type: getDeviceType(),
  });
}

export function LandingAnalytics() {
  useEffect(() => {
    void trackLandingEvent("page_view");
  }, []);

  return null;
}
