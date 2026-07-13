import { prisma } from "../config/prisma.js";
import { serializeProduct } from "./marketplace.service.js";

const wishlistInclude = {
  product: {
    include: {
      category: true,
      seller: true,
      createdBy: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { status: "approved" }, select: { rating: true, status: true } },
    },
  },
};

export async function listWishlist(user) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: wishlistInclude,
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    product: serializeProduct(item.product),
  }));
}

export async function toggleWishlist(productId, user) {
  const cleanProductId = String(productId || "");
  if (!cleanProductId) throw new Error("Product is required.");

  const product = await prisma.product.findFirst({ where: { id: cleanProductId, status: "approved" } });
  if (!product) throw new Error("Product was not found or is not approved yet.");

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: cleanProductId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { saved: false, item: null, wishlist: await listWishlist(user) };
  }

  const item = await prisma.wishlistItem.create({
    data: { userId: user.id, productId: cleanProductId },
    include: wishlistInclude,
  });

  return { saved: true, item: { id: item.id, createdAt: item.createdAt, product: serializeProduct(item.product) }, wishlist: await listWishlist(user) };
}

export async function removeWishlistItem(productId, user) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: String(productId || "") } },
  });

  if (existing) await prisma.wishlistItem.delete({ where: { id: existing.id } });
  return listWishlist(user);
}
