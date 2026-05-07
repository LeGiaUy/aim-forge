import { z } from "zod";
import { prisma } from "../config/db.js";
import { getVariantSellPrice } from "./pricing.service.js";
import {
  buildVariantAttributesList,
  buildVariantDisplayName,
  deriveLegacyVariantColor,
  getMainGalleryImageUrl,
} from "./variantDisplay.service.js";

const build_active_discount_where = () => ({
  discount: {
    is_active: true,
    start_at: { lte: new Date() },
    OR: [{ end_at: null }, { end_at: { gte: new Date() } }]
  }
})

const build_variant_include_base = () => ({
  discount_variants: {
    where: build_active_discount_where(),
    include: { discount: true }
  },
  variant_option_values: {
    include: {
      option_value: {
        include: {
          option: true,
          images: { orderBy: { sort_order: "asc" } },
        },
      },
    },
  }
})

const get_active_global_discounts = async () => {
  return prisma.discount.findMany({
    where: {
      is_active: true,
      start_at: { lte: new Date() },
      OR: [{ end_at: null }, { end_at: { gte: new Date() } }],
      products: { none: {} },
      variants: { none: {} }
    },
    orderBy: { created_at: 'desc' }
  })
}

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

  const [cart, global_discounts] = await Promise.all([
    prisma.cart.findUnique({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  discount_products: {
                    where: build_active_discount_where(),
                    include: { discount: true }
                  }
                }
              },
              discount_variants: {
                where: build_active_discount_where(),
                include: { discount: true }
              }
            }
          },
        },
      },
    },
  }),
    get_active_global_discounts()
  ]);

  if (!cart || cart.items.length === 0) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  const total = cart.items.reduce((sum, item) => {
    const unit_final = getVariantSellPrice({
      ...item.variant,
      global_discounts
    });
    return sum + unit_final * item.quantity;
  }, 0);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        user_id: userId,
        status: "PENDING",
        total,
        address,
        items: {
          create: cart.items.map((item) => {
            const unit_final = getVariantSellPrice({
              ...item.variant,
              global_discounts
            });
            return {
              variant_id: item.variant_id,
              price: unit_final,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

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

const map_order_item_public = (i) => {
  const attrs = buildVariantAttributesList(i.variant)
  return {
    variant_id: i.variant_id,
    product_name: i.variant.product.name,
    variant_name: buildVariantDisplayName(i.variant),
    variant_color: deriveLegacyVariantColor(attrs),
    variant_sku: i.variant.sku || null,
    image: getMainGalleryImageUrl(i.variant),
    quantity: i.quantity,
    price: Number(i.price),
  }
}

export const getOrders = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { user_id: userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  discount_products: {
                    where: build_active_discount_where(),
                    include: { discount: true }
                  }
                }
              },
              ...build_variant_include_base()
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
    items: o.items.map(map_order_item_public),
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
              product: {
                include: {
                  brand: true,
                  discount_products: {
                    where: build_active_discount_where(),
                    include: { discount: true }
                  }
                }
              },
              ...build_variant_include_base(),
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
    items: order.items.map((i) => {
      const attrs = buildVariantAttributesList(i.variant)
      return {
        variant_id: i.variant_id,
        product_name: i.variant.product.name,
        variant_name: buildVariantDisplayName(i.variant),
        variant_color: deriveLegacyVariantColor(attrs),
        variant_sku: i.variant.sku || null,
        brand: i.variant.product.brand?.name || null,
        image: getMainGalleryImageUrl(i.variant),
        attributes: attrs,
        quantity: i.quantity,
        price: Number(i.price),
        subtotal: Number(i.price) * i.quantity,
      }
    }),
  };
};
