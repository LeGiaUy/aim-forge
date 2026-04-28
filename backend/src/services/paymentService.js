import { z } from "zod";
import { prisma } from "../config/db.js";

const createPaymentSchema = z.object({
  order_id: z.number().int().positive(),
  method: z.enum(["credit_card", "bank_transfer", "e_wallet", "cod"]),
});

export const createPayment = async (userId, body) => {
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const { order_id, method } = parsed.data;

  // Verify order belongs to user
  const order = await prisma.order.findFirst({
    where: { order_id, user_id: userId },
  });
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  // Check if payment already exists for this order
  const existing = await prisma.payment.findFirst({ where: { order_id } });
  if (existing) {
    const err = new Error("Payment already exists for this order");
    err.status = 409;
    throw err;
  }

  const payment = await prisma.payment.create({
    data: { order_id, method, status: "pending" },
  });

  return payment;
};

export const confirmPayment = async (paymentId, userId) => {
  const payment = await prisma.payment.findUnique({
    where: { payment_id: Number(paymentId) },
    include: { order: true },
  });

  if (!payment) {
    const err = new Error("Payment not found");
    err.status = 404;
    throw err;
  }

  if (payment.order.user_id !== userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  if (payment.status === "paid") {
    const err = new Error("Payment already confirmed");
    err.status = 409;
    throw err;
  }

  // Update payment + order status in transaction
  const [updatedPayment] = await prisma.$transaction([
    prisma.payment.update({
      where: { payment_id: Number(paymentId) },
      data: { status: "paid", paid_at: new Date() },
    }),
    prisma.order.update({
      where: { order_id: payment.order_id },
      data: { status: "paid" },
    }),
  ]);

  return updatedPayment;
};
