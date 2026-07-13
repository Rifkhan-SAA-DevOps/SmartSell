import { prisma } from "../config/prisma.js";

function toNumber(value) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function ratingStats(reviews = []) {
  const approved = reviews.filter((review) => review.status === "approved");
  const reviewCount = approved.length;
  const ratingAverage = reviewCount
    ? approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
    : 0;

  return {
    reviewCount,
    ratingAverage: Number(ratingAverage.toFixed(1)),
  };
}

function displayNameFromSeller(profile) {
  return (
    profile.shopName ||
    profile.businessName ||
    profile.user?.businessName ||
    profile.user?.name ||
    "SmartSell Seller"
  );
}

function displayNameFromProvider(profile) {
  return (
    profile.businessName ||
    profile.user?.businessName ||
    profile.user?.name ||
    "SmartSell Service Provider"
  );
}

function primaryProductImage(product) {
  return product.images?.[0]?.url || null;
}

function primaryServiceImage(service) {
  return service.images?.[0]?.url || null;
}

function serializeProduct(product) {
  const stats = ratingStats(product.reviews || []);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category?.name || null,
    categorySlug: product.category?.slug || null,
    type: product.type,
    price: toNumber(product.price),
    condition: product.condition,
    stock: product.stock,
    location: product.location,
    status: product.status,
    isFeatured: Boolean(product.isFeatured),
    sellerId: product.sellerId,
    sellerName: product.seller?.businessName || product.seller?.shopName || product.createdBy?.businessName || product.createdBy?.name || null,
    image: primaryProductImage(product),
    badge: product.type === "used_product" ? "Used" : product.type === "shop_product" ? "Shop" : product.type === "own_product" ? "SmartSell" : "Seller",
    images: product.images || [],
    reviewCount: stats.reviewCount,
    ratingAverage: stats.ratingAverage,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function serializeService(service) {
  const stats = ratingStats(service.reviews || []);
  return {
    id: service.id,
    title: service.title,
    slug: service.slug,
    description: service.description,
    category: service.category?.name || null,
    categorySlug: service.category?.slug || null,
    priceFrom: toNumber(service.priceFrom),
    status: service.status,
    isFeatured: Boolean(service.isFeatured),
    providerId: service.providerId,
    providerType: service.providerType || service.provider?.businessName || null,
    providerName: service.provider?.businessName || service.createdBy?.businessName || service.createdBy?.name || service.providerType || null,
    image: primaryServiceImage(service),
    time: "Quote based",
    images: service.images || [],
    reviewCount: stats.reviewCount,
    ratingAverage: stats.ratingAverage,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

function profileStatsFromProducts(products = []) {
  const approvedProducts = products.filter((item) => item.status === "approved");
  const reviews = approvedProducts.flatMap((item) => item.reviews || []);
  return {
    listingCount: approvedProducts.length,
    ...ratingStats(reviews),
  };
}

function profileStatsFromServices(services = []) {
  const approvedServices = services.filter((item) => item.status === "approved");
  const reviews = approvedServices.flatMap((item) => item.reviews || []);
  return {
    listingCount: approvedServices.length,
    ...ratingStats(reviews),
  };
}

function serializeSellerStorefront(profile, includeProducts = false) {
  const stats = profileStatsFromProducts(profile.products || []);
  const name = displayNameFromSeller(profile);
  return {
    kind: "seller",
    id: profile.id,
    userId: profile.userId,
    name,
    ownerName: profile.user?.name || null,
    sellerType: profile.sellerType,
    businessName: profile.businessName || profile.user?.businessName || "",
    shopName: profile.shopName || "",
    description: profile.description || "Trusted SmartSell seller offering verified marketplace products.",
    phone: profile.phone || profile.user?.phone || null,
    email: profile.user?.email || null,
    location: profile.location || "Sri Lanka",
    status: profile.status,
    avatar: name.charAt(0).toUpperCase(),
    badge: profile.sellerType === "shop_seller" ? "Shop Storefront" : "Seller Storefront",
    listingLabel: "Products",
    listingCount: stats.listingCount,
    reviewCount: stats.reviewCount,
    ratingAverage: stats.ratingAverage,
    products: includeProducts ? (profile.products || []).filter((item) => item.status === "approved").map(serializeProduct) : undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function serializeProviderStorefront(profile, includeServices = false) {
  const stats = profileStatsFromServices(profile.services || []);
  const name = displayNameFromProvider(profile);
  return {
    kind: "provider",
    id: profile.id,
    userId: profile.userId,
    name,
    ownerName: profile.user?.name || null,
    businessName: profile.businessName || profile.user?.businessName || "",
    description: profile.description || "Verified SmartSell service provider ready for custom requests and quotations.",
    phone: profile.phone || profile.user?.phone || null,
    email: profile.user?.email || null,
    location: profile.location || "Sri Lanka",
    status: profile.status,
    avatar: name.charAt(0).toUpperCase(),
    badge: "Service Provider",
    listingLabel: "Services",
    listingCount: stats.listingCount,
    reviewCount: stats.reviewCount,
    ratingAverage: stats.ratingAverage,
    services: includeServices ? (profile.services || []).filter((item) => item.status === "approved").map(serializeService) : undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

const productInclude = {
  category: true,
  seller: true,
  images: { orderBy: { sortOrder: "asc" } },
  createdBy: true,
  reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
};

const serviceInclude = {
  category: true,
  provider: true,
  images: { orderBy: { sortOrder: "asc" } },
  createdBy: true,
  reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
};

function sellerSearchWhere(search) {
  if (!search) return undefined;
  return [
    { businessName: { contains: search, mode: "insensitive" } },
    { shopName: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
    { location: { contains: search, mode: "insensitive" } },
    { user: { is: { name: { contains: search, mode: "insensitive" } } } },
    { user: { is: { businessName: { contains: search, mode: "insensitive" } } } },
  ];
}

function providerSearchWhere(search) {
  if (!search) return undefined;
  return [
    { businessName: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
    { location: { contains: search, mode: "insensitive" } },
    { user: { is: { name: { contains: search, mode: "insensitive" } } } },
    { user: { is: { businessName: { contains: search, mode: "insensitive" } } } },
  ];
}

export async function listStorefronts(filters = {}) {
  const search = String(filters.q || filters.search || "").trim();
  const type = String(filters.type || "all");
  const location = String(filters.location || "").trim();

  const sellerWhere = {
    status: "approved",
    sellerType: { in: ["individual_seller", "shop_seller"] },
    ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    ...(sellerSearchWhere(search) ? { OR: sellerSearchWhere(search) } : {}),
  };

  const providerWhere = {
    status: "approved",
    ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
    ...(providerSearchWhere(search) ? { OR: providerSearchWhere(search) } : {}),
  };

  const [sellers, providers] = await Promise.all([
    type === "provider"
      ? []
      : prisma.sellerProfile.findMany({
          where: sellerWhere,
          include: {
            user: true,
            products: {
              where: { status: "approved" },
              include: { reviews: { where: { status: "approved" }, select: { rating: true, status: true } } },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 60,
        }),
    type === "seller" || type === "shop"
      ? []
      : prisma.serviceProviderProfile.findMany({
          where: providerWhere,
          include: {
            user: true,
            services: {
              where: { status: "approved" },
              include: { reviews: { where: { status: "approved" }, select: { rating: true, status: true } } },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 60,
        }),
  ]);

  const sellerCards = sellers
    .filter((item) => type !== "shop" || item.sellerType === "shop_seller")
    .filter((item) => type !== "seller" || item.sellerType === "individual_seller")
    .map((item) => serializeSellerStorefront(item));

  const providerCards = providers.map((item) => serializeProviderStorefront(item));

  return [...sellerCards, ...providerCards]
    .filter((item) => item.listingCount > 0 || filters.showEmpty === "true")
    .sort((a, b) => Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0) || Number(b.listingCount || 0) - Number(a.listingCount || 0));
}

export async function getSellerStorefront(id) {
  const profile = await prisma.sellerProfile.findFirst({
    where: { id, status: "approved" },
    include: {
      user: true,
      products: {
        where: { status: "approved" },
        include: productInclude,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  return profile ? serializeSellerStorefront(profile, true) : null;
}

export async function getProviderStorefront(id) {
  const profile = await prisma.serviceProviderProfile.findFirst({
    where: { id, status: "approved" },
    include: {
      user: true,
      services: {
        where: { status: "approved" },
        include: serviceInclude,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  return profile ? serializeProviderStorefront(profile, true) : null;
}
