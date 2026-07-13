import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORDS = {
  admin: "Admin@12345",
  super_admin: "SuperAdmin@12345",
  customer: "Customer@12345",
  seller: "Seller@12345",
  shop: "Shop@12345",
  service_provider: "Provider@12345",
  delivery_partner: "Delivery@12345",
};

const IMAGE_BASE = "https://images.unsplash.com";

const demoImages = [
  `${IMAGE_BASE}/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1498049794561-7780e7231661?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1519125323398-675f0ddb6308?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1511381939415-e44015466834?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1556740749-887f6717d7e4?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop`,
];

const serviceImages = [
  `${IMAGE_BASE}/photo-1556910103-1c02745aae4d?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1556909114-f6e7ad7d3136?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1497366754035-f200968a6e72?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop`,
  `${IMAGE_BASE}/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop`,
];

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function modelExists(modelName) {
  return Boolean(prisma[modelName]);
}

function hasField(modelName, fieldName) {
  const pascal = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  return Boolean(prisma._runtimeDataModel?.models?.[pascal]?.fields?.some((field) => field.name === fieldName));
}

function addIfField(modelName, data, fieldName, value) {
  if (hasField(modelName, fieldName)) {
    data[fieldName] = value;
  }
  return data;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function upsertUser({ name, email, password, role, status = "active", phone, businessName }) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role, status, phone: phone || null, businessName: businessName || null },
    create: { name, email, passwordHash, role, status, phone: phone || null, businessName: businessName || null },
  });
}

async function upsertCategory({ name, slug, type, icon, description, sortOrder }) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, type, icon, description, isActive: true, isFeatured: true, sortOrder },
    create: { name, slug, type, icon, description, isActive: true, isFeatured: true, sortOrder },
  });
}

async function upsertSellerProfile({ userId, sellerType, businessName, shopName, phone, location }) {
  return prisma.sellerProfile.upsert({
    where: { userId },
    update: { sellerType, businessName, shopName: shopName || null, phone, location, status: "approved" },
    create: { userId, sellerType, businessName, shopName: shopName || null, phone, location, status: "approved" },
  });
}

async function upsertServiceProviderProfile({ userId, businessName, phone, location }) {
  return prisma.serviceProviderProfile.upsert({
    where: { userId },
    update: { businessName, phone, location, status: "approved" },
    create: { userId, businessName, phone, location, status: "approved" },
  });
}

async function findOrCreate(modelName, where, data, updateData = {}) {
  const model = prisma[modelName];
  const existing = await model.findFirst({ where });
  if (existing) {
    if (!updateData || Object.keys(updateData).length === 0) {
      return existing;
    }
    return model.update({ where: { id: existing.id }, data: { ...updateData } });
  }
  return model.create({ data });
}

async function ensurePlatformSetting(key, group, label, value, description = "Demo setting") {
  if (!modelExists("platformSetting")) return null;
  return prisma.platformSetting.upsert({
    where: { key },
    update: { group, label, description, value, isPublic: true },
    create: { key, group, label, description, value, isPublic: true },
  });
}

async function seedUsers() {
  const users = [];
  users.push(await upsertUser({ name: "SmartSell Super Admin", email: "superadmin@smartsell.local", password: PASSWORDS.super_admin, role: "super_admin", phone: "0701000000", businessName: "SmartSell HQ" }));
  users.push(await upsertUser({ name: "SmartSell Admin", email: "admin@smartsell.local", password: PASSWORDS.admin, role: "admin", phone: "0701000001", businessName: "SmartSell HQ" }));

  const customerNames = ["Ahamed Rifna", "Fathima Nazeera", "Mohamed Asif", "Nuskiya Fathima", "Haneefa Saleem", "Miflal Azeez", "Aathika Zain", "Shafraz Ramees", "Ishara Niyas", "Farzana Riyas"];
  for (let index = 0; index < customerNames.length; index += 1) {
    users.push(await upsertUser({
      name: customerNames[index],
      email: `customer${index + 1}@smartsell.local`,
      password: PASSWORDS.customer,
      role: "customer",
      phone: `07710010${String(index).padStart(2, "0")}`,
    }));
  }

  const sellerUsers = [];
  const sellerNames = ["Rifkhan Deals", "Akkaraipattu Used Hub", "Eastern Gadget Seller", "Budget Home Goods", "Student Deals Lanka"];
  for (let index = 0; index < sellerNames.length; index += 1) {
    const user = await upsertUser({
      name: sellerNames[index],
      email: `seller${index + 1}@smartsell.local`,
      password: PASSWORDS.seller,
      role: "seller",
      phone: `07720020${String(index).padStart(2, "0")}`,
      businessName: sellerNames[index],
    });
    sellerUsers.push(user);
    users.push(user);
  }

  const shopUsers = [];
  const shopNames = ["SSS Multi Store", "Kalmunai Mobile Center", "Smart Fashion Shop", "Akkaraipattu Fancy House", "Eastern Fresh Mart"];
  for (let index = 0; index < shopNames.length; index += 1) {
    const user = await upsertUser({
      name: shopNames[index],
      email: `shop${index + 1}@smartsell.local`,
      password: PASSWORDS.shop,
      role: "shop",
      phone: `07730030${String(index).padStart(2, "0")}`,
      businessName: shopNames[index],
    });
    shopUsers.push(user);
    users.push(user);
  }

  const providerUsers = [];
  const providerNames = ["Nasra Cake Studio", "Rifkhan Web Works", "Eastern Wedding Team", "Quick Computer Service", "Creative Photo Editing"];
  for (let index = 0; index < providerNames.length; index += 1) {
    const user = await upsertUser({
      name: providerNames[index],
      email: `provider${index + 1}@smartsell.local`,
      password: PASSWORDS.service_provider,
      role: "service_provider",
      phone: `07740040${String(index).padStart(2, "0")}`,
      businessName: providerNames[index],
    });
    providerUsers.push(user);
    users.push(user);
  }

  const deliveryUsers = [];
  const deliveryNames = ["Smart Rider A", "Smart Rider B", "Smart Rider C", "Kalmunai Express Rider", "Akkaraipattu Delivery Rider"];
  for (let index = 0; index < deliveryNames.length; index += 1) {
    const user = await upsertUser({
      name: deliveryNames[index],
      email: `delivery${index + 1}@smartsell.local`,
      password: PASSWORDS.delivery_partner,
      role: "delivery_partner",
      phone: `07750050${String(index).padStart(2, "0")}`,
      businessName: "SmartSell Delivery Network",
    });
    deliveryUsers.push(user);
    users.push(user);
  }

  return { users, customers: users.filter((user) => user.role === "customer"), sellerUsers, shopUsers, providerUsers, deliveryUsers, admin: users.find((user) => user.role === "admin"), superAdmin: users.find((user) => user.role === "super_admin") };
}

async function seedProfiles({ sellerUsers, shopUsers, providerUsers }) {
  const sellerProfiles = [];
  for (let index = 0; index < sellerUsers.length; index += 1) {
    sellerProfiles.push(await upsertSellerProfile({
      userId: sellerUsers[index].id,
      sellerType: "individual_seller",
      businessName: sellerUsers[index].businessName,
      phone: sellerUsers[index].phone,
      location: ["Akkaraipattu", "Kalmunai", "Sammanthurai", "Addalaichenai", "Oluvil"][index],
    }));
  }

  const shopProfiles = [];
  for (let index = 0; index < shopUsers.length; index += 1) {
    shopProfiles.push(await upsertSellerProfile({
      userId: shopUsers[index].id,
      sellerType: "shop_seller",
      businessName: shopUsers[index].businessName,
      shopName: shopUsers[index].businessName,
      phone: shopUsers[index].phone,
      location: ["Kalmunai", "Akkaraipattu", "Addalaichenai", "Oluvil", "Nintavur"][index],
    }));
  }

  const providerProfiles = [];
  for (let index = 0; index < providerUsers.length; index += 1) {
    providerProfiles.push(await upsertServiceProviderProfile({
      userId: providerUsers[index].id,
      businessName: providerUsers[index].businessName,
      phone: providerUsers[index].phone,
      location: ["Kalmunai", "Akkaraipattu", "Ampara", "Sammanthurai", "Addalaichenai"][index],
    }));
    await upsertSellerProfile({
      userId: providerUsers[index].id,
      sellerType: "service_provider",
      businessName: providerUsers[index].businessName,
      phone: providerUsers[index].phone,
      location: ["Kalmunai", "Akkaraipattu", "Ampara", "Sammanthurai", "Addalaichenai"][index],
    });
  }

  return { sellerProfiles, shopProfiles, providerProfiles };
}

async function seedCategories() {
  const categoryData = [
    ["Electronics", "electronics", "product", "📱", "Phones, laptops, speakers, accessories."],
    ["Vehicles", "vehicles", "product", "🚗", "Cars, bikes, and vehicle accessories."],
    ["Used Products", "used-products", "product", "♻️", "Pre-owned products from verified sellers."],
    ["Shop Products", "shop-products", "product", "🏬", "Daily shop items and retail products."],
    ["Handmade Products", "handmade-products", "product", "🧶", "Self-made and local creator items."],
    ["Gifts", "gifts", "product", "🎁", "Gift boxes, birthday sets, and surprise packs."],
    ["Home Food", "home-food", "service", "🍚", "Rice, cakes, sweets, homemade food orders."],
    ["Wedding Services", "wedding-services", "service", "💍", "Wedding planning, décor, photo, and event support."],
    ["Editing Services", "editing-services", "service", "🎬", "Photo, video, banner, and social media editing."],
    ["Computer & Web", "computer-web", "service", "💻", "Computer work, websites, software, and documents."],
  ];

  const categories = [];
  for (let index = 0; index < categoryData.length; index += 1) {
    const [name, slug, type, icon, description] = categoryData[index];
    categories.push(await upsertCategory({ name, slug, type, icon, description, sortOrder: index + 1 }));
  }
  return categories;
}

async function seedProducts({ categories, sellerProfiles, shopProfiles, sellerUsers, shopUsers, admin }) {
  const productCategories = categories.filter((category) => category.type === "product");
  const productsData = [
    ["Used iPhone 13 Pro", "used-iphone-13-pro", "Used iPhone 13 Pro 128GB, clean display, battery checked.", 165000, "used_product", "good", 2, "Apple", "iPhone 13 Pro"],
    ["Samsung Galaxy A54", "samsung-galaxy-a54", "Shop warranty smartphone with charger and cover.", 98000, "shop_product", "new", 8, "Samsung", "Galaxy A54"],
    ["Bluetooth Party Speaker", "bluetooth-party-speaker", "Large speaker for home, shop, and small events.", 18500, "shop_product", "new", 18, "JBL Style", "Party Box"],
    ["Handmade Gift Hamper", "handmade-gift-hamper", "Birthday gift hamper with sweets, card, and packing.", 6500, "own_product", "new", 25, "SmartSell", "Gift Pack"],
    ["Used Office Laptop", "used-office-laptop", "Core i5 laptop suitable for office and study work.", 89000, "used_product", "good", 4, "Dell", "Latitude"],
    ["Fancy Wall Clock", "fancy-wall-clock", "Decorative wall clock for home or office.", 3200, "shop_product", "new", 30, "Home Art", "Classic"],
    ["Kids Birthday Decoration Set", "kids-birthday-decoration-set", "Balloon, banner, candles, and table decoration kit.", 4200, "shop_product", "new", 16, "PartyKit", "Kids Set"],
    ["Used Mountain Bicycle", "used-mountain-bicycle", "Good condition bicycle for students and daily use.", 22000, "used_product", "used", 1, "Hero", "Mountain"],
    ["Homemade Sweet Box", "homemade-sweet-box", "Local sweets packed for functions and gifts.", 2800, "own_product", "new", 40, "Home Taste", "Sweet Box"],
    ["Necto Lemonade Bundle", "necto-lemonade-bundle", "Retail beverage bundle for shops and small functions.", 5200, "shop_product", "new", 22, "Elephant House", "Bundle"],
  ];

  const products = [];
  for (let index = 0; index < productsData.length; index += 1) {
    const [name, slug, description, price, type, condition, stock, brand, model] = productsData[index];
    const category = productCategories[index % productCategories.length];
    const sellerProfile = type === "shop_product" ? shopProfiles[index % shopProfiles.length] : sellerProfiles[index % sellerProfiles.length];
    const owner = type === "shop_product" ? shopUsers[index % shopUsers.length] : sellerUsers[index % sellerUsers.length];

    const createData = {
      name,
      slug,
      description,
      categoryId: category?.id,
      type,
      price,
      condition,
      stock,
      location: ["Kalmunai", "Akkaraipattu", "Addalaichenai", "Oluvil", "Sammanthurai"][index % 5],
      status: index < 8 ? "approved" : "pending",
      isFeatured: index < 5,
      sellerId: type === "own_product" ? null : sellerProfile?.id,
      createdById: type === "own_product" ? admin.id : owner?.id,
    };
    addIfField("product", createData, "sku", `SS-DEMO-P${String(index + 1).padStart(3, "0")}`);
    addIfField("product", createData, "brand", brand);
    addIfField("product", createData, "model", model);
    addIfField("product", createData, "lowStockThreshold", index % 2 === 0 ? 5 : 3);
    addIfField("product", createData, "isStockTracked", true);
    addIfField("product", createData, "allowBackorder", index % 3 === 0);
    addIfField("product", createData, "listingExpiresAt", new Date(Date.now() + (30 + index) * 24 * 60 * 60 * 1000));

    const updateData = { ...createData };
    delete updateData.slug;
    const product = await prisma.product.upsert({ where: { slug }, update: updateData, create: createData });
    products.push(product);

    for (let imageIndex = 0; imageIndex < 3; imageIndex += 1) {
      await findOrCreate(
        "productImage",
        { productId: product.id, sortOrder: imageIndex },
        {
          productId: product.id,
          url: `${demoImages[(index + imageIndex) % demoImages.length]}&sig=${index}-${imageIndex}`,
          alt: `${name} image ${imageIndex + 1}`,
          sortOrder: imageIndex,
        },
        { url: `${demoImages[(index + imageIndex) % demoImages.length]}&sig=${index}-${imageIndex}`, alt: `${name} image ${imageIndex + 1}` },
      );
    }

    if (modelExists("productVariant")) {
      for (let variantIndex = 0; variantIndex < 2; variantIndex += 1) {
        await prisma.productVariant.upsert({
          where: { sku: `SS-DEMO-P${String(index + 1).padStart(3, "0")}-V${variantIndex + 1}` },
          update: {
            name: variantIndex === 0 ? "Standard" : "Premium",
            priceAdjustment: variantIndex === 0 ? 0 : 1500,
            stock: Math.max(0, stock - variantIndex),
            attributes: { option: variantIndex === 0 ? "Standard" : "Premium", demo: true },
            isActive: true,
          },
          create: {
            productId: product.id,
            name: variantIndex === 0 ? "Standard" : "Premium",
            sku: `SS-DEMO-P${String(index + 1).padStart(3, "0")}-V${variantIndex + 1}`,
            priceAdjustment: variantIndex === 0 ? 0 : 1500,
            stock: Math.max(0, stock - variantIndex),
            attributes: { option: variantIndex === 0 ? "Standard" : "Premium", demo: true },
            isActive: true,
          },
        });
      }
    }

    if (modelExists("stockMovement")) {
      await findOrCreate(
        "stockMovement",
        { productId: product.id, reference: `OPENING-STOCK-${index + 1}` },
        {
          productId: product.id,
          type: "opening_stock",
          quantity: stock,
          previousStock: 0,
          newStock: stock,
          reason: "Demo opening stock",
          reference: `OPENING-STOCK-${index + 1}`,
          createdById: admin.id,
        },
      );
    }
  }
  return products;
}

async function seedServices({ categories, providerProfiles, providerUsers }) {
  const serviceCategories = categories.filter((category) => category.type === "service");
  const servicesData = [
    ["Custom Birthday Cake", "custom-birthday-cake", "Fresh birthday cakes with name, theme, and delivery option.", 3500, "Cake Maker", ["cake", "birthday", "food"]],
    ["Homemade Rice Pack Delivery", "homemade-rice-pack-delivery", "Lunch packs for office, students, and small events.", 450, "Home Food", ["rice", "delivery", "food"]],
    ["Wedding Stage Decoration", "wedding-stage-decoration", "Stage, entrance, flower, and lighting decoration.", 45000, "Wedding Decor", ["wedding", "decor", "event"]],
    ["Gift Packing Service", "gift-packing-service", "Premium wrapping, ribbon, card, and surprise packing.", 900, "Gift Service", ["gift", "packing"]],
    ["Video Editing Package", "video-editing-package", "Wedding, birthday, reels, and YouTube video editing.", 6000, "Video Editor", ["video", "editing"]],
    ["Photo Retouching Service", "photo-retouching-service", "HD photo retouching, background change, and print-ready edits.", 800, "Photo Editor", ["photo", "editing"]],
    ["Website Development", "website-development", "Business website, portfolio, and shop website development.", 30000, "Web Developer", ["website", "development"]],
    ["Computer Document Work", "computer-document-work", "CV, typing, PDF, Excel, and office document support.", 500, "Computer Work", ["computer", "document"]],
    ["Event Photography", "event-photography", "Birthday, engagement, and family event photography.", 12000, "Photographer", ["photo", "event"]],
    ["Local Delivery Service", "local-delivery-service", "Local delivery for food, gifts, shop products, and documents.", 350, "Delivery", ["delivery", "local"]],
  ];

  const services = [];
  for (let index = 0; index < servicesData.length; index += 1) {
    const [title, slug, description, priceFrom, providerType, tags] = servicesData[index];
    const category = serviceCategories[index % serviceCategories.length];
    const provider = providerProfiles[index % providerProfiles.length];
    const owner = providerUsers[index % providerUsers.length];
    const createData = {
      title,
      slug,
      description,
      categoryId: category?.id,
      priceFrom,
      status: index < 8 ? "approved" : "pending",
      isFeatured: index < 6,
      providerId: provider?.id,
      providerType,
      createdById: owner?.id,
    };
    addIfField("service", createData, "serviceArea", ["Kalmunai", "Akkaraipattu", "Addalaichenai", "Island-wide", "Ampara"][index % 5]);
    addIfField("service", createData, "availabilityNote", "Available by booking after confirmation.");
    addIfField("service", createData, "estimatedDuration", ["2 hours", "1 day", "3 days", "1 week"][index % 4]);
    addIfField("service", createData, "minNoticeHours", [6, 12, 24, 48][index % 4]);
    addIfField("service", createData, "bookingMode", index % 2 === 0 ? "quote_only" : "direct_booking");
    addIfField("service", createData, "serviceTags", tags);

    const updateData = { ...createData };
    delete updateData.slug;
    const service = await prisma.service.upsert({ where: { slug }, update: updateData, create: createData });
    services.push(service);

    for (let imageIndex = 0; imageIndex < 3; imageIndex += 1) {
      await findOrCreate(
        "serviceImage",
        { serviceId: service.id, sortOrder: imageIndex },
        {
          serviceId: service.id,
          url: `${serviceImages[(index + imageIndex) % serviceImages.length]}&sig=${index}-${imageIndex}`,
          alt: `${title} image ${imageIndex + 1}`,
          sortOrder: imageIndex,
        },
        { url: `${serviceImages[(index + imageIndex) % serviceImages.length]}&sig=${index}-${imageIndex}`, alt: `${title} image ${imageIndex + 1}` },
      );
    }
  }
  return services;
}

async function seedRequests({ customers }) {
  const requestTypes = ["birthday_package", "used_phone", "home_food", "wedding_service", "delivery", "website", "editing", "gift_box", "vehicle", "computer_work"];
  const requests = [];
  for (let index = 0; index < 10; index += 1) {
    const customer = customers[index % customers.length];
    requests.push(await findOrCreate(
      "customRequest",
      { phone: customer.phone, requestType: requestTypes[index] },
      {
        userId: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        requestType: requestTypes[index],
        budget: 2500 + index * 3000,
        location: ["Kalmunai", "Akkaraipattu", "Addalaichenai", "Oluvil", "Ampara"][index % 5],
        message: `Demo request ${index + 1}: Customer needs support for ${requestTypes[index].replaceAll("_", " ")}.`,
        status: ["new", "pending", "quoted", "accepted", "in_progress", "completed", "cancelled", "new", "quoted", "pending"][index],
        quotation: index % 3 === 0 ? 5000 + index * 1000 : null,
        adminNote: index % 2 === 0 ? "Demo admin follow-up note." : null,
      },
      { status: ["new", "pending", "quoted", "accepted", "in_progress", "completed", "cancelled", "new", "quoted", "pending"][index] },
    ));
  }
  return requests;
}

async function seedOrders({ customers, products, deliveryUsers }) {
  const orders = [];
  for (let index = 0; index < 10; index += 1) {
    const customer = customers[index % customers.length];
    const product = products[index % products.length];
    const quantity = (index % 3) + 1;
    const price = Number(product.price);
    const subtotal = price * quantity;
    const deliveryFee = index % 2 === 0 ? 350 : 500;
    const total = subtotal + deliveryFee;
    const orderNo = `SS-ORDER-${String(index + 1).padStart(4, "0")}`;

    const order = await prisma.order.upsert({
      where: { orderNo },
      update: {
        customerId: customer.id,
        status: ["pending", "confirmed", "processing", "ready", "delivered", "cancelled", "confirmed", "processing", "ready", "delivered"][index],
        paymentStatus: ["unpaid", "pending", "paid", "paid", "paid", "refunded", "pending", "paid", "paid", "paid"][index],
        subtotalAmount: subtotal,
        discountAmount: index % 4 === 0 ? 500 : 0,
        couponCode: index % 4 === 0 ? "WELCOME10" : null,
        totalAmount: total,
        deliveryName: customer.name,
        deliveryPhone: customer.phone,
        deliveryAddress: `${index + 10}, Demo Street, ${["Kalmunai", "Akkaraipattu", "Addalaichenai", "Oluvil", "Ampara"][index % 5]}`,
        deliveryStatus: ["not_assigned", "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled", "assigned", "picked_up", "out_for_delivery", "delivered"][index],
        deliveryPartnerId: deliveryUsers[index % deliveryUsers.length]?.id || null,
        deliveryFee,
        courierName: "SmartSell Delivery",
        trackingNumber: `TRK-DEMO-${String(index + 1).padStart(4, "0")}`,
        deliveryNote: "Demo delivery note for testing.",
        estimatedDelivery: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
        deliveredAt: index === 4 || index === 9 ? new Date() : null,
      },
      create: {
        orderNo,
        customerId: customer.id,
        status: ["pending", "confirmed", "processing", "ready", "delivered", "cancelled", "confirmed", "processing", "ready", "delivered"][index],
        paymentStatus: ["unpaid", "pending", "paid", "paid", "paid", "refunded", "pending", "paid", "paid", "paid"][index],
        subtotalAmount: subtotal,
        discountAmount: index % 4 === 0 ? 500 : 0,
        couponCode: index % 4 === 0 ? "WELCOME10" : null,
        totalAmount: total,
        deliveryName: customer.name,
        deliveryPhone: customer.phone,
        deliveryAddress: `${index + 10}, Demo Street, ${["Kalmunai", "Akkaraipattu", "Addalaichenai", "Oluvil", "Ampara"][index % 5]}`,
        deliveryStatus: ["not_assigned", "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled", "assigned", "picked_up", "out_for_delivery", "delivered"][index],
        deliveryPartnerId: deliveryUsers[index % deliveryUsers.length]?.id || null,
        deliveryAssignedAt: new Date(),
        deliveryFee,
        courierName: "SmartSell Delivery",
        trackingNumber: `TRK-DEMO-${String(index + 1).padStart(4, "0")}`,
        deliveryNote: "Demo delivery note for testing.",
        estimatedDelivery: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
        deliveredAt: index === 4 || index === 9 ? new Date() : null,
      },
    });
    orders.push(order);

    await findOrCreate(
      "orderItem",
      { orderId: order.id, productId: product.id },
      { orderId: order.id, productId: product.id, name: product.name, quantity, price },
      { name: product.name, quantity, price },
    );

    await findOrCreate(
      "payment",
      { orderId: order.id, reference: `PAY-DEMO-${String(index + 1).padStart(4, "0")}` },
      {
        orderId: order.id,
        amount: total,
        method: ["cod", "bank_transfer", "card", "cod"][index % 4],
        status: ["pending", "pending", "paid", "paid", "paid", "refunded", "pending", "paid", "paid", "paid"][index],
        reference: `PAY-DEMO-${String(index + 1).padStart(4, "0")}`,
      },
      { amount: total, status: ["pending", "pending", "paid", "paid", "paid", "refunded", "pending", "paid", "paid", "paid"][index] },
    );
  }
  return orders;
}

async function seedOffersReviewsWishlist({ customers, products, services, sellerUsers }) {
  for (let index = 0; index < 10; index += 1) {
    const customer = customers[index % customers.length];
    const product = products[index % products.length];
    const service = services[index % services.length];
    await prisma.productOffer.upsert({
      where: { offerNo: `SS-OFFER-${String(index + 1).padStart(4, "0")}` },
      update: {
        productId: product.id,
        buyerId: customer.id,
        sellerId: sellerUsers[index % sellerUsers.length]?.id || null,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        offeredAmount: Math.max(500, Number(product.price) - 1000 - index * 100),
        status: ["pending", "accepted", "rejected", "countered", "expired", "pending", "accepted", "pending", "rejected", "countered"][index],
      },
      create: {
        offerNo: `SS-OFFER-${String(index + 1).padStart(4, "0")}`,
        productId: product.id,
        buyerId: customer.id,
        sellerId: sellerUsers[index % sellerUsers.length]?.id || null,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        offeredAmount: Math.max(500, Number(product.price) - 1000 - index * 100),
        counterAmount: index % 3 === 0 ? Number(product.price) - 500 : null,
        message: "Can you give me a better price for this demo item?",
        sellerNote: index % 2 === 0 ? "Demo seller response." : null,
        status: ["pending", "accepted", "rejected", "countered", "expired", "pending", "accepted", "pending", "rejected", "countered"][index],
        expiresAt: new Date(Date.now() + (index + 3) * 24 * 60 * 60 * 1000),
      },
    });

    await findOrCreate(
      "review",
      { userId: customer.id, productId: product.id },
      {
        userId: customer.id,
        productId: product.id,
        rating: (index % 5) + 1,
        comment: `Demo product review ${index + 1}: Useful item and good communication.`,
        status: index < 8 ? "approved" : "pending",
      },
      { rating: (index % 5) + 1, status: index < 8 ? "approved" : "pending" },
    );

    await findOrCreate(
      "review",
      { userId: customer.id, serviceId: service.id },
      {
        userId: customer.id,
        serviceId: service.id,
        rating: ((index + 2) % 5) + 1,
        comment: `Demo service review ${index + 1}: Good service and fast response.`,
        status: index < 8 ? "approved" : "pending",
      },
      { rating: ((index + 2) % 5) + 1, status: index < 8 ? "approved" : "pending" },
    );

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: customer.id, productId: product.id } },
      update: {},
      create: { userId: customer.id, productId: product.id },
    });
  }
}

async function seedFinance({ orders, products, sellerUsers }) {
  if (!modelExists("commission")) return;
  const orderItems = await prisma.orderItem.findMany({ where: { orderId: { in: orders.map((order) => order.id) } }, include: { order: true } });
  for (let index = 0; index < Math.min(10, orderItems.length); index += 1) {
    const item = orderItems[index];
    const gross = Number(item.price) * item.quantity;
    const commissionRate = 10;
    const commissionAmount = gross * 0.1;
    await prisma.commission.upsert({
      where: { orderItemId: item.id },
      update: {
        sellerId: sellerUsers[index % sellerUsers.length].id,
        orderId: item.orderId,
        productId: item.productId,
        grossAmount: gross,
        commissionRate,
        commissionAmount,
        sellerAmount: gross - commissionAmount,
        status: ["available", "pending", "paid", "available", "pending"][index % 5],
      },
      create: {
        sellerId: sellerUsers[index % sellerUsers.length].id,
        orderId: item.orderId,
        orderItemId: item.id,
        productId: item.productId,
        grossAmount: gross,
        commissionRate,
        commissionAmount,
        sellerAmount: gross - commissionAmount,
        status: ["available", "pending", "paid", "available", "pending"][index % 5],
      },
    });
  }

  if (modelExists("payoutRequest")) {
    for (let index = 0; index < 10; index += 1) {
      await findOrCreate(
        "payoutRequest",
        { sellerId: sellerUsers[index % sellerUsers.length].id, amount: 2500 + index * 750 },
        {
          sellerId: sellerUsers[index % sellerUsers.length].id,
          amount: 2500 + index * 750,
          method: ["bank_transfer", "cash", "ez_cash"][index % 3],
          accountDetails: `Demo Bank Account ${index + 1}`,
          note: `Demo payout request ${index + 1}`,
          adminNote: index % 2 === 0 ? "Demo admin payout note." : null,
          status: ["pending", "approved", "paid", "rejected", "pending"][index % 5],
          processedAt: index % 3 === 0 ? new Date() : null,
        },
        { status: ["pending", "approved", "paid", "rejected", "pending"][index % 5] },
      );
    }
  }
}

async function seedCommunicationSupport({ customers, sellerUsers, admin, orders }) {
  for (let index = 0; index < 10; index += 1) {
    const user = customers[index % customers.length];
    await findOrCreate(
      "notification",
      { userId: user.id, title: `Demo notification ${index + 1}` },
      {
        userId: user.id,
        title: `Demo notification ${index + 1}`,
        message: `This is demo notification ${index + 1} for SmartSell testing.`,
        type: ["order", "payment", "delivery", "offer", "support"][index % 5],
        link: ["/orders", "/notifications", "/delivery", "/inbox", "/support"][index % 5],
        isRead: index % 2 === 0,
      },
      { isRead: index % 2 === 0 },
    );

    const ticket = await prisma.supportTicket.upsert({
      where: { ticketNo: `SS-TICKET-${String(index + 1).padStart(4, "0")}` },
      update: {
        userId: user.id,
        orderId: orders[index % orders.length]?.id,
        subject: `Demo support issue ${index + 1}`,
        issueType: ["order", "payment", "delivery", "refund", "general"][index % 5],
        priority: ["low", "normal", "high", "urgent"][index % 4],
        status: ["open", "in_progress", "waiting_customer", "resolved", "closed"][index % 5],
        customerMessage: `Customer demo issue message ${index + 1}.`,
        assignedAdminId: admin.id,
      },
      create: {
        ticketNo: `SS-TICKET-${String(index + 1).padStart(4, "0")}`,
        userId: user.id,
        orderId: orders[index % orders.length]?.id,
        subject: `Demo support issue ${index + 1}`,
        issueType: ["order", "payment", "delivery", "refund", "general"][index % 5],
        priority: ["low", "normal", "high", "urgent"][index % 4],
        status: ["open", "in_progress", "waiting_customer", "resolved", "closed"][index % 5],
        preferredResolution: index % 2 === 0 ? "refund" : "replacement",
        customerMessage: `Customer demo issue message ${index + 1}.`,
        adminNote: index % 2 === 0 ? "Demo admin support note." : null,
        refundAmount: index % 3 === 0 ? 750 : null,
        assignedAdminId: admin.id,
        resolvedAt: index % 4 === 0 ? new Date() : null,
      },
    });

    if (modelExists("messageThread")) {
      const thread = await findOrCreate(
        "messageThread",
        { subject: `Demo chat thread ${index + 1}` },
        {
          subject: `Demo chat thread ${index + 1}`,
          contextType: "support_ticket",
          contextId: ticket.id,
          customerId: user.id,
          businessUserId: sellerUsers[index % sellerUsers.length]?.id,
          adminId: admin.id,
          createdById: user.id,
        },
        { contextId: ticket.id, customerId: user.id, adminId: admin.id },
      );

      await findOrCreate(
        "message",
        { threadId: thread.id, body: `Customer message for demo thread ${index + 1}` },
        { threadId: thread.id, senderId: user.id, recipientId: admin.id, body: `Customer message for demo thread ${index + 1}` },
      );
      await findOrCreate(
        "message",
        { threadId: thread.id, body: `Admin reply for demo thread ${index + 1}` },
        { threadId: thread.id, senderId: admin.id, recipientId: user.id, body: `Admin reply for demo thread ${index + 1}`, readAt: index % 2 === 0 ? new Date() : null },
      );
    }
  }
}

async function seedCouponsSettingsAdminActions({ admin, superAdmin, products, services }) {
  const couponData = [
    ["WELCOME10", "Welcome 10%", "percentage", 10, 1000, 1500],
    ["SMART500", "Rs. 500 Off", "fixed", 500, 5000, 500],
    ["FOOD15", "Food Service Discount", "percentage", 15, 2500, 1000],
    ["GIFT20", "Gift Pack Offer", "percentage", 20, 3000, 2000],
    ["DELIVERYFREE", "Free Delivery Demo", "fixed", 350, 2000, 350],
    ["SHOP1000", "Shop Product Offer", "fixed", 1000, 10000, 1000],
    ["SERVICE5", "Service Booking 5%", "percentage", 5, 5000, 1000],
    ["NEWCUSTOMER", "New Customer Offer", "percentage", 12, 2000, 1200],
    ["WEDDING25", "Wedding Package Demo", "percentage", 25, 50000, 10000],
    ["EDITING10", "Editing Service Demo", "percentage", 10, 1000, 800],
  ];
  for (const [code, title, discountType, discountValue, minimumAmount, maxDiscount] of couponData) {
    await prisma.coupon.upsert({
      where: { code },
      update: { title, description: `${title} coupon for demo data.`, discountType, discountValue, minimumAmount, maxDiscount, usageLimit: 100, isActive: true },
      create: { code, title, description: `${title} coupon for demo data.`, discountType, discountValue, minimumAmount, maxDiscount, usageLimit: 100, isActive: true },
    });
  }

  const settings = [
    ["site.name", "general", "Site Name", "SmartSell"],
    ["site.currency", "general", "Currency", "LKR"],
    ["site.delivery_fee", "delivery", "Default Delivery Fee", 350],
    ["site.cod_enabled", "payments", "Cash on Delivery Enabled", true],
    ["site.bank_transfer_enabled", "payments", "Bank Transfer Enabled", true],
    ["site.review_moderation", "reviews", "Review Moderation", true],
    ["site.seller_approval", "seller", "Seller Approval Required", true],
    ["site.service_approval", "service", "Service Approval Required", true],
    ["site.low_stock_alert", "inventory", "Low Stock Alert", 5],
    ["site.support_email", "support", "Support Email", "support@smartsell.local"],
  ];
  for (const [key, group, label, value] of settings) {
    await ensurePlatformSetting(key, group, label, value, `Demo ${label} setting.`);
  }

  if (modelExists("adminAction")) {
    const actionTargets = [...products.slice(0, 5), ...services.slice(0, 5)];
    for (let index = 0; index < 10; index += 1) {
      await findOrCreate(
        "adminAction",
        { adminId: index % 2 === 0 ? admin.id : superAdmin.id, action: `demo_action_${index + 1}` },
        {
          adminId: index % 2 === 0 ? admin.id : superAdmin.id,
          action: `demo_action_${index + 1}`,
          targetType: index < 5 ? "product" : "service",
          targetId: actionTargets[index]?.id,
          note: `Demo admin action ${index + 1} for testing audit logs.`,
        },
      );
    }
  }
}

async function printCounts() {
  const models = [
    ["Users", "user"],
    ["Seller profiles", "sellerProfile"],
    ["Service provider profiles", "serviceProviderProfile"],
    ["Categories", "category"],
    ["Products", "product"],
    ["Product images", "productImage"],
    ["Product variants", "productVariant"],
    ["Stock movements", "stockMovement"],
    ["Services", "service"],
    ["Service images", "serviceImage"],
    ["Requests", "customRequest"],
    ["Orders", "order"],
    ["Order items", "orderItem"],
    ["Payments", "payment"],
    ["Offers", "productOffer"],
    ["Commissions", "commission"],
    ["Payout requests", "payoutRequest"],
    ["Reviews", "review"],
    ["Wishlist items", "wishlistItem"],
    ["Notifications", "notification"],
    ["Message threads", "messageThread"],
    ["Messages", "message"],
    ["Support tickets", "supportTicket"],
    ["Coupons", "coupon"],
    ["Admin actions", "adminAction"],
    ["Platform settings", "platformSetting"],
  ];

  console.log("\nSmartSell demo data counts:");
  for (const [label, model] of models) {
    if (modelExists(model)) {
      const count = await prisma[model].count();
      console.log(`- ${label}: ${count}`);
    }
  }
}

async function main() {
  const userGroups = await seedUsers();
  const profiles = await seedProfiles(userGroups);
  const categories = await seedCategories();
  const products = await seedProducts({ categories, ...profiles, sellerUsers: userGroups.sellerUsers, shopUsers: userGroups.shopUsers, admin: userGroups.admin });
  const services = await seedServices({ categories, providerProfiles: profiles.providerProfiles, providerUsers: userGroups.providerUsers });
  await seedRequests(userGroups);
  const orders = await seedOrders({ customers: userGroups.customers, products, deliveryUsers: userGroups.deliveryUsers });
  await seedOffersReviewsWishlist({ customers: userGroups.customers, products, services, sellerUsers: userGroups.sellerUsers });
  await seedFinance({ orders, products, sellerUsers: userGroups.sellerUsers });
  await seedCommunicationSupport({ customers: userGroups.customers, sellerUsers: userGroups.sellerUsers, admin: userGroups.admin, orders });
  await seedCouponsSettingsAdminActions({ admin: userGroups.admin, superAdmin: userGroups.superAdmin, products, services });
  await printCounts();

  console.log("\nSmartSell full demo seed completed.");
  console.log("Demo admin: admin@smartsell.local / Admin@12345");
  console.log("Demo customer: customer1@smartsell.local / Customer@12345");
  console.log("Demo seller: seller1@smartsell.local / Seller@12345");
  console.log("Demo shop: shop1@smartsell.local / Shop@12345");
  console.log("Demo provider: provider1@smartsell.local / Provider@12345");
  console.log("Demo delivery: delivery1@smartsell.local / Delivery@12345");
}

main()
  .catch((error) => {
    console.error("SmartSell demo seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
