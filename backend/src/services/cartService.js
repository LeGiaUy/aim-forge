import { z } from "zod";
import { prisma } from "../config/db.js";
import { getProductPricingPayload } from "./pricing.service.js";

const addItemSchema = z.object({
  variant_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const updateItemSchema = z.object({
  variant_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const removeItemSchema = z.object({
  variant_id: z.number().int().positive(),
});

// Get or create cart for user
const getOrCreateCart = async (userId) => {
  return prisma.cart.upsert({
    where: { user_id: userId },
    create: { user_id: userId },
    update: {},
  });
};

export const getCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { brand: true } },
              images: { where: { is_main: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!cart) return { cart_id: null, items: [], total: 0 };

  const items = cart.items.map((item) => {
    const vp = getProductPricingPayload({
      base_price: item.variant.product.price,
      discount_price: item.variant.product.discount_price,
      discount_start: item.variant.product.discount_start,
      discount_end: item.variant.product.discount_end
    });
    return {
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: vp.final_price,
      price_original: vp.price,
      final_price: vp.final_price,
      discount_price: vp.discount_price,
      discount_amount: vp.discount_amount,
      discount_percent: vp.discount_percent,
      subtotal: vp.final_price * item.quantity,
      product_name: item.variant.product.name,
      brand: item.variant.product.brand?.name || null,
      sku: item.variant.sku,
      image: item.variant.images[0]?.image_url || null,
    };
  });

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  return { cart_id: cart.cart_id, items, total };
};

export const addItem = async (userId, body) => {
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const { variant_id, quantity } = parsed.data;

  // Validate variant exists
  const variant = await prisma.productVariant.findUnique({ where: { variant_id } });
  if (!variant) {
    const err = new Error("Variant not found");
    err.status = 404;
    throw err;
  }

  const cart = await getOrCreateCart(userId);

  // Upsert cart item
  const existing = await prisma.cartItem.findUnique({
    where: { cart_id_variant_id: { cart_id: cart.cart_id, variant_id } },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { cart_id_variant_id: { cart_id: cart.cart_id, variant_id } },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cart_id: cart.cart_id, variant_id, quantity },
    });
  }

  return getCart(userId);
};

export const updateItem = async (userId, body) => {
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const { variant_id, quantity } = parsed.data;
  const cart = await getOrCreateCart(userId);

  const existing = await prisma.cartItem.findUnique({
    where: { cart_id_variant_id: { cart_id: cart.cart_id, variant_id } },
  });
  if (!existing) {
    const err = new Error("Item not in cart");
    err.status = 404;
    throw err;
  }

  await prisma.cartItem.update({
    where: { cart_id_variant_id: { cart_id: cart.cart_id, variant_id } },
    data: { quantity },
  });

  return getCart(userId);
};

export const removeItem = async (userId, body) => {
  const parsed = removeItemSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const { variant_id } = parsed.data;
  const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
  if (!cart) {
    const err = new Error("Cart not found");
    err.status = 404;
    throw err;
  }

  await prisma.cartItem.deleteMany({
    where: { cart_id: cart.cart_id, variant_id },
  });

  return getCart(userId);
};
