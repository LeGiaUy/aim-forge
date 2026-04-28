import * as authService from "../services/authService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(res, result, "Registered successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.user_id);
    return sendSuccess(res, user, "User profile");
  } catch (err) {
    next(err);
  }
};
