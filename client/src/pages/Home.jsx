import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import SEOHead from "../components/SEOHead.jsx";
import { categories, featuredProducts, services as demoServices, requestExamples as demoRequestExamples } from "../data/demoData.js";
import api from "../utils/api.js";
import icon from "../assets/smartsell-icon.png";
import "../styles/pages/customer/CustomerShowcase.css";

const fallbackContent = {
  heroBadge: "Marketplace • Services • Used Products • Requests",
  heroTitle: "Discover what you want. Request what you can't find. Let SmartSell make it happen.",
  heroSubtitle: "From trusted shop products and used deals to service providers and custom requests, SmartSell creates one polished customer journey for buying, quoting, and arranging everyday needs.",
  heroPrimaryButtonText: "Explore Marketplace",
  heroPrimaryButtonLink: "/marketplace",
  heroSecondaryButtonText: "Request Anything",
  heroSecondaryButtonLink: "/request-anything",
  statOneValue: "4",
  statOneLabel: "Selling channels",
  statTwoValue: "100%",
  statTwoLabel: "Flexible request flow",
  statThreeValue: "24/7",
  statThreeLabel: "Always-on Smart support",
  productsEyebrow: "Customer Feed",
  productsTitle: "Fresh product picks from SmartSell",
  productsDescription: "Browse approved products from shops, sellers, used-product owners, and SmartSell listings.",
  servicesEyebrow: "Service Feed",
  servicesTitle: "Services you can request by budget",
  servicesDescription: "Cake makers, editors, developers, delivery help, event workers, and more can receive quote requests.",
  requestEyebrow: "Request Anything",
  requestTitle: "Need something custom? Tell SmartSell and we will arrange it.",
  requestDescription: "Share your need, budget, deadline, and location. SmartSell can quote it, assign it, and help you track progress from one place.",
  requestButtonText: "Start a Request",
  requestExamples: demoRequestExamples.join("\n"),
  publicAnnouncement: "",
};

function safeLink(value, fallback) {
  const link = String(value || "").trim();
  return link.startsWith("/") ? link : fallback;
}

function LineIcon({ type }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (type === "market") return <svg {...common}><path d="M4 10h16l-1.2 10H5.2L4 10Z"/><path d="M7 10V8a5 5 0 0 1 10 0v2"/><path d="M8 14h8"/></svg>;
  if (type === "used") return <svg {...common}><path d="M7 7h10v10H7z"/><path d="M4 12H2l3-3 3 3H6a6 6 0 0 0 10 4"/><path d="M20 12h2l-3 3-3-3h2A6 6 0 0 0 8 8"/></svg>;
  if (type === "service") return <svg {...common}><path d="m14.7 6.3 3 3"/><path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="M13 8 16 11"/></svg>;
  return <svg {...common}><path d="M12 3v18"/><path d="M3 12h18"/><path d="m7 7 10 10"/><path d="m17 7-10 10"/></svg>;
}

export default function Home() {
  const [publicSettings, setPublicSettings] = useState({});
  const [homeProducts, setHomeProducts] = useState(featuredProducts);
  const [homeServices, setHomeServices] = useState(demoServices);

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

  return (
    <main className="customer-home-page">
      <SEOHead
        title={publicSettings.seo?.defaultTitle || content.heroTitle}
        description={publicSettings.seo?.defaultDescription || content.heroSubtitle}
        canonicalPath="/"
        keywords={publicSettings.seo?.defaultKeywords}
      />

      {content.publicAnnouncement && (
        <section className="customer-announcement">
          <span>SmartSell Notice</span>
          <p>{content.publicAnnouncement}</p>
        </section>
      )}

      <section className="customer-hero-section">
        <div className="customer-hero-copy">
          <span className="customer-eyebrow">{content.heroBadge}</span>
          <h1>
            Discover what you want.<br />
            <span className="accent">Request what you can't find.</span><br />
            Let SmartSell make it happen.
          </h1>
          <p>{content.heroSubtitle}</p>
          <div className="customer-hero-search-card">
            <div>
              <small>Everything in one guided customer journey</small>
              <strong>Marketplace, services, used deals, and custom requests — all in one place</strong>
            </div>
            <Link to="/marketplace">Browse now</Link>
          </div>
          <div className="customer-hero-actions">
            <Link className="customer-primary-cta" to={safeLink(content.heroPrimaryButtonLink, "/marketplace")}>{content.heroPrimaryButtonText}</Link>
            <Link className="customer-secondary-cta" to={safeLink(content.heroSecondaryButtonLink, "/request-anything")}>{content.heroSecondaryButtonText}</Link>
          </div>
        </div>

        <div className="customer-hero-panel">
          <div className="customer-hero-logo-card"><img src={icon} alt="SmartSell icon" /></div>
          <div className="customer-feed-preview-card main-preview">
            <span>Signature SmartSell flow</span>
            <strong>Search → compare → request → get it done</strong>
            <small>Designed for products, services, shops, used items, and custom needs</small>
          </div>
          <div className="customer-feed-preview-card mini one"><b>Cake + gift + delivery</b><small>Custom request bundle</small></div>
          <div className="customer-feed-preview-card mini two"><b>Used phone under budget</b><small>Negotiation-ready marketplace listing</small></div>
        </div>
      </section>

      <section className="customer-stats-strip">
        <div><strong>{content.statOneValue}</strong><span>{content.statOneLabel}</span><small>Shops, sellers, used items, and SmartSell inventory</small></div>
        <div><strong>{content.statTwoValue}</strong><span>{content.statTwoLabel}</span><small>Customers can ask, buy, quote, or request</small></div>
        <div><strong>{content.statThreeValue}</strong><span>{content.statThreeLabel}</span><small>Customer help, tracking, and follow-up support</small></div>
      </section>

      <section className="customer-section-block">
        <div className="customer-section-heading centered">
          <span className="customer-eyebrow">How SmartSell works</span>
          <h2>One smart customer experience for products, services, and custom needs</h2>
          <p>Customers should feel clear and confident. They can buy directly, request a quote, compare used deals, or ask SmartSell to arrange something special.</p>
        </div>
        <div className="customer-work-grid">
          <article><LineIcon type="market" /><b>Buy products</b><p>Explore products from shops, sellers, and SmartSell itself inside one cleaner product feed.</p></article>
          <article><LineIcon type="used" /><b>Compare used deals</b><p>View used listings with condition, price, and seller information in a professional layout.</p></article>
          <article><LineIcon type="service" /><b>Request services</b><p>Send quote requests for cakes, editing, delivery, web work, and many more provider services.</p></article>
          <article><LineIcon type="request" /><b>Request anything</b><p>Need something custom? SmartSell can collect the details, quote it, assign it, and follow through.</p></article>
        </div>
      </section>

      <section className="customer-section-block">
        <div className="customer-section-heading split">
          <div>
            <span className="customer-eyebrow">{content.productsEyebrow}</span>
            <h2>{content.productsTitle}</h2>
            <p>{content.productsDescription}</p>
          </div>
          <Link className="customer-section-link" to="/marketplace">View all products</Link>
        </div>
        <div className="customer-product-grid">
          {homeProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="customer-section-block customer-category-band">
        {categories.slice(0, 6).map((item) => (
          <Link key={item.title} to={item.title === "Services" ? "/services" : item.title === "Request Anything" ? "/request-anything" : "/marketplace"}>
            <span>{item.icon}</span>
            <b>{item.title}</b>
            <small>{item.description}</small>
          </Link>
        ))}
      </section>

      <section className="customer-section-block">
        <div className="customer-section-heading split">
          <div>
            <span className="customer-eyebrow">{content.servicesEyebrow}</span>
            <h2>{content.servicesTitle}</h2>
            <p>{content.servicesDescription}</p>
          </div>
          <Link className="customer-section-link" to="/services">View services</Link>
        </div>
        <div className="customer-service-grid">
          {homeServices.map((service) => <ServiceCard key={service.id} service={service} />)}
        </div>
      </section>

      <section className="customer-request-banner">
        <div>
          <span className="customer-eyebrow light">{content.requestEyebrow}</span>
          <h2>{content.requestTitle}</h2>
          <p>{content.requestDescription}</p>
          <Link className="customer-light-cta" to="/request-anything">{content.requestButtonText}</Link>
        </div>
        <div className="customer-request-examples">
          {(examples.length ? examples : demoRequestExamples).slice(0, 4).map((request) => <p key={request}>{request}</p>)}
        </div>
      </section>
    </main>
  );
}
