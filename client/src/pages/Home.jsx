import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import SEOHead from "../components/SEOHead.jsx";
import { featuredProducts, services as demoServices, requestExamples as demoRequestExamples } from "../data/demoData.js";
import api from "../utils/api.js";
import icon from "../assets/smartsell-icon.png";

const fallbackContent = {
  heroBadge: "Marketplace • Services • Used Products • Requests",
  heroTitle: "Discover what you want. Request what you cannot find.",
  heroSubtitle: "From trusted shop products and used deals to skilled service providers and custom requests, SmartSell brings local commerce into one clear customer journey.",
  heroPrimaryButtonText: "Explore Marketplace",
  heroPrimaryButtonLink: "/marketplace",
  heroSecondaryButtonText: "Request Anything",
  heroSecondaryButtonLink: "/request-anything",
  statOneValue: "4",
  statOneLabel: "Ways to find what you need",
  statTwoValue: "100%",
  statTwoLabel: "Flexible request journey",
  statThreeValue: "24/7",
  statThreeLabel: "Account and support access",
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

const channelCards = [
  { title: "Shop products", description: "Browse products from registered local shops and organised storefronts.", icon: "store", to: "/marketplace?type=shop_product", tone: "blue" },
  { title: "Used deals", description: "Compare second-hand items by price, condition, seller, and location.", icon: "refresh", to: "/marketplace?type=used_product", tone: "emerald" },
  { title: "Local services", description: "Find skilled providers and request quotations that match your budget.", icon: "service", to: "/services", tone: "violet" },
  { title: "Custom requests", description: "Tell SmartSell what you need when a normal listing is not enough.", icon: "spark", to: "/request-anything", tone: "amber" },
];

function safeLink(value, fallback) {
  const link = String(value || "").trim();
  return link.startsWith("/") ? link : fallback;
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
  return <svg {...common}><path d="M12 3v18M3 12h18"/></svg>;
}

export default function Home() {
  const navigate = useNavigate();
  const [publicSettings, setPublicSettings] = useState({});
  const [homeProducts, setHomeProducts] = useState(featuredProducts);
  const [homeServices, setHomeServices] = useState(demoServices);
  const [searchMode, setSearchMode] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadHomeData() {
      const [settingsResponse, productResponse, serviceResponse] = await Promise.allSettled([
        api.get("/settings/public"),
        api.get("/products", { params: { featured: "true", limit: 4 } }),
        api.get("/services", { params: { featured: "true", limit: 3 } }),
      ]);
      if (!mounted) return;
      if (settingsResponse.status === "fulfilled") setPublicSettings(settingsResponse.value.data?.data || {});
      if (productResponse.status === "fulfilled") {
        const products = productResponse.value.data?.data || [];
        if (products.length) setHomeProducts(products.slice(0, 4));
      }
      if (serviceResponse.status === "fulfilled") {
        const services = serviceResponse.value.data?.data || [];
        if (services.length) setHomeServices(services.slice(0, 3));
      }
    }
    loadHomeData();
    return () => { mounted = false; };
  }, []);

  const content = { ...fallbackContent, ...(publicSettings.content || {}) };
  const examples = useMemo(() => {
    const configured = String(content.requestExamples || "")
      .split(/\n|\||;/)
      .map((item) => item.trim())
      .filter(Boolean);
    return configured.length > 1 ? configured.slice(0, 4) : demoRequestExamples;
  }, [content.requestExamples]);

  function handleSearch(event) {
    event.preventDefault();
    const destination = searchMode === "services" ? "/services" : "/marketplace";
    const query = searchTerm.trim();
    navigate(query ? `${destination}?q=${encodeURIComponent(query)}` : destination);
  }

  return (
    <main className="customer-home-page customer-home-final">
      <SEOHead
        title={publicSettings.seo?.defaultTitle || content.heroTitle}
        description={publicSettings.seo?.defaultDescription || content.heroSubtitle}
        canonicalPath="/"
        keywords={publicSettings.seo?.defaultKeywords}
      />

      {content.publicAnnouncement && (
        <section className="customer-announcement customer-announcement-final">
          <span>SmartSell update</span><p>{content.publicAnnouncement}</p><Link to="/support">Learn more</Link>
        </section>
      )}

      <section className="customer-home-hero">
        <div className="customer-home-hero-copy">
          <span className="customer-home-eyebrow">{content.heroBadge}</span>
          <h1>{content.heroTitle}</h1>
          <p>{content.heroSubtitle}</p>

          <form className="customer-home-search" onSubmit={handleSearch}>
            <div className="customer-home-search-tabs" role="tablist" aria-label="Search type">
              <button type="button" className={searchMode === "products" ? "active" : ""} onClick={() => setSearchMode("products")}>Products</button>
              <button type="button" className={searchMode === "services" ? "active" : ""} onClick={() => setSearchMode("services")}>Services</button>
            </div>
            <label>
              <LineIcon type="search" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={searchMode === "services" ? "Search cake makers, editors, delivery..." : "Search phones, gifts, shop products..."} />
            </label>
            <button type="submit">Search <LineIcon type="arrow" /></button>
          </form>

          <div className="customer-home-hero-actions">
            <Link className="customer-primary-cta" to={safeLink(content.heroPrimaryButtonLink, "/marketplace")}>{content.heroPrimaryButtonText}</Link>
            <Link className="customer-secondary-cta" to={safeLink(content.heroSecondaryButtonLink, "/request-anything")}>{content.heroSecondaryButtonText}</Link>
          </div>

          <div className="customer-home-trust-row">
            <span><LineIcon type="check" />Clear product and service details</span>
            <span><LineIcon type="check" />Connected messages and support</span>
            <span><LineIcon type="check" />Responsive customer workspace</span>
          </div>
        </div>

        <div className="customer-home-command-board" aria-label="SmartSell customer journey preview">
          <div className="customer-home-command-head">
            <div className="customer-home-command-brand"><img src={icon} alt="" /><span><small>SmartSell journey</small><strong>Find it or request it</strong></span></div>
            <span className="customer-live-status"><i />Customer ready</span>
          </div>
          <div className="customer-home-command-feature">
            <span>01</span><div><small>Start with one search</small><strong>Products, services, stores, and used deals</strong></div>
          </div>
          <div className="customer-home-command-grid">
            <article className="blue"><LineIcon type="market" /><span><small>Marketplace</small><strong>Compare listings</strong></span></article>
            <article className="violet"><LineIcon type="service" /><span><small>Services</small><strong>Request a quote</strong></span></article>
            <article className="emerald"><LineIcon type="store" /><span><small>Storefronts</small><strong>Browse businesses</strong></span></article>
            <article className="amber"><LineIcon type="spark" /><span><small>Custom need</small><strong>Request anything</strong></span></article>
          </div>
          <div className="customer-home-command-footer"><span>Search</span><b>→</b><span>Compare</span><b>→</b><span>Order or request</span><b>→</b><span>Track</span></div>
        </div>
      </section>

      <section className="customer-home-stats">
        <article><strong>{content.statOneValue}</strong><span>{content.statOneLabel}</span><small>Marketplace, services, stores, and custom requests</small></article>
        <article><strong>{content.statTwoValue}</strong><span>{content.statTwoLabel}</span><small>Buy directly, ask questions, negotiate, or request quotations</small></article>
        <article><strong>{content.statThreeValue}</strong><span>{content.statThreeLabel}</span><small>Review progress, messages, notifications, and support history</small></article>
      </section>

      <section className="customer-section-block customer-home-channels-section">
        <div className="customer-section-heading centered">
          <span className="customer-eyebrow">Choose your path</span>
          <h2>One marketplace, designed for different customer needs</h2>
          <p>Move directly to the experience that matches what you are looking for.</p>
        </div>
        <div className="customer-home-channel-grid">
          {channelCards.map((item) => (
            <Link key={item.title} to={item.to} className={`customer-home-channel-card ${item.tone}`}>
              <span className="customer-home-channel-icon"><LineIcon type={item.icon} /></span>
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
              <span className="customer-home-channel-arrow"><LineIcon type="arrow" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="customer-section-block">
        <div className="customer-section-heading split">
          <div><span className="customer-eyebrow">{content.productsEyebrow}</span><h2>{content.productsTitle}</h2><p>{content.productsDescription}</p></div>
          <Link className="customer-section-link" to="/marketplace">View all products <LineIcon type="arrow" /></Link>
        </div>
        <div className="customer-product-grid">{homeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="customer-section-block customer-home-service-section">
        <div className="customer-section-heading split">
          <div><span className="customer-eyebrow">{content.servicesEyebrow}</span><h2>{content.servicesTitle}</h2><p>{content.servicesDescription}</p></div>
          <Link className="customer-section-link" to="/services">Explore services <LineIcon type="arrow" /></Link>
        </div>
        <div className="customer-service-grid">{homeServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
      </section>

      <section className="customer-home-request-panel">
        <div className="customer-home-request-copy">
          <span className="customer-home-eyebrow light">{content.requestEyebrow}</span>
          <h2>{content.requestTitle}</h2>
          <p>{content.requestDescription}</p>
          <Link className="customer-home-request-button" to="/request-anything">{content.requestButtonText}<LineIcon type="arrow" /></Link>
        </div>
        <div className="customer-home-request-list">
          <span>Examples customers can request</span>
          {(examples.length ? examples : demoRequestExamples).slice(0, 4).map((request, index) => <article key={request}><b>{String(index + 1).padStart(2, "0")}</b><p>{request}</p></article>)}
        </div>
      </section>
    </main>
  );
}
