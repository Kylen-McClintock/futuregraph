import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  const js = `(function() {
  var currentScript = document.currentScript;
  if (!currentScript) return;

  var theme = currentScript.getAttribute("data-theme") || "dark";
  var view = currentScript.getAttribute("data-view") || "all";
  var age = currentScript.getAttribute("data-age") || "35";
  var mode = currentScript.getAttribute("data-mode") || "conservative";
  var hostOrigin = ${JSON.stringify(origin)};

  var container = document.createElement("div");
  container.className = "fg-lev-embed-wrapper";
  container.style.width = "100%";
  container.style.maxWidth = "1120px";
  container.style.margin = "1rem auto";

  var iframe = document.createElement("iframe");
  var srcUrl = hostOrigin + "/embed/lev?theme=" + encodeURIComponent(theme) +
    "&view=" + encodeURIComponent(view) +
    "&age=" + encodeURIComponent(age) +
    "&mode=" + encodeURIComponent(mode);

  iframe.src = srcUrl;
  iframe.title = "Longevity Escape Velocity (LEV) 99th Percentile Aggregate & Dynamic Pace of Aging Tracker (LEVL Trajectory)";
  iframe.style.width = "100%";
  iframe.style.minHeight = "780px";
  iframe.style.border = "1px solid rgba(148, 163, 184, 0.25)";
  iframe.style.borderRadius = "16px";
  iframe.style.display = "block";
  iframe.setAttribute("loading", "lazy");

  container.appendChild(iframe);
  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

  window.addEventListener("message", function(event) {
    if (!event.data || event.data.type !== "fg-lev-embed-resize") return;
    if (typeof event.data.height === "number" && event.data.height > 320) {
      iframe.style.height = (event.data.height + 24) + "px";
    }
  });
})();`;

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
