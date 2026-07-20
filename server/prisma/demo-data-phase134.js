import bcrypt from "bcryptjs";

export const PHASE_134_TARGETS = Object.freeze({
  users: 40,
  customers: 20,
  businessUsers: 24,
  categories: 18,
  products: 48,
  approvedProducts: 34,
  budgetProducts: 10,
  services: 30,
  approvedServices: 22,
  requests: 30,
  orders: 36,
  offers: 30,
  reviews: 50,
  wishlistItems: 30,
  notifications: 50,
  messageThreads: 24,
  supportTickets: 24,
  commissions: 24,
  payoutRequests: 18,
  coupons: 16,
  adminActions: 24,
});

const DEMO_PASSWORDS = Object.freeze({
  customer: "Customer@12345",
  seller: "Seller@12345",
  shop: "Shop@12345",
  service_provider: "Provider@12345",
  delivery_partner: "Delivery@12345",
});

const LOCATIONS = [
  "Akkaraipattu",
  "Kalmunai",
  "Addalaichenai",
  "Oluvil",
  "Sammanthurai",
  "Nintavur",
  "Sainthamaruthu",
  "Ampara",
];

const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585386959984-a41552231693?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop",
];

const SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop",
];

const PRODUCT_EXPANSION = [
  ["Type-C Fast Charging Cable", 850, "shop_product", "new", 45, "Electronics", "VoltLine", "TC-60W"],
  ["Tempered Glass Screen Guard", 450, "shop_product", "new", 80, "Electronics", "ClearShield", "9H"],
  ["Wireless Earbuds Mini", 2950, "shop_product", "new", 22, "Electronics", "SoundGo", "Mini Pods"],
  ["Used Redmi Note 12", 46500, "used_product", "good", 2, "Used Products", "Xiaomi", "Redmi Note 12"],
  ["Used Samsung 32 Inch Smart TV", 58500, "used_product", "good", 1, "Used Products", "Samsung", "UA32"],
  ["Laptop Backpack 15.6 Inch", 3900, "shop_product", "new", 18, "Shop Products", "UrbanCarry", "Office Pro"],
  ["USB Rechargeable Table Fan", 2100, "shop_product", "new", 28, "Shop Products", "Breeze", "Mini Fan"],
  ["LED Study Lamp", 1750, "shop_product", "new", 30, "Shop Products", "Luma", "Desk Lite"],
  ["Stainless Steel Water Bottle", 950, "shop_product", "new", 55, "Shop Products", "Hydra", "750ml"],
  ["A5 Premium Notebook", 520, "shop_product", "new", 75, "Shop Products", "WriteWell", "A5"],
  ["Kids Colour Pencil Set", 680, "shop_product", "new", 42, "Shop Products", "ColorJoy", "24 Pack"],
  ["Kitchen Spice Jar Set", 980, "shop_product", "new", 24, "Shop Products", "HomeNest", "6 Piece"],
  ["Mini Sewing Kit", 390, "shop_product", "new", 60, "Shop Products", "FixIt", "Travel Kit"],
  ["Handmade Resin Keychain", 650, "own_product", "new", 35, "Handmade Products", "CraftLanka", "Personalised"],
  ["Crochet Flower Bouquet", 2400, "own_product", "new", 16, "Handmade Products", "Loop & Bloom", "Medium"],
  ["Personalised Name Frame", 3200, "own_product", "new", 12, "Gifts", "FrameStory", "A4"],
  ["Chocolate Surprise Box", 1850, "own_product", "new", 20, "Gifts", "SweetWish", "Classic"],
  ["Islamic Gift Set", 4200, "own_product", "new", 14, "Gifts", "Noor Gifts", "Premium"],
  ["Birthday Balloon Combo", 890, "shop_product", "new", 38, "Gifts", "PartyPop", "Rose Gold"],
  ["Mini Perfume Gift Pack", 990, "shop_product", "new", 32, "Gifts", "Aroma", "4 Piece"],
  ["Used Honda Dio Helmet", 4800, "used_product", "good", 1, "Vehicles", "Studds", "Full Face"],
  ["Motorcycle Phone Holder", 1450, "shop_product", "new", 27, "Vehicles", "RideSafe", "Universal"],
  ["Car Cleaning Microfiber Kit", 780, "shop_product", "new", 40, "Vehicles", "AutoGlow", "5 Piece"],
  ["Bike LED Indicator Pair", 1250, "shop_product", "new", 20, "Vehicles", "MotoLite", "Universal"],
  ["Used Pulsar N160 Silencer Guard", 6500, "used_product", "like_new", 1, "Vehicles", "Bajaj", "N160"],
  ["Cotton Casual Shirt", 2950, "shop_product", "new", 25, "Shop Products", "UrbanWear", "Regular Fit"],
  ["Ladies Handbag", 3700, "shop_product", "new", 18, "Shop Products", "Luna", "Classic"],
  ["Children School Lunch Box", 890, "shop_product", "new", 34, "Shop Products", "Kiddo", "Double Layer"],
  ["Organic Coconut Oil 500ml", 1350, "own_product", "new", 28, "Shop Products", "Eastern Naturals", "500ml"],
  ["Homemade Chilli Paste", 720, "own_product", "new", 30, "Shop Products", "Home Taste", "250g"],
  ["Premium Date Pack", 1650, "shop_product", "new", 26, "Shop Products", "Al Baraka", "1kg"],
  ["Fresh Juice Bottle Pack", 900, "shop_product", "new", 20, "Shop Products", "FreshDrop", "4 Pack"],
  ["Used Office Chair", 12500, "used_product", "good", 2, "Used Products", "ErgoSeat", "Mesh"],
  ["Used Canon DSLR Camera", 112000, "used_product", "good", 1, "Used Products", "Canon", "EOS 200D"],
  ["Second-hand Study Table", 8500, "used_product", "used", 1, "Used Products", "Local", "Wooden"],
  ["Portable Power Bank 10000mAh", 5200, "shop_product", "new", 24, "Electronics", "PowerGo", "P10"],
  ["Smart Watch Fitness Edition", 6800, "shop_product", "new", 17, "Electronics", "FitTime", "S3"],
  ["Bluetooth Neckband", 2350, "shop_product", "new", 29, "Electronics", "SoundGo", "Flex"],
  ["Wi-Fi Router Dual Band", 7900, "shop_product", "new", 13, "Electronics", "TP-Link", "Archer C6"],
  ["Mechanical Gaming Keyboard", 8900, "shop_product", "new", 9, "Electronics", "Redragon", "K552"],
  ["Refurbished Desktop PC", 64500, "used_product", "good", 3, "Used Products", "Dell", "OptiPlex"],
  ["Mini Bluetooth Speaker", 999, "shop_product", "new", 50, "Electronics", "BeatBox", "Pocket"],
];

const SERVICE_EXPANSION = [
  ["Cupcake Box for Events", 2400, "Home Food", "Cake Maker", ["cupcake", "event", "food"]],
  ["Wedding Cake Consultation", 5000, "Home Food", "Cake Maker", ["wedding", "cake", "consultation"]],
  ["Family Lunch Pack", 2800, "Home Food", "Home Food", ["rice", "family", "delivery"]],
  ["Office Tea and Snack Service", 1800, "Home Food", "Catering", ["office", "snack", "tea"]],
  ["Engagement Stage Decoration", 32000, "Wedding Services", "Event Decor", ["engagement", "decor", "event"]],
  ["Wedding Invitation Design", 2500, "Editing Services", "Graphic Designer", ["wedding", "invitation", "design"]],
  ["Birthday Poster Design", 1200, "Editing Services", "Graphic Designer", ["birthday", "poster", "design"]],
  ["Social Media Reel Editing", 2200, "Editing Services", "Video Editor", ["reel", "editing", "social"]],
  ["YouTube Thumbnail Package", 1500, "Editing Services", "Designer", ["youtube", "thumbnail", "design"]],
  ["Old Photo Restoration", 1800, "Editing Services", "Photo Editor", ["photo", "restore", "editing"]],
  ["Professional CV Design", 1200, "Computer & Web", "Computer Work", ["cv", "resume", "document"]],
  ["Excel Data Entry Support", 2500, "Computer & Web", "Data Entry", ["excel", "data", "office"]],
  ["Small Business Website", 45000, "Computer & Web", "Web Developer", ["business", "website", "development"]],
  ["E-commerce Website Setup", 85000, "Computer & Web", "Web Developer", ["ecommerce", "website", "shop"]],
  ["WordPress Maintenance", 6500, "Computer & Web", "Web Support", ["wordpress", "maintenance", "website"]],
  ["Laptop Software Installation", 1800, "Computer & Web", "Computer Technician", ["laptop", "software", "support"]],
  ["Home Wi-Fi Setup", 2500, "Computer & Web", "Network Technician", ["wifi", "network", "home"]],
  ["Wedding Photography Bronze", 28000, "Wedding Services", "Photographer", ["wedding", "photo", "event"]],
  ["Product Photography Session", 9000, "Wedding Services", "Photographer", ["product", "photo", "business"]],
  ["Drone Event Coverage", 18000, "Wedding Services", "Videographer", ["drone", "video", "event"]],
  ["Same-day Local Delivery", 500, "Computer & Web", "Delivery", ["delivery", "same day", "local"]],
  ["Wedding Gift Packing", 3500, "Wedding Services", "Gift Service", ["wedding", "gift", "packing"]],
  ["Custom Corporate Gift Box", 6500, "Wedding Services", "Gift Service", ["corporate", "gift", "custom"]],
  ["Document Pickup and Delivery", 650, "Computer & Web", "Delivery", ["document", "delivery", "pickup"]],
];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function daysAgo(days, hours = 9) {
  const date = new Date();
  date.setHours(hours, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function daysFromNow(days, hours = 18) {
  const date = new Date();
  date.setHours(hours, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

async function passwordHash(password) {
  return bcrypt.hash(password, 12);
}

async function upsertExpansionUser(prisma, { name, email, password, role, phone, businessName = null, status = "active" }) {
  const hash = await passwordHash(password);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash: hash, role, phone, businessName, status },
    create: { name, email, passwordHash: hash, role, phone, businessName, status },
  });
}

async function ensureExpansionUsers(prisma) {
  const customers = [];
  const customerNames = [
    "Rizana Ameen",
    "Safwan Irshad",
    "Shakira Naleem",
    "Mubeen Fawzan",
    "Nihla Rameez",
    "Aqeel Riyas",
    "Husna Niyas",
    "Rameez Ahamed",
    "Fairoosa Sameer",
    "Aathif Imran",
  ];
  for (let index = 0; index < customerNames.length; index += 1) {
    customers.push(await upsertExpansionUser(prisma, {
      name: customerNames[index],
      email: `customer${index + 11}@smartsell.local`,
      password: DEMO_PASSWORDS.customer,
      role: "customer",
      phone: `076110${String(index + 11).padStart(4, "0")}`,
    }));
  }

  const businessSpecs = [
    ["seller", "Eastern Preowned Market", "seller6@smartsell.local", "individual_seller", "Eastern Preowned Market"],
    ["seller", "Campus Value Deals", "seller7@smartsell.local", "individual_seller", "Campus Value Deals"],
    ["seller", "Home Creator Corner", "seller8@smartsell.local", "individual_seller", "Home Creator Corner"],
    ["shop", "Oluvil Digital Store", "shop6@smartsell.local", "shop_seller", "Oluvil Digital Store"],
    ["shop", "Sainthamaruthu Home Mart", "shop7@smartsell.local", "shop_seller", "Sainthamaruthu Home Mart"],
    ["shop", "Ampara Gift Gallery", "shop8@smartsell.local", "shop_seller", "Ampara Gift Gallery"],
    ["service_provider", "Noor Event Studio", "provider6@smartsell.local", "service_provider", "Noor Event Studio"],
    ["service_provider", "Eastern Digital Desk", "provider7@smartsell.local", "service_provider", "Eastern Digital Desk"],
    ["service_provider", "QuickServe Local", "provider8@smartsell.local", "service_provider", "QuickServe Local"],
  ];

  const businessUsers = [];
  for (let index = 0; index < businessSpecs.length; index += 1) {
    const [role, name, email, sellerType, businessName] = businessSpecs[index];
    const user = await upsertExpansionUser(prisma, {
      name,
      email,
      password: DEMO_PASSWORDS[role],
      role,
      phone: `076220${String(index + 1).padStart(4, "0")}`,
      businessName,
    });
    const sellerProfile = await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {
        sellerType,
        businessName,
        shopName: role === "shop" ? businessName : null,
        description: `${businessName} is a verified SmartSell demo business serving Eastern Province customers.`,
        phone: user.phone,
        location: LOCATIONS[index % LOCATIONS.length],
        status: "approved",
      },
      create: {
        userId: user.id,
        sellerType,
        businessName,
        shopName: role === "shop" ? businessName : null,
        description: `${businessName} is a verified SmartSell demo business serving Eastern Province customers.`,
        phone: user.phone,
        location: LOCATIONS[index % LOCATIONS.length],
        status: "approved",
      },
    });
    if (role === "service_provider") {
      await prisma.serviceProviderProfile.upsert({
        where: { userId: user.id },
        update: {
          businessName,
          description: `${businessName} provides bookable services through SmartSell.`,
          phone: user.phone,
          location: LOCATIONS[index % LOCATIONS.length],
          status: "approved",
        },
        create: {
          userId: user.id,
          businessName,
          description: `${businessName} provides bookable services through SmartSell.`,
          phone: user.phone,
          location: LOCATIONS[index % LOCATIONS.length],
          status: "approved",
        },
      });
    }
    businessUsers.push({ user, sellerProfile, role });
  }

  const deliveryPartners = [];
  for (let index = 0; index < 3; index += 1) {
    deliveryPartners.push(await upsertExpansionUser(prisma, {
      name: ["Nintavur Route Rider", "Oluvil Express Rider", "Ampara City Rider"][index],
      email: `delivery${index + 6}@smartsell.local`,
      password: DEMO_PASSWORDS.delivery_partner,
      role: "delivery_partner",
      phone: `076330${String(index + 1).padStart(4, "0")}`,
      businessName: "SmartSell Delivery Network",
    }));
  }

  return { customers, businessUsers, deliveryPartners };
}

async function ensureExpansionCategories(prisma) {
  const specs = [
    ["Mobile Accessories", "mobile-accessories", "product", "Chargers, covers, cables, holders, and phone accessories."],
    ["Fashion & Lifestyle", "fashion-lifestyle", "product", "Clothing, bags, perfume, and everyday lifestyle products."],
    ["Home & Kitchen", "home-kitchen", "product", "Kitchen tools, home organisation, furniture, and useful household products."],
    ["Books & Stationery", "books-stationery", "product", "Notebooks, school supplies, office stationery, and study essentials."],
    ["Photography & Media", "photography-media", "service", "Photography, videography, editing, restoration, and media services."],
    ["Business Support", "business-support", "service", "Websites, documents, data work, design, and digital support."],
    ["Catering & Events", "catering-events", "service", "Food, snacks, event catering, and function support."],
    ["Delivery & Logistics", "delivery-logistics", "service", "Local pickup, delivery, courier, and logistics assistance."],
  ];
  for (let index = 0; index < specs.length; index += 1) {
    const [name, slug, type, description] = specs[index];
    await prisma.category.upsert({
      where: { slug },
      update: { name, type, description, isActive: true, isFeatured: index < 6, sortOrder: 20 + index },
      create: { name, slug, type, description, icon: type === "product" ? "box" : "service", isActive: true, isFeatured: index < 6, sortOrder: 20 + index },
    });
  }
  return prisma.category.findMany({ where: { isActive: true } });
}

async function seedExpansionProducts(prisma, categories, businessUsers, admin) {
  const categoryMap = new Map(categories.map((category) => [category.name, category]));
  const profiles = businessUsers.filter(({ role }) => role === "seller" || role === "shop");
  const fallbackProfiles = await prisma.sellerProfile.findMany({ where: { status: "approved", userId: { not: null } }, include: { user: true } });
  const products = [];

  for (let index = 0; index < PRODUCT_EXPANSION.length; index += 1) {
    const [name, price, type, condition, stock, categoryName, brand, model] = PRODUCT_EXPANSION[index];
    const slug = `phase134-${slugify(name)}`;
    const selected = profiles[index % Math.max(1, profiles.length)];
    const fallback = fallbackProfiles[index % Math.max(1, fallbackProfiles.length)];
    const sellerProfile = selected?.sellerProfile || fallback;
    const owner = selected?.user || fallback?.user || admin;
    const category = categoryMap.get(categoryName) || categories.find((item) => item.type === "product");
    const status = index < 32 ? "approved" : index < 36 ? "pending" : index < 39 ? "rejected" : index < 41 ? "draft" : "archived";
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        description: `${name} listed with realistic pricing, stock, seller, location, and approval data for SmartSell marketplace testing.`,
        categoryId: category?.id || null,
        type,
        price,
        sku: `SS-P134-${String(index + 1).padStart(3, "0")}`,
        brand,
        model,
        condition,
        stock,
        lowStockThreshold: stock <= 5 ? 2 : 5,
        isStockTracked: true,
        allowBackorder: index % 7 === 0,
        listingExpiresAt: daysFromNow(45 + index),
        location: LOCATIONS[index % LOCATIONS.length],
        status,
        isFeatured: status === "approved" && (index % 4 === 0 || price <= 1000),
        sellerId: type === "own_product" ? null : sellerProfile?.id || null,
        createdById: type === "own_product" ? admin.id : owner?.id || admin.id,
      },
      create: {
        name,
        slug,
        description: `${name} listed with realistic pricing, stock, seller, location, and approval data for SmartSell marketplace testing.`,
        categoryId: category?.id || null,
        type,
        price,
        sku: `SS-P134-${String(index + 1).padStart(3, "0")}`,
        brand,
        model,
        condition,
        stock,
        lowStockThreshold: stock <= 5 ? 2 : 5,
        isStockTracked: true,
        allowBackorder: index % 7 === 0,
        listingExpiresAt: daysFromNow(45 + index),
        location: LOCATIONS[index % LOCATIONS.length],
        status,
        isFeatured: status === "approved" && (index % 4 === 0 || price <= 1000),
        sellerId: type === "own_product" ? null : sellerProfile?.id || null,
        createdById: type === "own_product" ? admin.id : owner?.id || admin.id,
        createdAt: daysAgo((index % 35) + 1),
      },
    });
    products.push(product);

    for (let imageIndex = 0; imageIndex < 2; imageIndex += 1) {
      const existing = await prisma.productImage.findFirst({ where: { productId: product.id, sortOrder: imageIndex } });
      const image = `${PRODUCT_IMAGES[(index + imageIndex) % PRODUCT_IMAGES.length]}&sig=p134-${index}-${imageIndex}`;
      if (existing) {
        await prisma.productImage.update({ where: { id: existing.id }, data: { url: image, alt: `${name} image ${imageIndex + 1}` } });
      } else {
        await prisma.productImage.create({ data: { productId: product.id, url: image, alt: `${name} image ${imageIndex + 1}`, sortOrder: imageIndex } });
      }
    }

    if (index % 2 === 0) {
      for (let variantIndex = 0; variantIndex < 2; variantIndex += 1) {
        const sku = `SS-P134-${String(index + 1).padStart(3, "0")}-V${variantIndex + 1}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {
            productId: product.id,
            name: variantIndex === 0 ? "Standard" : "Premium",
            priceAdjustment: variantIndex === 0 ? 0 : Math.max(100, Math.round(price * 0.08)),
            stock: Math.max(0, stock - variantIndex * 2),
            attributes: { option: variantIndex === 0 ? "Standard" : "Premium", phase: 134 },
            isActive: true,
          },
          create: {
            productId: product.id,
            name: variantIndex === 0 ? "Standard" : "Premium",
            sku,
            priceAdjustment: variantIndex === 0 ? 0 : Math.max(100, Math.round(price * 0.08)),
            stock: Math.max(0, stock - variantIndex * 2),
            attributes: { option: variantIndex === 0 ? "Standard" : "Premium", phase: 134 },
            isActive: true,
          },
        });
      }
    }

    const movementReference = `P134-OPEN-${String(index + 1).padStart(3, "0")}`;
    const movement = await prisma.stockMovement.findFirst({ where: { reference: movementReference } });
    if (!movement) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "opening_stock",
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          reason: "Phase 134 realistic demo opening stock",
          reference: movementReference,
          createdById: admin.id,
          createdAt: daysAgo((index % 30) + 1),
        },
      });
    }
  }

  return products;
}

async function seedExpansionServices(prisma, categories, businessUsers) {
  const categoryMap = new Map(categories.map((category) => [category.name, category]));
  const providers = businessUsers.filter(({ role }) => role === "service_provider");
  const fallbackProviders = await prisma.serviceProviderProfile.findMany({ where: { status: "approved" }, include: { user: true } });
  const services = [];

  for (let index = 0; index < SERVICE_EXPANSION.length; index += 1) {
    const [title, priceFrom, categoryName, providerType, tags] = SERVICE_EXPANSION[index];
    const slug = `phase134-${slugify(title)}`;
    const selected = providers[index % Math.max(1, providers.length)];
    const fallback = fallbackProviders[index % Math.max(1, fallbackProviders.length)];
    const provider = selected ? await prisma.serviceProviderProfile.findUnique({ where: { userId: selected.user.id } }) : fallback;
    const owner = selected?.user || fallback?.user;
    const category = categoryMap.get(categoryName) || categories.find((item) => item.type === "service");
    const status = index < 18 ? "approved" : index < 21 ? "pending" : index < 23 ? "rejected" : "draft";
    const service = await prisma.service.upsert({
      where: { slug },
      update: {
        title,
        description: `${title} with realistic service area, pricing, booking, scheduling, and provider data for SmartSell testing.`,
        categoryId: category?.id || null,
        priceFrom,
        serviceArea: index % 5 === 0 ? "Island-wide" : LOCATIONS[index % LOCATIONS.length],
        availabilityNote: ["Weekdays and weekends by appointment.", "Same-day slots subject to availability.", "Advance booking is recommended."][index % 3],
        estimatedDuration: ["2 hours", "Half day", "1 day", "3 days", "1 week"][index % 5],
        minNoticeHours: [4, 8, 12, 24, 48][index % 5],
        bookingMode: index % 3 === 0 ? "direct_booking" : "quote_only",
        serviceTags: tags,
        status,
        isFeatured: status === "approved" && index % 3 === 0,
        providerId: provider?.id || null,
        providerType,
        createdById: owner?.id || null,
      },
      create: {
        title,
        slug,
        description: `${title} with realistic service area, pricing, booking, scheduling, and provider data for SmartSell testing.`,
        categoryId: category?.id || null,
        priceFrom,
        serviceArea: index % 5 === 0 ? "Island-wide" : LOCATIONS[index % LOCATIONS.length],
        availabilityNote: ["Weekdays and weekends by appointment.", "Same-day slots subject to availability.", "Advance booking is recommended."][index % 3],
        estimatedDuration: ["2 hours", "Half day", "1 day", "3 days", "1 week"][index % 5],
        minNoticeHours: [4, 8, 12, 24, 48][index % 5],
        bookingMode: index % 3 === 0 ? "direct_booking" : "quote_only",
        serviceTags: tags,
        status,
        isFeatured: status === "approved" && index % 3 === 0,
        providerId: provider?.id || null,
        providerType,
        createdById: owner?.id || null,
        createdAt: daysAgo((index % 28) + 1),
      },
    });
    services.push(service);

    for (let imageIndex = 0; imageIndex < 2; imageIndex += 1) {
      const existing = await prisma.serviceImage.findFirst({ where: { serviceId: service.id, sortOrder: imageIndex } });
      const image = `${SERVICE_IMAGES[(index + imageIndex) % SERVICE_IMAGES.length]}&sig=s134-${index}-${imageIndex}`;
      if (existing) {
        await prisma.serviceImage.update({ where: { id: existing.id }, data: { url: image, alt: `${title} image ${imageIndex + 1}` } });
      } else {
        await prisma.serviceImage.create({ data: { serviceId: service.id, url: image, alt: `${title} image ${imageIndex + 1}`, sortOrder: imageIndex } });
      }
    }
  }

  return services;
}

async function seedExpansionRequests(prisma, customers, businessUsers) {
  const types = ["used_phone", "birthday_package", "wedding_service", "home_food", "website", "editing", "gift_box", "delivery", "computer_work", "vehicle_accessory"];
  const statuses = ["new", "pending", "quoted", "accepted", "in_progress", "completed", "cancelled"];
  const assignees = businessUsers.map(({ user }) => user);
  const requests = [];
  for (let index = 0; index < 24; index += 1) {
    const customer = customers[index % customers.length];
    const requestType = types[index % types.length];
    const marker = `Phase 134 request ${String(index + 1).padStart(2, "0")}`;
    const existing = await prisma.customRequest.findFirst({ where: { message: { startsWith: marker } } });
    const data = {
      userId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      requestType,
      budget: 1500 + index * 2250,
      location: LOCATIONS[index % LOCATIONS.length],
      message: `${marker}: Customer needs ${requestType.replaceAll("_", " ")} with clear budget, location, and timing requirements.`,
      status: statuses[index % statuses.length],
      quotation: index % 3 === 0 ? 3500 + index * 1400 : null,
      assignedTo: index % 4 === 0 ? null : assignees[index % assignees.length]?.id || null,
      adminNote: index % 2 === 0 ? "Follow up with the customer and confirm the final requirement." : null,
    };
    if (existing) {
      requests.push(await prisma.customRequest.update({ where: { id: existing.id }, data }));
    } else {
      requests.push(await prisma.customRequest.create({ data: { ...data, createdAt: daysAgo((index % 24) + 1) } }));
    }
  }
  return requests;
}

async function seedExpansionOrders(prisma, customers, products, deliveryPartners) {
  const approvedProducts = products.filter((product) => product.status === "approved");
  const orderStatuses = ["pending", "confirmed", "processing", "ready", "delivered", "cancelled"];
  const deliveryStatuses = ["not_assigned", "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"];
  const paymentStatuses = ["unpaid", "pending", "paid", "paid", "paid", "refunded"];
  const orders = [];

  for (let index = 0; index < 30; index += 1) {
    const customer = customers[index % customers.length];
    const firstProduct = approvedProducts[index % approvedProducts.length];
    const secondProduct = approvedProducts[(index + 7) % approvedProducts.length];
    const itemSpecs = index % 3 === 0 ? [[firstProduct, 1], [secondProduct, 1]] : [[firstProduct, (index % 2) + 1]];
    const subtotal = itemSpecs.reduce((sum, [product, quantity]) => sum + Number(product.price) * quantity, 0);
    const discount = index % 5 === 0 ? Math.min(1000, Math.round(subtotal * 0.08)) : 0;
    const deliveryFee = index % 4 === 0 ? 0 : 350 + (index % 3) * 100;
    const total = subtotal - discount + deliveryFee;
    const status = orderStatuses[index % orderStatuses.length];
    const deliveryStatus = deliveryStatuses[index % deliveryStatuses.length];
    const paymentStatus = paymentStatuses[index % paymentStatuses.length];
    const orderNo = `SS-P134-${String(index + 1).padStart(4, "0")}`;
    const partner = deliveryStatus === "not_assigned" ? null : deliveryPartners[index % deliveryPartners.length];

    const order = await prisma.order.upsert({
      where: { orderNo },
      update: {
        customerId: customer.id,
        status,
        paymentStatus,
        subtotalAmount: subtotal,
        discountAmount: discount,
        couponCode: discount ? "PAGINATION10" : null,
        totalAmount: total,
        deliveryName: customer.name,
        deliveryPhone: customer.phone,
        deliveryAddress: `${20 + index}, ${["Main Street", "Beach Road", "Market Lane", "Hospital Road"][index % 4]}, ${LOCATIONS[index % LOCATIONS.length]}`,
        deliveryStatus,
        deliveryPartnerId: partner?.id || null,
        deliveryAssignedAt: partner ? daysAgo(Math.max(0, (index % 12) - 1)) : null,
        deliveryFee,
        courierName: partner ? "SmartSell Delivery Network" : null,
        trackingNumber: partner ? `P134-TRK-${String(index + 1).padStart(4, "0")}` : null,
        deliveryNote: index % 2 === 0 ? "Call before arrival and handle the parcel carefully." : "Deliver during daytime hours.",
        estimatedDelivery: daysFromNow((index % 5) + 1),
        deliveredAt: deliveryStatus === "delivered" ? daysAgo(index % 5) : null,
      },
      create: {
        orderNo,
        customerId: customer.id,
        status,
        paymentStatus,
        subtotalAmount: subtotal,
        discountAmount: discount,
        couponCode: discount ? "PAGINATION10" : null,
        totalAmount: total,
        deliveryName: customer.name,
        deliveryPhone: customer.phone,
        deliveryAddress: `${20 + index}, ${["Main Street", "Beach Road", "Market Lane", "Hospital Road"][index % 4]}, ${LOCATIONS[index % LOCATIONS.length]}`,
        deliveryStatus,
        deliveryPartnerId: partner?.id || null,
        deliveryAssignedAt: partner ? daysAgo(Math.max(0, (index % 12) - 1)) : null,
        deliveryFee,
        courierName: partner ? "SmartSell Delivery Network" : null,
        trackingNumber: partner ? `P134-TRK-${String(index + 1).padStart(4, "0")}` : null,
        deliveryNote: index % 2 === 0 ? "Call before arrival and handle the parcel carefully." : "Deliver during daytime hours.",
        estimatedDelivery: daysFromNow((index % 5) + 1),
        deliveredAt: deliveryStatus === "delivered" ? daysAgo(index % 5) : null,
        createdAt: daysAgo((index % 30) + 1),
      },
    });
    orders.push(order);

    for (const [product, quantity] of itemSpecs) {
      const existingItem = await prisma.orderItem.findFirst({ where: { orderId: order.id, productId: product.id } });
      if (existingItem) {
        await prisma.orderItem.update({ where: { id: existingItem.id }, data: { name: product.name, quantity, price: product.price } });
      } else {
        await prisma.orderItem.create({ data: { orderId: order.id, productId: product.id, name: product.name, quantity, price: product.price } });
      }
    }

    const paymentReference = `P134-PAY-${String(index + 1).padStart(4, "0")}`;
    const payment = await prisma.payment.findFirst({ where: { orderId: order.id, reference: paymentReference } });
    if (payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { amount: total, method: ["cod", "bank_transfer", "card"][index % 3], status: paymentStatus } });
    } else {
      await prisma.payment.create({ data: { orderId: order.id, amount: total, method: ["cod", "bank_transfer", "card"][index % 3], status: paymentStatus, reference: paymentReference, createdAt: daysAgo((index % 30) + 1) } });
    }
  }
  return orders;
}

async function seedExpansionOffersReviewsWishlist(prisma, customers, products, services) {
  const approvedProducts = products.filter((product) => product.status === "approved");
  const negotiableProducts = approvedProducts.filter((product) => product.type === "used_product");
  const approvedServices = services.filter((service) => service.status === "approved");
  const offerStatuses = ["pending", "countered", "accepted", "rejected", "expired"];

  for (let index = 0; index < 24; index += 1) {
    const customer = customers[index % customers.length];
    const product = (negotiableProducts.length ? negotiableProducts : approvedProducts)[index % (negotiableProducts.length || approvedProducts.length)];
    const sellerId = product.createdById;
    const offerNo = `SS-P134-OFFER-${String(index + 1).padStart(4, "0")}`;
    await prisma.productOffer.upsert({
      where: { offerNo },
      update: {
        productId: product.id,
        buyerId: customer.id,
        sellerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        offeredAmount: Math.max(300, Math.round(Number(product.price) * (0.72 + (index % 4) * 0.04))),
        counterAmount: index % 5 === 1 ? Math.round(Number(product.price) * 0.92) : null,
        message: "I am interested in this item. Is this offer acceptable?",
        sellerNote: index % 3 === 0 ? "The product is available. Please review the counter price." : null,
        status: offerStatuses[index % offerStatuses.length],
        expiresAt: daysFromNow((index % 10) + 2),
      },
      create: {
        offerNo,
        productId: product.id,
        buyerId: customer.id,
        sellerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        offeredAmount: Math.max(300, Math.round(Number(product.price) * (0.72 + (index % 4) * 0.04))),
        counterAmount: index % 5 === 1 ? Math.round(Number(product.price) * 0.92) : null,
        message: "I am interested in this item. Is this offer acceptable?",
        sellerNote: index % 3 === 0 ? "The product is available. Please review the counter price." : null,
        status: offerStatuses[index % offerStatuses.length],
        expiresAt: daysFromNow((index % 10) + 2),
        createdAt: daysAgo((index % 20) + 1),
      },
    });
  }

  for (let index = 0; index < 42; index += 1) {
    const customer = customers[index % customers.length];
    const product = approvedProducts[index % approvedProducts.length];
    const existing = await prisma.review.findFirst({ where: { userId: customer.id, productId: product.id } });
    const data = {
      rating: [5, 4, 5, 3, 4][index % 5],
      comment: [
        "Product matched the description and the seller communicated clearly.",
        "Good value for the price and delivery updates were helpful.",
        "Item arrived safely and was packaged well.",
        "The product is useful, but delivery took slightly longer than expected.",
        "Smooth buying experience and responsive seller.",
      ][index % 5],
      status: index % 8 === 0 ? "pending" : "approved",
    };
    if (existing) await prisma.review.update({ where: { id: existing.id }, data });
    else await prisma.review.create({ data: { userId: customer.id, productId: product.id, ...data, createdAt: daysAgo((index % 35) + 1) } });

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: customer.id, productId: product.id } },
      update: {},
      create: { userId: customer.id, productId: product.id, createdAt: daysAgo(index % 20) },
    });
  }

  for (let index = 0; index < 28; index += 1) {
    const customer = customers[(index + 3) % customers.length];
    const service = approvedServices[index % approvedServices.length];
    const existing = await prisma.review.findFirst({ where: { userId: customer.id, serviceId: service.id } });
    const data = {
      rating: [5, 5, 4, 4, 3][index % 5],
      comment: [
        "The provider understood the requirement and delivered on time.",
        "Professional communication and a good final result.",
        "Easy quotation process and helpful updates.",
        "Service quality was good and the booking process was simple.",
        "Useful service, with room for faster response time.",
      ][index % 5],
      status: index % 9 === 0 ? "pending" : "approved",
    };
    if (existing) await prisma.review.update({ where: { id: existing.id }, data });
    else await prisma.review.create({ data: { userId: customer.id, serviceId: service.id, ...data, createdAt: daysAgo((index % 28) + 1) } });
  }
}

async function seedExpansionFinance(prisma, orders) {
  const orderItems = await prisma.orderItem.findMany({
    where: { orderId: { in: orders.map((order) => order.id) } },
    include: { product: true, order: true },
  });
  for (let index = 0; index < orderItems.length; index += 1) {
    const item = orderItems[index];
    const sellerId = item.product?.createdById;
    if (!sellerId) continue;
    const grossAmount = Number(item.price) * item.quantity;
    const commissionRate = 10;
    const commissionAmount = Math.round(grossAmount * commissionRate) / 100;
    await prisma.commission.upsert({
      where: { orderItemId: item.id },
      update: {
        sellerId,
        orderId: item.orderId,
        productId: item.productId,
        grossAmount,
        commissionRate,
        commissionAmount,
        sellerAmount: grossAmount - commissionAmount,
        status: item.order.paymentStatus === "paid" && item.order.status === "delivered" ? "available" : item.order.status === "cancelled" ? "cancelled" : "pending",
      },
      create: {
        sellerId,
        orderId: item.orderId,
        orderItemId: item.id,
        productId: item.productId,
        grossAmount,
        commissionRate,
        commissionAmount,
        sellerAmount: grossAmount - commissionAmount,
        status: item.order.paymentStatus === "paid" && item.order.status === "delivered" ? "available" : item.order.status === "cancelled" ? "cancelled" : "pending",
        createdAt: item.order.createdAt,
      },
    });
  }

  const sellers = await prisma.user.findMany({ where: { role: { in: ["seller", "shop", "service_provider"] }, status: "active" } });
  for (let index = 0; index < 14; index += 1) {
    const seller = sellers[index % sellers.length];
    const amount = 3000 + index * 1250;
    const existing = await prisma.payoutRequest.findFirst({ where: { sellerId: seller.id, amount } });
    const data = {
      method: ["bank_transfer", "cash", "ez_cash"][index % 3],
      accountDetails: `Phase 134 payout destination ${index + 1}`,
      note: "Demo payout request for finance pagination and status testing.",
      adminNote: index % 3 === 0 ? "Identity and settlement details verified." : null,
      status: ["pending", "approved", "paid", "rejected"][index % 4],
      processedAt: index % 4 > 0 ? daysAgo(index % 10) : null,
    };
    if (existing) await prisma.payoutRequest.update({ where: { id: existing.id }, data });
    else await prisma.payoutRequest.create({ data: { sellerId: seller.id, amount, ...data, requestedAt: daysAgo((index % 20) + 1) } });
  }
}

async function seedExpansionCommunication(prisma, customers, businessUsers, admin, orders, requests) {
  const allRecipients = [...customers, ...businessUsers.map(({ user }) => user), admin];
  const notificationTypes = ["order", "payment", "delivery", "offer", "request", "support", "review", "security"];
  for (let index = 0; index < 64; index += 1) {
    const user = allRecipients[index % allRecipients.length];
    const title = `Phase 134 ${notificationTypes[index % notificationTypes.length]} update ${String(index + 1).padStart(2, "0")}`;
    const existing = await prisma.notification.findFirst({ where: { userId: user.id, title } });
    const data = {
      message: `A realistic ${notificationTypes[index % notificationTypes.length]} notification for pagination, filters, unread states, and related-page navigation.`,
      type: notificationTypes[index % notificationTypes.length],
      link: ["/orders", "/notifications", "/delivery", "/offers", "/my-requests", "/support", "/my-reviews", "/security"][index % 8],
      isRead: index % 3 === 0,
    };
    if (existing) await prisma.notification.update({ where: { id: existing.id }, data });
    else await prisma.notification.create({ data: { userId: user.id, title, ...data, createdAt: daysAgo(index % 30) } });
  }

  const issueTypes = ["order", "payment", "delivery", "refund", "listing", "general"];
  const priorities = ["low", "normal", "high", "urgent"];
  const statuses = ["open", "in_progress", "waiting_customer", "resolved", "closed"];
  const tickets = [];
  for (let index = 0; index < 20; index += 1) {
    const customer = customers[index % customers.length];
    const order = orders[index % orders.length];
    const ticketNo = `SS-P134-TICKET-${String(index + 1).padStart(4, "0")}`;
    const ticket = await prisma.supportTicket.upsert({
      where: { ticketNo },
      update: {
        userId: customer.id,
        orderId: order?.id || null,
        requestId: index % 4 === 0 ? requests[index % requests.length]?.id || null : null,
        subject: `Support case ${String(index + 1).padStart(2, "0")} — ${issueTypes[index % issueTypes.length]}`,
        issueType: issueTypes[index % issueTypes.length],
        priority: priorities[index % priorities.length],
        status: statuses[index % statuses.length],
        preferredResolution: index % 3 === 0 ? "refund" : index % 3 === 1 ? "replacement" : "technical_support",
        customerMessage: "The customer has provided a detailed description, order context, and preferred resolution for this demo support case.",
        adminNote: index % 2 === 0 ? "Admin has reviewed the evidence and requested the next operational step." : null,
        refundAmount: index % 5 === 0 ? 1250 + index * 100 : null,
        assignedAdminId: admin.id,
        resolvedAt: statuses[index % statuses.length] === "resolved" || statuses[index % statuses.length] === "closed" ? daysAgo(index % 10) : null,
      },
      create: {
        ticketNo,
        userId: customer.id,
        orderId: order?.id || null,
        requestId: index % 4 === 0 ? requests[index % requests.length]?.id || null : null,
        subject: `Support case ${String(index + 1).padStart(2, "0")} — ${issueTypes[index % issueTypes.length]}`,
        issueType: issueTypes[index % issueTypes.length],
        priority: priorities[index % priorities.length],
        status: statuses[index % statuses.length],
        preferredResolution: index % 3 === 0 ? "refund" : index % 3 === 1 ? "replacement" : "technical_support",
        customerMessage: "The customer has provided a detailed description, order context, and preferred resolution for this demo support case.",
        adminNote: index % 2 === 0 ? "Admin has reviewed the evidence and requested the next operational step." : null,
        refundAmount: index % 5 === 0 ? 1250 + index * 100 : null,
        assignedAdminId: admin.id,
        resolvedAt: statuses[index % statuses.length] === "resolved" || statuses[index % statuses.length] === "closed" ? daysAgo(index % 10) : null,
        createdAt: daysAgo((index % 24) + 1),
      },
    });
    tickets.push(ticket);
  }

  const contextTypes = ["support_ticket", "order", "request"];
  for (let index = 0; index < 20; index += 1) {
    const customer = customers[index % customers.length];
    const business = businessUsers[index % businessUsers.length]?.user;
    const contextType = contextTypes[index % contextTypes.length];
    const contextId = contextType === "support_ticket" ? tickets[index % tickets.length].id : contextType === "order" ? orders[index % orders.length].id : requests[index % requests.length].id;
    const subject = `Phase 134 ${contextType.replaceAll("_", " ")} conversation ${String(index + 1).padStart(2, "0")}`;
    let thread = await prisma.messageThread.findFirst({ where: { subject } });
    const threadData = {
      contextType,
      contextId,
      customerId: customer.id,
      businessUserId: business?.id || null,
      adminId: admin.id,
      createdById: customer.id,
    };
    if (thread) thread = await prisma.messageThread.update({ where: { id: thread.id }, data: threadData });
    else thread = await prisma.messageThread.create({ data: { subject, ...threadData, createdAt: daysAgo((index % 18) + 1) } });

    const messages = [
      [customer.id, business?.id || admin.id, "Hello, I would like an update about this SmartSell request."],
      [business?.id || admin.id, customer.id, "Thank you. We are checking the details and will confirm the next step."],
      [customer.id, admin.id, "I have added the required information. Please let me know if anything else is needed."],
      [admin.id, customer.id, "The conversation has been reviewed and the relevant team has been notified."],
    ];
    for (let messageIndex = 0; messageIndex < messages.length; messageIndex += 1) {
      const [senderId, recipientId, body] = messages[messageIndex];
      const existing = await prisma.message.findFirst({ where: { threadId: thread.id, body } });
      if (!existing) {
        await prisma.message.create({
          data: {
            threadId: thread.id,
            senderId,
            recipientId,
            body,
            readAt: messageIndex < 2 || index % 3 === 0 ? daysAgo(Math.max(0, index % 4)) : null,
            createdAt: daysAgo(Math.max(0, (index % 18) - messageIndex / 10)),
          },
        });
      }
    }
  }
}

async function seedExpansionGrowthAndMerchandising(prisma, admin, products) {
  const couponSpecs = [
    ["PAGINATION10", "Pagination Demo 10%", "percentage", 10, 2500, 1500],
    ["UNDER1000", "Affordable Finds", "fixed", 100, 750, 100],
    ["FLASH750", "Flash Sale Rs. 750", "fixed", 750, 6000, 750],
    ["EASTERN15", "Eastern Province 15%", "percentage", 15, 3500, 2500],
    ["TECH12", "Tech Accessories 12%", "percentage", 12, 2000, 1800],
    ["GIFT500", "Gift Collection Rs. 500", "fixed", 500, 3000, 500],
    ["HOME8", "Home Essentials 8%", "percentage", 8, 1800, 1000],
    ["SERVICE750", "Service Booking Rs. 750", "fixed", 750, 5000, 750],
  ];
  for (const [code, title, discountType, discountValue, minimumAmount, maxDiscount] of couponSpecs) {
    await prisma.coupon.upsert({
      where: { code },
      update: { title, description: `${title} seeded for realistic SmartSell offer testing.`, discountType, discountValue, minimumAmount, maxDiscount, usageLimit: 200, isActive: true, startsAt: daysAgo(5), endsAt: daysFromNow(45) },
      create: { code, title, description: `${title} seeded for realistic SmartSell offer testing.`, discountType, discountValue, minimumAmount, maxDiscount, usageLimit: 200, isActive: true, startsAt: daysAgo(5), endsAt: daysFromNow(45) },
    });
  }

  for (let index = 0; index < 20; index += 1) {
    const action = `phase134_demo_action_${String(index + 1).padStart(2, "0")}`;
    const existing = await prisma.adminAction.findFirst({ where: { adminId: admin.id, action } });
    if (!existing) {
      await prisma.adminAction.create({
        data: {
          adminId: admin.id,
          action,
          targetType: ["product", "service", "order", "support_ticket", "user"][index % 5],
          targetId: index < products.length ? products[index].id : null,
          note: "Realistic administration history for audit search, filtering, and pagination testing.",
          createdAt: daysAgo(index % 20),
        },
      });
    }
  }

  const approved = products.filter((product) => product.status === "approved");
  const featured = approved.filter((product) => product.isFeatured).slice(0, 12);
  const flash = approved.filter((product) => Number(product.price) >= 1800).slice(0, 10);
  const budget = approved.filter((product) => Number(product.price) <= 1000).slice(0, 12);
  const imageMap = new Map();
  const images = await prisma.productImage.findMany({ where: { productId: { in: approved.slice(0, 8).map((product) => product.id) } }, orderBy: { sortOrder: "asc" } });
  for (const image of images) if (!imageMap.has(image.productId)) imageMap.set(image.productId, image.url);

  const current = await prisma.platformSetting.findUnique({ where: { key: "homeMerchandising.config" } });
  const currentValue = current?.value && typeof current.value === "object" ? current.value : {};
  const hasAdminSelection = [
    currentValue?.todayOffers?.productIds,
    currentValue?.flashSale?.productIds,
    currentValue?.budgetCollection?.productIds,
  ].some((ids) => Array.isArray(ids) && ids.length > 0) || (Array.isArray(currentValue?.marketplaceHighlights?.slides) && currentValue.marketplaceHighlights.slides.length > 0);

  if (!hasAdminSelection) {
    const slides = approved.slice(0, 4).map((product, index) => ({
      label: ["Marketplace pick", "Used product highlight", "Shop favourite", "Affordable find"][index],
      title: product.name,
      subtitle: "A realistic SmartSell marketplace highlight managed from the admin Home Offers workspace.",
      imageUrl: imageMap.get(product.id) || PRODUCT_IMAGES[index % PRODUCT_IMAGES.length],
      link: `/products/${product.id}`,
      priceText: `Rs. ${Number(product.price).toLocaleString("en-LK")}`,
      location: product.location || "Sri Lanka",
    }));
    const config = {
      carousel: {
        enabled: true,
        direction: "ltr",
        speedSeconds: 32,
        pauseOnHover: true,
        flashAutoplay: true,
        flashIntervalSeconds: 5,
        budgetAutoplay: true,
        budgetIntervalSeconds: 7,
      },
      todayOffers: {
        enabled: true,
        eyebrow: "Today’s marketplace offers",
        title: "Useful products selected for today",
        description: "A realistic mix of shop products, used items, gifts, and local products available now.",
        link: "/marketplace?sort=featured",
        productIds: featured.map((product) => product.id),
      },
      flashSale: {
        enabled: true,
        badge: "Flash Friday",
        title: "Flash Friday marketplace picks",
        description: "One active deal with a synchronized product shelf and limited campaign timing.",
        link: "/marketplace?sort=featured",
        startAt: daysAgo(1).toISOString(),
        endAt: daysFromNow(10).toISOString(),
        productIds: flash.map((product) => product.id),
      },
      budgetCollection: {
        enabled: true,
        eyebrow: "Affordable everyday finds",
        title: "Products under Rs. 1,000",
        description: "Accessories, stationery, gifts, kitchen items, and locally made products at small prices.",
        maxPrice: 1000,
        link: "/marketplace?maxPrice=1000&sort=price_asc",
        productIds: budget.map((product) => product.id),
      },
      marketplaceHighlights: {
        enabled: true,
        autoplay: true,
        intervalSeconds: 5,
        slides,
      },
    };
    await prisma.platformSetting.upsert({
      where: { key: "homeMerchandising.config" },
      update: {
        group: "homeMerchandising",
        label: "Homepage merchandising",
        description: "Admin-managed realistic demo offers, flash sale, budget collection, and marketplace highlights.",
        value: config,
        isPublic: true,
        updatedById: admin.id,
      },
      create: {
        key: "homeMerchandising.config",
        group: "homeMerchandising",
        label: "Homepage merchandising",
        description: "Admin-managed realistic demo offers, flash sale, budget collection, and marketplace highlights.",
        value: config,
        isPublic: true,
        updatedById: admin.id,
      },
    });
  }
}

export async function seedPhase134DemoData(prisma, baseContext) {
  const admin = baseContext?.admin || await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) throw new Error("Phase 134 demo data requires an admin user. Run the base seed first.");

  console.log("\nPhase 134: expanding realistic marketplace demo data...");
  const expansionUsers = await ensureExpansionUsers(prisma);
  const categories = await ensureExpansionCategories(prisma);
  const baseCustomers = await prisma.user.findMany({ where: { role: "customer", status: "active" }, orderBy: { createdAt: "asc" } });
  const allBusinessUsers = await prisma.user.findMany({ where: { role: { in: ["seller", "shop", "service_provider"] }, status: "active" }, include: { sellerProfile: true }, orderBy: { createdAt: "asc" } });
  const normalizedBusinessUsers = allBusinessUsers.filter((user) => user.sellerProfile).map((user) => ({ user, sellerProfile: user.sellerProfile, role: user.role }));
  const deliveryPartners = await prisma.user.findMany({ where: { role: "delivery_partner", status: "active" }, orderBy: { createdAt: "asc" } });

  await seedExpansionProducts(prisma, categories, normalizedBusinessUsers, admin);
  await seedExpansionServices(prisma, categories, normalizedBusinessUsers);
  const allProducts = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  const allServices = await prisma.service.findMany({ orderBy: { createdAt: "asc" } });
  const requests = await seedExpansionRequests(prisma, baseCustomers, normalizedBusinessUsers);
  const orders = await seedExpansionOrders(prisma, baseCustomers, allProducts, deliveryPartners);
  await seedExpansionOffersReviewsWishlist(prisma, baseCustomers, allProducts, allServices);
  await seedExpansionFinance(prisma, orders);
  await seedExpansionCommunication(prisma, baseCustomers, normalizedBusinessUsers, admin, orders, requests);
  await seedExpansionGrowthAndMerchandising(prisma, admin, allProducts);

  console.log(`Phase 134 expansion complete: ${expansionUsers.customers.length} customers, ${expansionUsers.businessUsers.length} businesses, and ${expansionUsers.deliveryPartners.length} delivery partners were added or refreshed.`);
}
