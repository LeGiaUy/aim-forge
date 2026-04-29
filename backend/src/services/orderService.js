import { z } from "zod";
import { prisma } from "../config/db.js";

const createOrderSchema = z.object({
  address: z.string().min(5),
});

export const createOrder = async (userId, body) => {
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const { address } = parsed.data;

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { user_id: userId },
    include: {
      items: {
        include: { variant: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  // Lock prices from variants
  const total = cart.items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0
  );

  // Create order + order items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        user_id: userId,
        status: "PENDING",
        total,
        address,
        items: {
          create: cart.items.map((item) => ({
            variant_id: item.variant_id,
            price: item.variant.price, // locked price
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cart_id: cart.cart_id } });

    return newOrder;
  });

  return {
    order_id: order.order_id,
    status: order.status,
    total: Number(order.total),
    address: order.address,
    created_at: order.created_at,
    items: order.items.map((i) => ({
      variant_id: i.variant_id,
      quantity: i.quantity,
      price: Number(i.price),
    })),
  };
};

export const getOrders = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
              images: { where: { is_main: true }, take: 1 },
            },
          },
        },
      },
      payments: true,
    },
    orderBy: { created_at: "desc" },
  });

  return orders.map((o) => ({
    order_id: o.order_id,
    status: o.status,
    total: Number(o.total),
    address: o.address,
    created_at: o.created_at,
    payment_status: o.payments[0]?.status || "PENDING",
    items: o.items.map((i) => ({
      variant_id: i.variant_id,
      product_name: i.variant.product.name,
      image: i.variant.images[0]?.image_url || null,
      quantity: i.quantity,
      price: Number(i.price),
    })),
  }));
};

export const getOrderById = async (userId, orderId) => {
  const order = await prisma.order.findFirst({
    where: { order_id: Number(orderId), user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { brand: true } },
              images: { where: { is_main: true }, take: 1 },
              attributes: {
                include: { value: { include: { attribute: true } } },
              },
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  return {
    order_id: order.order_id,
    status: order.status,
    total: Number(order.total),
    address: order.address,
    created_at: order.created_at,
    payments: order.payments,
    items: order.items.map((i) => ({
      variant_id: i.variant_id,
      product_name: i.variant.product.name,
      brand: i.variant.product.brand?.name || null,
      image: i.variant.images[0]?.image_url || null,
      attributes: i.variant.attributes.map((va) => ({
        attribute: va.value.attribute.name,
        value: va.value.value,
      })),
      quantity: i.quantity,
      price: Number(i.price),
      subtotal: Number(i.price) * i.quantity,
    })),
  };
};
