import * as paymentService from "../services/paymentService.js";
import { sendSuccess } from "../utils/response.js";

export const createPayment = async (req, res, next) => {
  try {
    const data = await paymentService.createPayment(req.user.user_id, req.body);
    return sendSuccess(res, data, "Payment created", 201);
  } catch (err) {
    next(err);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const data = await paymentService.confirmPayment(req.params.id, req.user.user_id);
    return sendSuccess(res, data, "Payment confirmed");
  } catch (err) {
    next(err);
  }
};
