import { useEffect } from "react";
import api from "../utils/api.js";

let cachedPublicSettings = null;
let settingsPromise = null;

function upsertMeta(selector, attributes) {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    element.setAttribute(key, String(value));
  });
}

function upsertLink(rel, href) {
  if (typeof document === "undefined" || !href) return;
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function upsertJsonLd(id, payload) {
  if (typeof document === "undefined") return;
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.id = id;
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(payload);
}

function absoluteUrl(value, siteUrl) {
  const raw = String(value || "").trim();
  const base = String(siteUrl || window.location.origin || "").replace(/\/$/, "");
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${base}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

async function loadPublicSettings() {
  if (cachedPublicSettings) return cachedPublicSettings;
  if (!settingsPromise) {
    settingsPromise = api.get("/settings/public")
      .then((response) => response.data?.data || {})
      .catch(() => ({}));
  }
  cachedPublicSettings = await settingsPromise;
  return cachedPublicSettings;
}

export default function SEOHead({
  title,
  description,
  image,
  canonicalPath,
  type = "website",
  keywords,
  structuredData,
}) {
  useEffect(() => {
    let cancelled = false;

    async function applySeo() {
      const settings = await loadPublicSettings();
      if (cancelled || typeof document === "undefined") return;

      const seo = settings.seo || {};
      const siteUrl = String(seo.siteUrl || window.location.origin || "").replace(/\/$/, "");
      const fallbackTitle = seo.defaultTitle || "SmartSell | Products, Services & Custom Requests";
      const rawTitle = String(title || fallbackTitle).trim();
      const template = String(seo.titleTemplate || "{title} | SmartSell");
      const finalTitle = title ? template.replace("{title}", rawTitle) : rawTitle;
      const finalDescription = String(description || seo.defaultDescription || "SmartSell marketplace for products, used goods, services, shops, and custom requests.").trim();
      const finalKeywords = String(keywords || seo.defaultKeywords || "SmartSell, marketplace, products, services, used products").trim();
      const canonical = canonicalPath ? absoluteUrl(canonicalPath, siteUrl) : window.location.href;
      const shareImage = absoluteUrl(image || seo.socialImageUrl || "/images/smartsell-logo-full.png", siteUrl);
      const robots = seo.robotsIndex === false ? "noindex,nofollow" : "index,follow";

      document.title = finalTitle;
      upsertMeta('meta[name="description"]', { name: "description", content: finalDescription });
      upsertMeta('meta[name="keywords"]', { name: "keywords", content: finalKeywords });
      upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
      upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: "#0284ff" });

      upsertMeta('meta[property="og:title"]', { property: "og:title", content: finalTitle });
      upsertMeta('meta[property="og:description"]', { property: "og:description", content: finalDescription });
      upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
      upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
      upsertMeta('meta[property="og:image"]', { property: "og:image", content: shareImage });
      upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: seo.organizationName || "SmartSell" });

      upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: shareImage ? "summary_large_image" : "summary" });
      upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: finalTitle });
      upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: finalDescription });
      upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: shareImage });
      if (seo.twitterHandle) upsertMeta('meta[name="twitter:site"]', { name: "twitter:site", content: seo.twitterHandle });

      upsertLink("canonical", canonical);

      const organizationJson = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: seo.organizationName || "SmartSell",
        url: siteUrl || canonical,
        logo: absoluteUrl("/images/smartsell-logo-full.png", siteUrl),
        contactPoint: {
          "@type": "ContactPoint",
          telephone: seo.organizationPhone || "",
          email: seo.organizationEmail || "",
          contactType: "customer support",
          areaServed: seo.localBusinessArea || "Sri Lanka",
        },
      };

      upsertJsonLd("smartsell-organization-jsonld", organizationJson);
      if (structuredData) upsertJsonLd("smartsell-page-jsonld", structuredData);
    }

    applySeo();
    return () => { cancelled = true; };
  }, [title, description, image, canonicalPath, type, keywords, structuredData]);

  return null;
}
