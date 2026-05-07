import * as orderService from "../services/orderService.js";
import { sendSuccess } from "../utils/response.js";

export const createOrder = async (req, res, next) => {
  try {
    const data = await orderService.createOrder(req.user.user_id, req.body);
    return sendSuccess(res, data, "Order created", 201);
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const data = await orderService.getOrders(req.user.user_id, req.query);
    return sendSuccess(res, data, "Orders retrieved");
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const data = await orderService.getOrderById(req.user.user_id, req.params.id);
    return sendSuccess(res, data, "Order retrieved");
  } catch (err) {
    next(err);
  }
};
