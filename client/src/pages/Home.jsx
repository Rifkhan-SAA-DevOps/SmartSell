import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import SEOHead from "../components/SEOHead.jsx";
import { featuredProducts, services as demoServices, requestExamples as demoRequestExamples } from "../data/demoData.js";
import api from "../utils/api.js";

const fallbackContent = {
  heroBadge: "Local marketplace • Services • Used deals • Custom requests",
  heroTitle: "Find trusted products and services for real everyday needs.",
  heroSubtitle: "Shop local products, compare used deals, request professional services, and manage every conversation from one modern marketplace.",
  heroPrimaryButtonText: "Explore Marketplace",
  heroPrimaryButtonLink: "/marketplace",
  heroSecondaryButtonText: "Request Anything",
  heroSecondaryButtonLink: "/request-anything",
  productsEyebrow: "Featured products",
  productsTitle: "Fresh product picks from SmartSell",
  productsDescription: "Browse approved products from shops, individual sellers, used-product owners, and SmartSell listings.",
  servicesEyebrow: "Featured services",
  servicesTitle: "Skilled providers ready for your request",
  servicesDescription: "Compare local providers for cakes, editing, delivery, events, web work, and more.",
  requestEyebrow: "Request anything",
  requestTitle: "Need something more specific? Describe it once.",
  requestDescription: "Share the need, budget, deadline, and location. SmartSell can help organise quotations, communication, and progress tracking from one place.",
  requestButtonText: "Start a Request",
  requestExamples: demoRequestExamples.join("\n"),
  publicAnnouncement: "",
};

const DEFAULT_MERCHANDISING = {
  carousel: { enabled: true, direction: "ltr", speedSeconds: 34, pauseOnHover: true },
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
  marketplaceHighlights: { enabled: true, autoplay: true, intervalSeconds: 5, slides: [] },
};

const channelCards = [
  { title: "Shop products", description: "New products from local shops and organised storefronts.", icon: "store", to: "/marketplace?type=shop_product", tone: "blue", label: "Local retail" },
  { title: "Used deals", description: "Second-hand phones, laptops, furniture, vehicles, and more.", icon: "refresh", to: "/marketplace?type=used_product", tone: "emerald", label: "Value finds" },
  { title: "Professional services", description: "Cakes, editing, delivery, events, websites, and custom work.", icon: "service", to: "/services", tone: "violet", label: "Quote based" },
  { title: "Request anything", description: "Post a need, budget, location, and deadline when no listing fits.", icon: "spark", to: "/request-anything", tone: "amber", label: "Custom help" },
];

const popularSearches = [
  { label: "Used phones", to: "/marketplace?q=used%20phone" },
  { label: "Birthday cakes", to: "/services?q=birthday%20cake" },
  { label: "Laptop deals", to: "/marketplace?q=laptop" },
  { label: "Video editing", to: "/services?q=video%20editing" },
];

const fallbackBudgetProducts = [
  { id: "budget-1", name: "Reusable Water Bottle", price: 790, location: "Colombo", badge: "Daily value", category: "Home essentials", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80", isFallback: true },
  { id: "budget-2", name: "Handmade Scented Candle", price: 950, location: "Kandy", badge: "Local maker", category: "Gifts", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80", isFallback: true },
  { id: "budget-3", name: "Phone Charging Cable", price: 690, location: "Kalmunai", badge: "Quick buy", category: "Electronics", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80", isFallback: true },
  { id: "budget-4", name: "Printed Coffee Mug", price: 850, location: "Akkaraipattu", badge: "Custom gift", category: "Personalised", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80", isFallback: true },
  { id: "budget-5", name: "Notebook & Pen Set", price: 620, location: "Ampara", badge: "Student pick", category: "Stationery", image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=80", isFallback: true },
  { id: "budget-6", name: "Mini Desk Plant", price: 990, location: "Batticaloa", badge: "Home refresh", category: "Decor", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80", isFallback: true },
];

function safeLink(value, fallback) {
  const link = String(value || "").trim();
  return link.startsWith("/") ? link : fallback;
}

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function listingImage(item, fallback) {
  return item?.image || item?.images?.[0]?.url || fallback;
}

function readable(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mergeMerchandising(value = {}) {
  return {
    ...DEFAULT_MERCHANDISING,
    ...value,
    carousel: { ...DEFAULT_MERCHANDISING.carousel, ...(value.carousel || {}) },
    todayOffers: { ...DEFAULT_MERCHANDISING.todayOffers, ...(value.todayOffers || {}), productIds: Array.isArray(value.todayOffers?.productIds) ? value.todayOffers.productIds : [] },
    flashSale: { ...DEFAULT_MERCHANDISING.flashSale, ...(value.flashSale || {}), productIds: Array.isArray(value.flashSale?.productIds) ? value.flashSale.productIds : [] },
    budgetCollection: { ...DEFAULT_MERCHANDISING.budgetCollection, ...(value.budgetCollection || {}), productIds: Array.isArray(value.budgetCollection?.productIds) ? value.budgetCollection.productIds : [] },
    marketplaceHighlights: { ...DEFAULT_MERCHANDISING.marketplaceHighlights, ...(value.marketplaceHighlights || {}), slides: Array.isArray(value.marketplaceHighlights?.slides) ? value.marketplaceHighlights.slides : [] },
  };
}

function selectedQuery(ids, fallback = {}) {
  return ids?.length ? { ids: ids.join(","), limit: Math.min(60, Math.max(ids.length, 10)) } : fallback;
}

function preserveOrder(items, ids) {
  if (!ids?.length) return items;
  const position = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort((a, b) => (position.get(a.id) ?? 999) - (position.get(b.id) ?? 999));
}

function flashIsActive(flash) {
  if (!flash?.enabled) return false;
  const now = Date.now();
  const start = flash.startAt ? new Date(flash.startAt).getTime() : null;
  const end = flash.endAt ? new Date(flash.endAt).getTime() : null;
  return (!start || Number.isNaN(start) || now >= start) && (!end || Number.isNaN(end) || now <= end);
}

function LineIcon({ type }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (type === "market") return <svg {...common}><path d="M4 10h16l-1.2 10H5.2L4 10Z"/><path d="M7 10V8a5 5 0 0 1 10 0v2"/><path d="M8 14h8"/></svg>;
  if (type === "store") return <svg {...common}><path d="M4 10h16l-1.4-5H5.4L4 10Z"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/></svg>;
  if (type === "refresh") return <svg {...common}><path d="M4 8V4l3 3a8 8 0 1 1-1.6 9"/><path d="M4 4h4"/></svg>;
  if (type === "service") return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0 5 5L12 19l-4-4 7.7-7.7Z"/><path d="M7.5 14.5 5 17l2 2 2.5-2.5"/></svg>;
  if (type === "spark") return <svg {...common}><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"/></svg>;
  if (type === "search") return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
  if (type === "arrow") return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
  if (type === "check") return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
  if (type === "pin") return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  if (type === "star") return <svg {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>;
  if (type === "shield") return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>;
  if (type === "message") return <svg {...common}><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/></svg>;
  if (type === "chevron-left") return <svg {...common}><path d="m15 18-6-6 6-6"/></svg>;
  if (type === "chevron-right") return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
  return <svg {...common}><path d="M12 3v18M3 12h18"/></svg>;
}

function OfferCard({ item, badge, duplicate = false }) {
  const image = listingImage(item, fallbackBudgetProducts[0].image);
  const link = item?.isFallback ? "/marketplace" : `/products/${item.id}`;
  return (
    <Link className="home-offer-card" to={link} tabIndex={duplicate ? -1 : 0} aria-hidden={duplicate ? "true" : undefined}>
      <span className="home-offer-card-media"><img src={image} alt={duplicate ? "" : item.name} /><mark>{badge}</mark></span>
      <span className="home-offer-card-body"><small>{item.category?.name || item.category || item.badge || "Marketplace"}</small><strong>{item.name}</strong><span><LineIcon type="pin" />{item.location || "Sri Lanka"}</span><b>Rs. {money(item.price)}</b></span>
    </Link>
  );
}

function InfiniteProductCarousel({ items, badge, settings, ariaLabel }) {
  const safeItems = items?.length ? items : fallbackBudgetProducts;
  const direction = settings.direction === "rtl" ? "rtl" : "ltr";
  const style = { "--home-carousel-duration": `${Math.min(90, Math.max(18, Number(settings.speedSeconds || 34)))}s` };
  const classes = ["home-offer-carousel", `direction-${direction}`, settings.enabled ? "is-moving" : "is-static", settings.pauseOnHover ? "pause-on-interaction" : ""].filter(Boolean).join(" ");
  return (
    <div className={classes} style={style} aria-label={ariaLabel}>
      <div className="home-offer-mask">
        <div className="home-offer-marquee-track">
          <div className="home-offer-marquee-group">{safeItems.map((item) => <OfferCard key={`primary-${item.id}`} item={item} badge={badge} />)}</div>
          <div className="home-offer-marquee-group" aria-hidden="true">{safeItems.map((item) => <OfferCard key={`duplicate-${item.id}`} item={item} badge={badge} duplicate />)}</div>
        </div>
      </div>
    </div>
  );
}

function MarketplaceHighlightCarousel({ slides, autoplay, intervalSeconds }) {
  const [active, setActive] = useState(0);
  useEffect(() => { setActive(0); }, [slides]);
  useEffect(() => {
    if (!autoplay || slides.length < 2) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), Math.max(3000, Number(intervalSeconds || 5) * 1000));
    return () => window.clearInterval(timer);
  }, [autoplay, intervalSeconds, slides.length]);
  if (!slides.length) return null;
  const go = (next) => setActive((next + slides.length) % slides.length);
  return (
    <div className="home-highlight-carousel" aria-roledescription="carousel" aria-label="Marketplace highlights">
      <div className="home-highlight-slides" aria-live="polite">
        {slides.map((slide, index) => <Link key={`${slide.title}-${index}`} className={`home-highlight-slide ${index === active ? "is-active" : ""}`} to={safeLink(slide.link, "/marketplace")} aria-hidden={index !== active} tabIndex={index === active ? 0 : -1}>
          <img src={slide.imageUrl} alt={slide.title} />
          <span className="home-highlight-shade" />
          <div className="home-highlight-slide-top"><span>{slide.label || "Marketplace highlight"}</span><small>{index + 1} / {slides.length}</small></div>
          <div className="home-highlight-slide-copy"><small><LineIcon type="pin" />{slide.location || "Sri Lanka"}</small><h2>{slide.title}</h2>{slide.subtitle && <p>{slide.subtitle}</p>}<div><strong>{slide.priceText || "Explore on SmartSell"}</strong><span>Open highlight <LineIcon type="arrow" /></span></div></div>
        </Link>)}
      </div>
      {slides.length > 1 && <><button className="home-highlight-nav previous" type="button" onClick={() => go(active - 1)} aria-label="Previous marketplace highlight"><LineIcon type="chevron-left" /></button><button className="home-highlight-nav next" type="button" onClick={() => go(active + 1)} aria-label="Next marketplace highlight"><LineIcon type="chevron-right" /></button><div className="home-highlight-dots">{slides.map((slide, index) => <button key={`${slide.title}-dot-${index}`} type="button" className={index === active ? "active" : ""} onClick={() => setActive(index)} aria-label={`Show highlight ${index + 1}`} />)}</div></>}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [publicSettings, setPublicSettings] = useState({});
  const [merchandising, setMerchandising] = useState(DEFAULT_MERCHANDISING);
  const [homeProducts, setHomeProducts] = useState(featuredProducts);
  const [homeServices, setHomeServices] = useState(demoServices);
  const [todayDeals, setTodayDeals] = useState(featuredProducts);
  const [flashDeals, setFlashDeals] = useState(featuredProducts.slice().reverse());
  const [budgetProducts, setBudgetProducts] = useState(fallbackBudgetProducts);
  const [searchMode, setSearchMode] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadHomeData() {
      try {
        const settingsResponse = await api.get("/settings/public");
        if (!mounted) return;
        const settings = settingsResponse.data?.data || {};
        const merch = mergeMerchandising(settings.homeMerchandising?.config || {});
        setPublicSettings(settings);
        setMerchandising(merch);

        const requests = await Promise.allSettled([
          api.get("/products", { params: { featured: "true", limit: 4 } }),
          api.get("/services", { params: { featured: "true", limit: 3 } }),
          api.get("/products", { params: selectedQuery(merch.todayOffers.productIds, { featured: "true", sort: "featured", limit: 14 }) }),
          api.get("/products", { params: selectedQuery(merch.flashSale.productIds, { sort: "newest", limit: 14 }) }),
          api.get("/products", { params: selectedQuery(merch.budgetCollection.productIds, { maxPrice: merch.budgetCollection.maxPrice || 1000, sort: "price_asc", limit: 16 }) }),
        ]);
        if (!mounted) return;
        const [productResponse, serviceResponse, todayResponse, flashResponse, budgetResponse] = requests;
        if (productResponse.status === "fulfilled") { const products = productResponse.value.data?.data || []; if (products.length) setHomeProducts(products.slice(0, 4)); }
        if (serviceResponse.status === "fulfilled") { const services = serviceResponse.value.data?.data || []; if (services.length) setHomeServices(services.slice(0, 3)); }
        if (todayResponse.status === "fulfilled") { const products = todayResponse.value.data?.data || []; if (products.length) setTodayDeals(preserveOrder(products, merch.todayOffers.productIds).slice(0, 18)); }
        if (flashResponse.status === "fulfilled") { const products = flashResponse.value.data?.data || []; if (products.length) setFlashDeals(preserveOrder(products, merch.flashSale.productIds).slice(0, 18)); }
        if (budgetResponse.status === "fulfilled") { const products = budgetResponse.value.data?.data || []; if (products.length) setBudgetProducts(preserveOrder(products, merch.budgetCollection.productIds).slice(0, 18)); }
      } catch {
        // The Home page retains curated fallback data when the API is unavailable.
      }
    }
    loadHomeData();
    return () => { mounted = false; };
  }, []);

  const content = { ...fallbackContent, ...(publicSettings.content || {}) };
  const examples = useMemo(() => {
    const configured = String(content.requestExamples || "").split(/\n|\||;/).map((item) => item.trim()).filter(Boolean);
    return configured.length > 1 ? configured.slice(0, 4) : demoRequestExamples;
  }, [content.requestExamples]);

  const heroProduct = homeProducts[0] || featuredProducts[0];
  const sideProduct = homeProducts[1] || featuredProducts[1];
  const heroService = homeServices[0] || demoServices[0];
  const fallbackHighlights = useMemo(() => [
    { label: heroProduct.badge || readable(heroProduct.type || "Featured product"), title: heroProduct.name, subtitle: "A current approved product from the SmartSell marketplace.", imageUrl: listingImage(heroProduct, featuredProducts[0].image), link: `/products/${heroProduct.id}`, priceText: `Rs. ${money(heroProduct.price)}`, location: heroProduct.location || "Sri Lanka" },
    { label: sideProduct.badge || readable(sideProduct.type || "Marketplace deal"), title: sideProduct.name, subtitle: "Compare seller, condition, price, and location before ordering.", imageUrl: listingImage(sideProduct, featuredProducts[1].image), link: `/products/${sideProduct.id}`, priceText: `Rs. ${money(sideProduct.price)}`, location: sideProduct.location || "Sri Lanka" },
    { label: "Service quotation", title: heroService.title, subtitle: "Send your requirement and connect with a SmartSell service provider.", imageUrl: listingImage(heroService, demoServices[0].image), link: `/services/${heroService.id}`, priceText: heroService.priceFrom ? `From Rs. ${money(heroService.priceFrom)}` : "Request a quotation", location: heroService.serviceArea || "Sri Lanka" },
  ], [heroProduct, sideProduct, heroService]);
  const highlightSlides = merchandising.marketplaceHighlights.slides.length ? merchandising.marketplaceHighlights.slides : fallbackHighlights;
  const flashActive = flashIsActive(merchandising.flashSale);

  function handleSearch(event) {
    event.preventDefault();
    const destination = searchMode === "services" ? "/services" : "/marketplace";
    const query = searchTerm.trim();
    navigate(query ? `${destination}?q=${encodeURIComponent(query)}` : destination);
  }

  return (
    <main className="customer-home-page customer-home-final home-marketplace-page">
      <SEOHead title={publicSettings.seo?.defaultTitle || content.heroTitle} description={publicSettings.seo?.defaultDescription || content.heroSubtitle} canonicalPath="/" keywords={publicSettings.seo?.defaultKeywords} />

      {content.publicAnnouncement && <section className="customer-announcement customer-announcement-final"><span>SmartSell update</span><p>{content.publicAnnouncement}</p><Link to="/support">Learn more</Link></section>}

      <section className="home-market-hero">
        <div className="home-market-copy">
          <span className="home-market-eyebrow"><i />{content.heroBadge}</span>
          <h1>{content.heroTitle}</h1>
          <p>{content.heroSubtitle}</p>
          <form className="home-market-search" onSubmit={handleSearch}>
            <div className="home-market-search-mode" role="tablist" aria-label="Search type"><button type="button" className={searchMode === "products" ? "active" : ""} onClick={() => setSearchMode("products")}>Products</button><button type="button" className={searchMode === "services" ? "active" : ""} onClick={() => setSearchMode("services")}>Services</button></div>
            <label><LineIcon type="search" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={searchMode === "services" ? "Search cake makers, editors, delivery..." : "Search phones, gifts, shop products..."} /></label>
            <button type="submit">Search <LineIcon type="arrow" /></button>
          </form>
          <div className="home-popular-searches" aria-label="Popular searches"><span>Popular:</span>{popularSearches.map((item) => <Link key={item.label} to={item.to}>{item.label}</Link>)}</div>
          <div className="home-market-actions"><Link className="home-market-primary" to={safeLink(content.heroPrimaryButtonLink, "/marketplace")}>{content.heroPrimaryButtonText}<LineIcon type="arrow" /></Link><Link className="home-market-secondary" to={safeLink(content.heroSecondaryButtonLink, "/request-anything")}>{content.heroSecondaryButtonText}</Link></div>
          <div className="home-market-trust"><span><LineIcon type="shield" /><b>Approval workflow</b><small>Listings are reviewed before marketplace visibility.</small></span><span><LineIcon type="message" /><b>Connected support</b><small>Orders, requests, messages, and help stay together.</small></span></div>
        </div>

        <div className="home-live-market">
          <div className="home-live-market-head"><div><span className="home-live-dot" /><strong>Marketplace highlights</strong></div><Link to="/marketplace">Browse all <LineIcon type="arrow" /></Link></div>
          {merchandising.marketplaceHighlights.enabled !== false && <MarketplaceHighlightCarousel slides={highlightSlides} autoplay={merchandising.marketplaceHighlights.autoplay} intervalSeconds={merchandising.marketplaceHighlights.intervalSeconds} />}
          <div className="home-live-proof"><span><LineIcon type="check" />Admin-curated highlights</span><span><LineIcon type="check" />Clear pricing and destinations</span><span><LineIcon type="check" />Products, services, shops, or campaigns</span></div>
        </div>
      </section>

      <section className="home-confidence-strip" aria-label="SmartSell customer capabilities"><article><LineIcon type="market" /><div><strong>Products and used deals</strong><span>Compare price, condition, seller, and location.</span></div></article><article><LineIcon type="service" /><div><strong>Professional quotations</strong><span>Send requirements and compare service responses.</span></div></article><article><LineIcon type="store" /><div><strong>Local storefronts</strong><span>Browse sellers, shops, and service providers.</span></div></article><article><LineIcon type="spark" /><div><strong>Custom requests</strong><span>Ask for something unavailable in the normal feed.</span></div></article></section>

      {merchandising.todayOffers.enabled && <section className="customer-section-block home-merch-section home-today-offers-section">
        <div className="home-offer-heading"><div><span className="customer-eyebrow">{merchandising.todayOffers.eyebrow}</span><h2>{merchandising.todayOffers.title}</h2><p>{merchandising.todayOffers.description}</p></div><Link to={safeLink(merchandising.todayOffers.link, "/marketplace?sort=featured")}>View all offers <LineIcon type="arrow" /></Link></div>
        <InfiniteProductCarousel items={todayDeals} badge="Today’s offer" settings={merchandising.carousel} ariaLabel="Today’s marketplace offers" />
      </section>}

      {flashActive && <section className="customer-section-block home-merch-section home-flash-sale-section">
        <div className="home-flash-sale-banner"><div><span><i />{merchandising.flashSale.badge}</span><h2>{merchandising.flashSale.title}</h2><p>{merchandising.flashSale.description}</p></div><Link to={safeLink(merchandising.flashSale.link, "/marketplace?sort=featured")}>Shop flash sale <LineIcon type="arrow" /></Link></div>
        <InfiniteProductCarousel items={flashDeals} badge={merchandising.flashSale.title} settings={merchandising.carousel} ariaLabel={merchandising.flashSale.title} />
      </section>}

      {merchandising.budgetCollection.enabled && <section className="customer-section-block home-merch-section home-budget-section">
        <div className="home-offer-heading"><div><span className="customer-eyebrow">{merchandising.budgetCollection.eyebrow}</span><h2>{merchandising.budgetCollection.title}</h2><p>{merchandising.budgetCollection.description}</p></div><Link to={safeLink(merchandising.budgetCollection.link, "/marketplace")}>Shop the collection <LineIcon type="arrow" /></Link></div>
        <InfiniteProductCarousel items={budgetProducts} badge={`Under Rs. ${money(merchandising.budgetCollection.maxPrice)}`} settings={merchandising.carousel} ariaLabel={merchandising.budgetCollection.title} />
      </section>}

      <section className="customer-section-block home-channel-section"><div className="customer-section-heading split home-section-heading"><div><span className="customer-eyebrow">Explore SmartSell</span><h2>Start with the buying path that fits your need</h2><p>Shop directly, compare a used item, request a quotation, or describe a completely custom requirement.</p></div><Link className="customer-section-link" to="/storefronts">Browse storefronts <LineIcon type="arrow" /></Link></div><div className="home-channel-grid">{channelCards.map((item, index) => <Link key={item.title} to={item.to} className={`home-channel-card ${item.tone}`}><div className="home-channel-card-top"><span className="home-channel-number">0{index + 1}</span><span className="home-channel-label">{item.label}</span></div><span className="home-channel-icon"><LineIcon type={item.icon} /></span><h3>{item.title}</h3><p>{item.description}</p><span className="home-channel-link">Explore <LineIcon type="arrow" /></span></Link>)}</div></section>

      <section className="customer-section-block"><div className="customer-section-heading split home-section-heading"><div><span className="customer-eyebrow">{content.productsEyebrow}</span><h2>{content.productsTitle}</h2><p>{content.productsDescription}</p></div><Link className="customer-section-link" to="/marketplace">View all products <LineIcon type="arrow" /></Link></div><div className="customer-product-grid">{homeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>

      <section className="customer-section-block home-services-section"><div className="customer-section-heading split home-section-heading"><div><span className="customer-eyebrow">{content.servicesEyebrow}</span><h2>{content.servicesTitle}</h2><p>{content.servicesDescription}</p></div><Link className="customer-section-link" to="/services">Explore services <LineIcon type="arrow" /></Link></div><div className="customer-service-grid">{homeServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div></section>

      <section className="home-how-it-works"><div className="home-how-copy"><span className="customer-eyebrow">A clearer customer journey</span><h2>From discovery to delivery, everything stays connected</h2><p>SmartSell is designed around real marketplace decisions—not just browsing cards.</p><Link to="/register">Create your customer account <LineIcon type="arrow" /></Link></div><div className="home-how-steps"><article><span>01</span><div><strong>Discover and compare</strong><p>Search products, services, locations, conditions, and budgets.</p></div></article><article><span>02</span><div><strong>Order, negotiate, or request</strong><p>Choose the workflow that matches the listing and your requirement.</p></div></article><article><span>03</span><div><strong>Track every update</strong><p>Review progress, messages, notifications, delivery, and support.</p></div></article></div></section>

      <section className="customer-home-request-panel home-request-panel-modern"><div className="customer-home-request-copy"><span className="customer-home-eyebrow light">{content.requestEyebrow}</span><h2>{content.requestTitle}</h2><p>{content.requestDescription}</p><Link className="customer-home-request-button" to="/request-anything">{content.requestButtonText}<LineIcon type="arrow" /></Link></div><div className="customer-home-request-list"><span>Examples customers can request</span>{(examples.length ? examples : demoRequestExamples).slice(0, 4).map((request, index) => <article key={request}><b>{String(index + 1).padStart(2, "0")}</b><p>{request}</p></article>)}</div></section>
    </main>
  );
}
