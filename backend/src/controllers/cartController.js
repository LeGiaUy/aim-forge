import * as cartService from "../services/cartService.js";
import { sendSuccess } from "../utils/response.js";

export const getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCart(req.user.user_id);
    return sendSuccess(res, data, "Cart retrieved");
  } catch (err) {
    next(err);
  }
};

export const addItem = async (req, res, next) => {
  try {
    const data = await cartService.addItem(req.user.user_id, req.body);
    return sendSuccess(res, data, "Item added to cart");
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const data = await cartService.updateItem(req.user.user_id, req.body);
    return sendSuccess(res, data, "Cart item updated");
  } catch (err) {
    next(err);
  }
};

export const removeItem = async (req, res, next) => {
  try {
    const data = await cartService.removeItem(req.user.user_id, req.body);
    return sendSuccess(res, data, "Item removed from cart");
  } catch (err) {
    next(err);
  }
};
