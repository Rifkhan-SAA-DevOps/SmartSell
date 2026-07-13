import { useEffect, useMemo, useRef, useState } from "react";
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

const dailyCampaigns = {
  0: { eyebrow: "Sunday special", title: "Super Sunday", description: "Easy weekend picks for home, gifts, and everyday shopping.", accent: "sun", tag: "Sunday pick" },
  1: { eyebrow: "Fresh week offers", title: "Monday Market Drop", description: "Start the week with useful products from local SmartSell sellers.", accent: "blue", tag: "Monday pick" },
  2: { eyebrow: "Today on SmartSell", title: "Tuesday Value Picks", description: "A practical collection selected for price, availability, and local delivery.", accent: "cyan", tag: "Today’s pick" },
  3: { eyebrow: "Midweek offers", title: "Wednesday Finds", description: "Fresh marketplace discoveries for work, home, gifts, and personal needs.", accent: "violet", tag: "Midweek pick" },
  4: { eyebrow: "Almost weekend", title: "Thursday Deal Preview", description: "Discover popular listings before the weekend shopping rush begins.", accent: "emerald", tag: "Deal preview" },
  5: { eyebrow: "Limited Friday collection", title: "Flash Friday", description: "Fast-moving products and marketplace favourites collected for Friday shoppers.", accent: "rose", tag: "Flash pick" },
  6: { eyebrow: "Weekend marketplace", title: "Saturday Smart Picks", description: "Browse useful local products, gifts, and used deals for the weekend.", accent: "amber", tag: "Weekend pick" },
};

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
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
  return <svg {...common}><path d="M12 3v18M3 12h18"/></svg>;
}

function ListingRating({ value = 4.8, count = 12 }) {
  return <span className="home-live-rating"><LineIcon type="star" />{Number(value || 4.8).toFixed(1)} <small>({count || 12})</small></span>;
}

function campaignForToday() {
  const now = new Date();
  return { ...dailyCampaigns[now.getDay()], weekday: new Intl.DateTimeFormat("en-LK", { weekday: "long" }).format(now) };
}

function offerLink(item, budget = false) {
  if (item?.isFallback) return budget ? "/marketplace?maxPrice=1000&sort=price_asc" : "/marketplace?sort=featured";
  return `/products/${item.id}`;
}

function HomeProductCarousel({ items, campaign, budget = false, ariaLabel }) {
  const trackRef = useRef(null);
  const scroll = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * Math.max(280, track.clientWidth * 0.78), behavior: "smooth" });
  };

  return (
    <div className="home-offer-carousel">
      <div className="home-offer-carousel-controls">
        <button type="button" onClick={() => scroll(-1)} aria-label={`Previous ${ariaLabel || "products"}`}><span aria-hidden="true">‹</span></button>
        <button type="button" onClick={() => scroll(1)} aria-label={`Next ${ariaLabel || "products"}`}><span aria-hidden="true">›</span></button>
      </div>
      <div className="home-offer-track" ref={trackRef}>
        {items.map((item) => {
          const image = listingImage(item, fallbackBudgetProducts[0].image);
          return (
            <Link className="home-offer-card" key={`${budget ? "budget" : "deal"}-${item.id}`} to={offerLink(item, budget)}>
              <span className="home-offer-card-media">
                <img src={image} alt={item.name} />
                <mark>{budget ? "Under Rs. 1,000" : campaign?.tag || "Today’s pick"}</mark>
              </span>
              <span className="home-offer-card-body">
                <small>{item.category?.name || item.category || item.badge || "Marketplace"}</small>
                <strong>{item.name}</strong>
                <span><LineIcon type="pin" />{item.location || "Sri Lanka"}</span>
                <b>Rs. {money(item.price)}</b>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [publicSettings, setPublicSettings] = useState({});
  const [homeProducts, setHomeProducts] = useState(featuredProducts);
  const [homeServices, setHomeServices] = useState(demoServices);
  const [todayDeals, setTodayDeals] = useState(featuredProducts);
  const [budgetProducts, setBudgetProducts] = useState(fallbackBudgetProducts);
  const [searchMode, setSearchMode] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadHomeData() {
      const [settingsResponse, productResponse, serviceResponse, dealResponse, budgetResponse] = await Promise.allSettled([
        api.get("/settings/public"),
        api.get("/products", { params: { featured: "true", limit: 4 } }),
        api.get("/services", { params: { featured: "true", limit: 3 } }),
        api.get("/products", { params: { featured: "true", sort: "featured", limit: 10 } }),
        api.get("/products", { params: { maxPrice: 1000, sort: "price_asc", limit: 14 } }),
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
      if (dealResponse.status === "fulfilled") {
        const deals = dealResponse.value.data?.data || [];
        if (deals.length) setTodayDeals(deals.slice(0, 10));
      }
      if (budgetResponse.status === "fulfilled") {
        const products = budgetResponse.value.data?.data || [];
        if (products.length) setBudgetProducts(products.slice(0, 14));
      }
    }
    loadHomeData();
    return () => { mounted = false; };
  }, []);

  const content = { ...fallbackContent, ...(publicSettings.content || {}) };
  const dailyCampaign = useMemo(() => campaignForToday(), []);
  const examples = useMemo(() => {
    const configured = String(content.requestExamples || "")
      .split(/\n|\||;/)
      .map((item) => item.trim())
      .filter(Boolean);
    return configured.length > 1 ? configured.slice(0, 4) : demoRequestExamples;
  }, [content.requestExamples]);

  const heroProduct = homeProducts[0] || featuredProducts[0];
  const sideProduct = homeProducts[1] || featuredProducts[1];
  const heroService = homeServices[0] || demoServices[0];
  const heroProductImage = listingImage(heroProduct, featuredProducts[0].image);
  const sideProductImage = listingImage(sideProduct, featuredProducts[1].image);
  const heroServiceImage = listingImage(heroService, demoServices[0].image);

  function handleSearch(event) {
    event.preventDefault();
    const destination = searchMode === "services" ? "/services" : "/marketplace";
    const query = searchTerm.trim();
    navigate(query ? `${destination}?q=${encodeURIComponent(query)}` : destination);
  }

  return (
    <main className="customer-home-page customer-home-final home-marketplace-page">
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

      <section className="home-market-hero">
        <div className="home-market-copy">
          <span className="home-market-eyebrow"><i />{content.heroBadge}</span>
          <h1>{content.heroTitle}</h1>
          <p>{content.heroSubtitle}</p>

          <form className="home-market-search" onSubmit={handleSearch}>
            <div className="home-market-search-mode" role="tablist" aria-label="Search type">
              <button type="button" className={searchMode === "products" ? "active" : ""} onClick={() => setSearchMode("products")}>Products</button>
              <button type="button" className={searchMode === "services" ? "active" : ""} onClick={() => setSearchMode("services")}>Services</button>
            </div>
            <label>
              <LineIcon type="search" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={searchMode === "services" ? "Search cake makers, editors, delivery..." : "Search phones, gifts, shop products..."} />
            </label>
            <button type="submit">Search <LineIcon type="arrow" /></button>
          </form>

          <div className="home-popular-searches" aria-label="Popular searches">
            <span>Popular:</span>
            {popularSearches.map((item) => <Link key={item.label} to={item.to}>{item.label}</Link>)}
          </div>

          <div className="home-market-actions">
            <Link className="home-market-primary" to={safeLink(content.heroPrimaryButtonLink, "/marketplace")}>{content.heroPrimaryButtonText}<LineIcon type="arrow" /></Link>
            <Link className="home-market-secondary" to={safeLink(content.heroSecondaryButtonLink, "/request-anything")}>{content.heroSecondaryButtonText}</Link>
          </div>

          <div className="home-market-trust">
            <span><LineIcon type="shield" /><b>Approval workflow</b><small>Listings are reviewed before marketplace visibility.</small></span>
            <span><LineIcon type="message" /><b>Connected support</b><small>Orders, requests, messages, and help stay together.</small></span>
          </div>
        </div>

        <div className="home-live-market" aria-label="Live SmartSell marketplace preview">
          <div className="home-live-market-head">
            <div><span className="home-live-dot" /><strong>Marketplace highlights</strong></div>
            <Link to="/marketplace">Browse all <LineIcon type="arrow" /></Link>
          </div>

          <Link className="home-live-feature" to={`/products/${heroProduct.id}`}>
            <img src={heroProductImage} alt={heroProduct.name} />
            <span className="home-live-image-shade" />
            <div className="home-live-feature-top">
              <span>{heroProduct.badge || readable(heroProduct.type || "Featured product")}</span>
              <ListingRating value={heroProduct.ratingAverage} count={heroProduct.reviewCount} />
            </div>
            <div className="home-live-feature-copy">
              <small><LineIcon type="pin" />{heroProduct.location || "Sri Lanka"}</small>
              <h2>{heroProduct.name}</h2>
              <div><strong>Rs. {money(heroProduct.price)}</strong><span>View listing <LineIcon type="arrow" /></span></div>
            </div>
          </Link>

          <div className="home-live-secondary-grid">
            <Link className="home-live-mini-product" to={`/products/${sideProduct.id}`}>
              <img src={sideProductImage} alt={sideProduct.name} />
              <div><span>{sideProduct.badge || readable(sideProduct.type || "Used deal")}</span><strong>{sideProduct.name}</strong><small>Rs. {money(sideProduct.price)} · {sideProduct.location || "Sri Lanka"}</small></div>
            </Link>

            <Link className="home-live-service" to={`/services/${heroService.id}`}>
              <img src={heroServiceImage} alt={heroService.title} />
              <div><span>Service quotation</span><strong>{heroService.title}</strong><small>{heroService.priceFrom ? `From Rs. ${money(heroService.priceFrom)}` : "Quotation based"}</small></div>
              <LineIcon type="arrow" />
            </Link>
          </div>

          <div className="home-live-proof">
            <span><LineIcon type="check" />Clear pricing</span>
            <span><LineIcon type="check" />Seller and provider profiles</span>
            <span><LineIcon type="check" />Order and request tracking</span>
          </div>
        </div>
      </section>

      <section className="home-confidence-strip" aria-label="SmartSell customer capabilities">
        <article><LineIcon type="market" /><div><strong>Products and used deals</strong><span>Compare price, condition, seller, and location.</span></div></article>
        <article><LineIcon type="service" /><div><strong>Professional quotations</strong><span>Send requirements and compare service responses.</span></div></article>
        <article><LineIcon type="store" /><div><strong>Local storefronts</strong><span>Browse sellers, shops, and service providers.</span></div></article>
        <article><LineIcon type="spark" /><div><strong>Custom requests</strong><span>Ask for something unavailable in the normal feed.</span></div></article>
      </section>

      <section className={`home-daily-offers tone-${dailyCampaign.accent}`}>
        <article className="home-daily-campaign">
          <span className="home-daily-campaign-date">{dailyCampaign.weekday} offers</span>
          <span className="home-daily-campaign-icon"><LineIcon type="spark" /></span>
          <span className="customer-eyebrow">{dailyCampaign.eyebrow}</span>
          <h2>{dailyCampaign.title}</h2>
          <p>{dailyCampaign.description}</p>
          <div className="home-daily-campaign-meta"><span><i />Fresh picks today</span><span>Updates every day</span></div>
          <Link to="/marketplace?sort=featured">Explore today’s offers <LineIcon type="arrow" /></Link>
        </article>
        <div className="home-daily-products">
          <div className="home-offer-heading">
            <div><span className="customer-eyebrow">Today’s marketplace offers</span><h2>Popular products worth checking now</h2><p>Real approved listings selected from SmartSell’s current marketplace.</p></div>
            <Link to="/marketplace?sort=featured">View all offers <LineIcon type="arrow" /></Link>
          </div>
          <HomeProductCarousel items={todayDeals.slice(0, 10)} campaign={dailyCampaign} ariaLabel="today’s offer products" />
        </div>
      </section>

      <section className="customer-section-block home-budget-section">
        <div className="home-offer-heading">
          <div><span className="customer-eyebrow">Small prices, useful finds</span><h2>Products under Rs. 1,000</h2><p>Swipe through affordable everyday products, gifts, accessories, and local-made items.</p></div>
          <Link to="/marketplace?maxPrice=1000&sort=price_asc">Shop under Rs. 1,000 <LineIcon type="arrow" /></Link>
        </div>
        <HomeProductCarousel items={budgetProducts} budget ariaLabel="products under one thousand rupees" />
      </section>

      <section className="customer-section-block home-channel-section">
        <div className="customer-section-heading split home-section-heading">
          <div><span className="customer-eyebrow">Explore SmartSell</span><h2>Start with the buying path that fits your need</h2><p>Shop directly, compare a used item, request a quotation, or describe a completely custom requirement.</p></div>
          <Link className="customer-section-link" to="/storefronts">Browse storefronts <LineIcon type="arrow" /></Link>
        </div>
        <div className="home-channel-grid">
          {channelCards.map((item, index) => (
            <Link key={item.title} to={item.to} className={`home-channel-card ${item.tone}`}>
              <div className="home-channel-card-top"><span className="home-channel-number">0{index + 1}</span><span className="home-channel-label">{item.label}</span></div>
              <span className="home-channel-icon"><LineIcon type={item.icon} /></span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="home-channel-link">Explore <LineIcon type="arrow" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="customer-section-block">
        <div className="customer-section-heading split home-section-heading">
          <div><span className="customer-eyebrow">{content.productsEyebrow}</span><h2>{content.productsTitle}</h2><p>{content.productsDescription}</p></div>
          <Link className="customer-section-link" to="/marketplace">View all products <LineIcon type="arrow" /></Link>
        </div>
        <div className="customer-product-grid">{homeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="customer-section-block home-services-section">
        <div className="customer-section-heading split home-section-heading">
          <div><span className="customer-eyebrow">{content.servicesEyebrow}</span><h2>{content.servicesTitle}</h2><p>{content.servicesDescription}</p></div>
          <Link className="customer-section-link" to="/services">Explore services <LineIcon type="arrow" /></Link>
        </div>
        <div className="customer-service-grid">{homeServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
      </section>

      <section className="home-how-it-works">
        <div className="home-how-copy"><span className="customer-eyebrow">A clearer customer journey</span><h2>From discovery to delivery, everything stays connected</h2><p>SmartSell is designed around real marketplace decisions—not just browsing cards.</p><Link to="/register">Create your customer account <LineIcon type="arrow" /></Link></div>
        <div className="home-how-steps">
          <article><span>01</span><div><strong>Discover and compare</strong><p>Search products, services, locations, conditions, and budgets.</p></div></article>
          <article><span>02</span><div><strong>Order, negotiate, or request</strong><p>Choose the workflow that matches the listing and your requirement.</p></div></article>
          <article><span>03</span><div><strong>Track every update</strong><p>Review progress, messages, notifications, delivery, and support.</p></div></article>
        </div>
      </section>

      <section className="customer-home-request-panel home-request-panel-modern">
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
