import { prisma } from "../config/prisma.js";

const DEFAULT_HOME_MERCHANDISING = {
  carousel: {
    enabled: true,
    direction: "ltr",
    speedSeconds: 34,
    pauseOnHover: true,
  },
  todayOffers: {
    enabled: true,
    eyebrow: "Today's marketplace offers",
    title: "Popular products worth checking now",
    description: "Approved products selected for today's SmartSell shoppers.",
    link: "/marketplace?sort=featured",
    productIds: [],
  },
  flashSale: {
    enabled: true,
    badge: "Limited-time marketplace event",
    title: "Flash Friday",
    description: "Fast-moving products and special marketplace picks for a limited time.",
    link: "/marketplace?sort=featured",
    startAt: "",
    endAt: "",
    productIds: [],
  },
  budgetCollection: {
    enabled: true,
    eyebrow: "Small prices, useful finds",
    title: "Products under Rs. 1,000",
    description: "Affordable everyday products, gifts, accessories, and locally made items.",
    maxPrice: 1000,
    link: "/marketplace?maxPrice=1000&sort=price_asc",
    productIds: [],
  },
  marketplaceHighlights: {
    enabled: true,
    autoplay: true,
    intervalSeconds: 5,
    slides: [],
  },
};

const DEFAULT_SETTINGS = [
  {
    key: "general.platformName",
    group: "general",
    label: "Platform name",
    description: "Main business/application name shown around the platform.",
    value: "SmartSell",
    isPublic: true,
    type: "text",
  },
  {
    key: "general.tagline",
    group: "general",
    label: "Tagline",
    description: "Short public line used for SmartSell branding.",
    value: "Products, used goods, services, shops, and custom requests in one trusted marketplace.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "general.supportPhone",
    group: "general",
    label: "Support phone",
    description: "Primary customer support phone number.",
    value: "0756730040",
    isPublic: true,
    type: "text",
  },
  {
    key: "general.supportEmail",
    group: "general",
    label: "Support email",
    description: "Primary customer support email address.",
    value: "support@smartsell.local",
    isPublic: true,
    type: "text",
  },
  {
    key: "general.defaultLocation",
    group: "general",
    label: "Default location",
    description: "Default marketplace location/area shown in business pages.",
    value: "Sri Lanka",
    isPublic: true,
    type: "text",
  },
  {
    key: "marketplace.commissionRate",
    group: "marketplace",
    label: "SmartSell commission rate (%)",
    description: "Default percentage kept by SmartSell when seller/shop orders are marked Delivered + Paid.",
    value: 10,
    isPublic: false,
    type: "number",
    min: 0,
    max: 50,
  },
  {
    key: "marketplace.lowStockThreshold",
    group: "marketplace",
    label: "Low stock threshold",
    description: "Products at or below this stock count appear in low-stock reports.",
    value: 5,
    isPublic: false,
    type: "number",
    min: 0,
    max: 999,
  },
  {
    key: "marketplace.allowUsedProductOffers",
    group: "marketplace",
    label: "Allow used-product offers",
    description: "Enable customer offer/negotiation flow for used products.",
    value: true,
    isPublic: true,
    type: "boolean",
  },
  {
    key: "marketplace.autoApproveOwnProducts",
    group: "marketplace",
    label: "Auto-approve own/admin products",
    description: "When enabled, admin-created SmartSell own products can skip approval.",
    value: false,
    isPublic: false,
    type: "boolean",
  },
  {
    key: "orders.minimumOrderAmount",
    group: "orders",
    label: "Minimum order amount",
    description: "Minimum product order amount for checkout. Use 0 to disable.",
    value: 0,
    isPublic: true,
    type: "number",
    min: 0,
  },
  {
    key: "orders.defaultDeliveryFee",
    group: "orders",
    label: "Default delivery fee",
    description: "Default delivery charge reference shown to customers/admin. This does not force payment gateway charges yet.",
    value: 0,
    isPublic: true,
    type: "number",
    min: 0,
  },
  {
    key: "orders.codEnabled",
    group: "orders",
    label: "Cash on delivery enabled",
    description: "Show/allow COD as an offline payment option.",
    value: true,
    isPublic: true,
    type: "boolean",
  },
  {
    key: "orders.deliveryNotice",
    group: "orders",
    label: "Delivery notice",
    description: "Public note shown near checkout/order pages.",
    value: "Delivery time and charges may vary based on location and seller/service availability.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "requests.quoteExpiryDays",
    group: "requests",
    label: "Quote expiry days",
    description: "Default number of days a custom quotation remains valid.",
    value: 3,
    isPublic: false,
    type: "number",
    min: 1,
    max: 30,
  },
  {
    key: "requests.urgentRequestsEnabled",
    group: "requests",
    label: "Urgent requests enabled",
    description: "Allow admin/business teams to treat custom requests as urgent.",
    value: true,
    isPublic: true,
    type: "boolean",
  },
  {
    key: "homeMerchandising.config",
    group: "homeMerchandising",
    label: "Homepage merchandising",
    description: "Admin-managed homepage offer rails, flash-sale campaign, budget collection, and marketplace highlight slides.",
    value: DEFAULT_HOME_MERCHANDISING,
    isPublic: true,
    type: "json",
  },
  {
    key: "content.heroBadge",
    group: "content",
    label: "Hero badge",
    description: "Small badge above the homepage hero headline.",
    value: "Marketplace • Services • Used Products • Requests",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.heroTitle",
    group: "content",
    label: "Homepage hero title",
    description: "Main public headline for the platform.",
    value: "Sell products, find services, and request anything from one smart platform.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "content.heroSubtitle",
    group: "content",
    label: "Homepage hero subtitle",
    description: "Short public explanation below the homepage headline.",
    value: "SmartSell connects own products, client products, shop sellers, used items, service providers, and customer requests into one trusted marketplace experience.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "content.heroPrimaryButtonText",
    group: "content",
    label: "Primary button text",
    description: "Main hero call-to-action button text.",
    value: "Explore Marketplace",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.heroPrimaryButtonLink",
    group: "content",
    label: "Primary button link",
    description: "Main hero call-to-action route, such as /marketplace.",
    value: "/marketplace",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.heroSecondaryButtonText",
    group: "content",
    label: "Secondary button text",
    description: "Second hero call-to-action button text.",
    value: "Request Anything",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.heroSecondaryButtonLink",
    group: "content",
    label: "Secondary button link",
    description: "Second hero call-to-action route, such as /request-anything.",
    value: "/request-anything",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.heroFloatingOne",
    group: "content",
    label: "Floating card 1",
    description: "Small floating hero card text.",
    value: "Used phone under budget",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.heroFloatingTwo",
    group: "content",
    label: "Floating card 2",
    description: "Small floating hero card text.",
    value: "Cake + gift + delivery",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.heroFloatingThree",
    group: "content",
    label: "Floating card 3",
    description: "Small floating hero card text.",
    value: "Shop seller order",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.statOneValue",
    group: "content",
    label: "Stat 1 value",
    description: "First homepage trust/stat value.",
    value: "6+",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.statOneLabel",
    group: "content",
    label: "Stat 1 label",
    description: "First homepage trust/stat label.",
    value: "Business streams",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.statTwoValue",
    group: "content",
    label: "Stat 2 value",
    description: "Second homepage trust/stat value.",
    value: "24/7",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.statTwoLabel",
    group: "content",
    label: "Stat 2 label",
    description: "Second homepage trust/stat label.",
    value: "Request support",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.statThreeValue",
    group: "content",
    label: "Stat 3 value",
    description: "Third homepage trust/stat value.",
    value: "100%",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.statThreeLabel",
    group: "content",
    label: "Stat 3 label",
    description: "Third homepage trust/stat label.",
    value: "Admin controlled",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.publicAnnouncement",
    group: "content",
    label: "Public announcement",
    description: "Optional announcement shown on the homepage. Leave blank when not needed.",
    value: "",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "content.businessModelEyebrow",
    group: "content",
    label: "Business model eyebrow",
    description: "Small heading for the business model section.",
    value: "SmartSell Business Model",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.businessModelTitle",
    group: "content",
    label: "Business model title",
    description: "Main title for the business model section.",
    value: "One app, many ways to sell and serve",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.businessModelDescription",
    group: "content",
    label: "Business model description",
    description: "Description for the business model section.",
    value: "SmartSell is designed around products, shops, used items, services, and custom requests — all managed through one trusted platform.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "content.productsEyebrow",
    group: "content",
    label: "Products section eyebrow",
    description: "Small heading for the homepage products section.",
    value: "Featured Products",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.productsTitle",
    group: "content",
    label: "Products section title",
    description: "Main title for the homepage products section.",
    value: "Sell new, shop, client, and used products",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.productsDescription",
    group: "content",
    label: "Products section description",
    description: "Description for homepage featured products.",
    value: "Browse approved listings from SmartSell, sellers, shops, and used-product owners.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "content.servicesEyebrow",
    group: "content",
    label: "Services section eyebrow",
    description: "Small heading for the homepage services section.",
    value: "Service Marketplace",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.servicesTitle",
    group: "content",
    label: "Services section title",
    description: "Main title for homepage services.",
    value: "Customers can request services by budget",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.servicesDescription",
    group: "content",
    label: "Services section description",
    description: "Description for homepage services.",
    value: "Cake, editing, web development, delivery, gifts, events, and more can work with quotations.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "content.requestEyebrow",
    group: "content",
    label: "Request block eyebrow",
    description: "Small heading for the Request Anything block.",
    value: "Unique Feature",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.requestTitle",
    group: "content",
    label: "Request block title",
    description: "Main title for Request Anything block.",
    value: "Request Anything",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.requestDescription",
    group: "content",
    label: "Request block description",
    description: "Description explaining the Request Anything feature.",
    value: "Customers can explain what they need, add a budget, location, deadline, and references. Admin can reply with a quote or assign a seller/service provider.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "content.requestButtonText",
    group: "content",
    label: "Request button text",
    description: "Button text for Request Anything block.",
    value: "Create Request",
    isPublic: true,
    type: "text",
  },
  {
    key: "content.requestExamples",
    group: "content",
    label: "Request examples",
    description: "Examples shown in the Request Anything block. Add one example per line.",
    value: "I need a birthday cake and gift under Rs. 8,000 Find me a used laptop for study work I need a shop website and product posters Arrange delivery for a homemade food order",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "seo.defaultTitle",
    group: "seo",
    label: "Default browser title",
    description: "Fallback title used when a page does not provide its own SEO title.",
    value: "SmartSell | Products, Services & Custom Requests",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.defaultDescription",
    group: "seo",
    label: "Default meta description",
    description: "Fallback search/social description for SmartSell public pages.",
    value: "SmartSell is a trusted marketplace for products, used goods, shops, services, offers, and custom customer requests.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "seo.titleTemplate",
    group: "seo",
    label: "Title template",
    description: "Use {title} where the page title should appear.",
    value: "{title} | SmartSell",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.defaultKeywords",
    group: "seo",
    label: "Default keywords",
    description: "Comma-separated keywords used for public SmartSell pages.",
    value: "SmartSell, marketplace, used products, services, shops, custom requests, Sri Lanka",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "seo.siteUrl",
    group: "seo",
    label: "Public website URL",
    description: "Production website URL used for canonical links and social sharing. Leave localhost while developing.",
    value: "http://localhost:5174",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.socialImageUrl",
    group: "seo",
    label: "Social share image URL",
    description: "Default Open Graph/Twitter image URL used when sharing SmartSell links.",
    value: "/images/smartsell-logo-full.png",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.organizationName",
    group: "seo",
    label: "Organization name",
    description: "Business name used in structured data.",
    value: "SmartSell",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.organizationPhone",
    group: "seo",
    label: "Organization phone",
    description: "Phone number used in structured data and local business metadata.",
    value: "0756730040",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.organizationEmail",
    group: "seo",
    label: "Organization email",
    description: "Email used in structured data and local business metadata.",
    value: "support@smartsell.local",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.localBusinessArea",
    group: "seo",
    label: "Service area",
    description: "Main public area/country for local marketplace SEO.",
    value: "Sri Lanka",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.twitterHandle",
    group: "seo",
    label: "Twitter/X handle",
    description: "Optional handle for Twitter card metadata. Leave blank if not used.",
    value: "",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.robotsIndex",
    group: "seo",
    label: "Allow indexing",
    description: "When disabled, pages use noindex,nofollow metadata for development/private testing.",
    value: true,
    isPublic: true,
    type: "boolean",
  },
  {
    key: "seo.marketplaceTitle",
    group: "seo",
    label: "Marketplace page title",
    description: "SEO title for the marketplace page.",
    value: "Marketplace Products",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.marketplaceDescription",
    group: "seo",
    label: "Marketplace page description",
    description: "SEO description for product listings and used-product browsing.",
    value: "Browse SmartSell products from shops, individual sellers, client listings, and used-product owners.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "seo.servicesTitle",
    group: "seo",
    label: "Services page title",
    description: "SEO title for the services page.",
    value: "Service Marketplace",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.servicesDescription",
    group: "seo",
    label: "Services page description",
    description: "SEO description for services and quotation pages.",
    value: "Find cake makers, editors, web developers, delivery support, event services, and custom service providers on SmartSell.",
    isPublic: true,
    type: "textarea",
  },
  {
    key: "seo.storesTitle",
    group: "seo",
    label: "Stores page title",
    description: "SEO title for public storefront browsing.",
    value: "Stores & Business Profiles",
    isPublic: true,
    type: "text",
  },
  {
    key: "seo.storesDescription",
    group: "seo",
    label: "Stores page description",
    description: "SEO description for SmartSell seller, shop, and provider profiles.",
    value: "Explore verified SmartSell shops, sellers, and service providers with public business profiles and approved listings.",
    isPublic: true,
    type: "textarea",
  },

];

const DEFAULT_MAP = new Map(DEFAULT_SETTINGS.map((setting) => [setting.key, setting]));

function normalizeValue(setting, nextValue) {
  if (!setting) return nextValue;

  if (setting.type === "boolean") {
    return Boolean(nextValue);
  }

  if (setting.type === "number") {
    let number = Number(nextValue);
    if (!Number.isFinite(number)) number = Number(setting.value || 0);
    if (setting.min !== undefined) number = Math.max(Number(setting.min), number);
    if (setting.max !== undefined) number = Math.min(Number(setting.max), number);
    return number;
  }

  if (setting.type === "json") {
    if (nextValue === null || nextValue === undefined) return setting.value;
    if (typeof nextValue === "string") {
      try {
        return JSON.parse(nextValue);
      } catch {
        throw new Error(`${setting.label || setting.key} must be valid JSON.`);
      }
    }
    if (typeof nextValue !== "object") {
      throw new Error(`${setting.label || setting.key} must be an object or array.`);
    }
    return JSON.parse(JSON.stringify(nextValue));
  }

  return String(nextValue ?? "").trim();
}

function rowToSetting(row) {
  const definition = DEFAULT_MAP.get(row.key) || {};
  return {
    key: row.key,
    group: row.group,
    label: row.label || definition.label || row.key,
    description: row.description || definition.description || "",
    value: row.value,
    isPublic: row.isPublic,
    type: definition.type || "text",
    min: definition.min,
    max: definition.max,
    updatedAt: row.updatedAt,
  };
}

function groupedObject(rows) {
  return rows.reduce((acc, row) => {
    const setting = rowToSetting(row);
    if (!acc[setting.group]) acc[setting.group] = {};
    acc[setting.group][setting.key.split(".").slice(1).join(".") || setting.key] = setting.value;
    return acc;
  }, {});
}

export async function ensurePlatformSettings(txClient = prisma) {
  for (const setting of DEFAULT_SETTINGS) {
    await txClient.platformSetting.upsert({
      where: { key: setting.key },
      create: {
        key: setting.key,
        group: setting.group,
        label: setting.label,
        description: setting.description,
        value: setting.value,
        isPublic: setting.isPublic,
      },
      update: {
        group: setting.group,
        label: setting.label,
        description: setting.description,
        isPublic: setting.isPublic,
      },
    });
  }
}

export async function getAdminSettings() {
  await ensurePlatformSettings();

  const rows = await prisma.platformSetting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });

  const settings = rows.map(rowToSetting);
  return {
    settings,
    grouped: groupedObject(rows),
    groups: [...new Set(settings.map((setting) => setting.group))],
  };
}

export async function getPublicSettings() {
  await ensurePlatformSettings();

  const rows = await prisma.platformSetting.findMany({
    where: { isPublic: true },
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });

  return groupedObject(rows);
}

export async function updatePlatformSettings(payload, admin) {
  await ensurePlatformSettings();

  const incoming = payload?.settings || payload || {};
  const entries = Array.isArray(incoming)
    ? incoming.map((item) => [item.key, item.value])
    : Object.entries(incoming);

  const changed = [];

  for (const [key, rawValue] of entries) {
    const definition = DEFAULT_MAP.get(key);
    if (!definition) continue;

    const value = normalizeValue(definition, rawValue);
    const updated = await prisma.platformSetting.update({
      where: { key },
      data: {
        value,
        updatedById: admin?.id || null,
      },
    });

    changed.push(rowToSetting(updated));
  }

  if (changed.length) {
    await prisma.adminAction.create({
      data: {
        adminId: admin?.id || null,
        action: "platform_settings_updated",
        targetType: "platform_settings",
        targetId: "global",
        note: `Updated ${changed.length} platform setting(s).`,
      },
    });
  }

  return getAdminSettings();
}

export async function getSettingValue(key, fallbackValue, txClient = prisma) {
  const row = await txClient.platformSetting.findUnique({ where: { key } }).catch(() => null);
  if (!row) return fallbackValue;
  return row.value ?? fallbackValue;
}

export async function getCommissionRate(txClient = prisma) {
  const raw = await getSettingValue("marketplace.commissionRate", 10, txClient);
  const rate = Number(raw);
  if (!Number.isFinite(rate)) return 10;
  return Math.min(50, Math.max(0, rate));
}
