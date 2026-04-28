import * as categoryService from "../services/categoryService.js";
import { sendSuccess } from "../utils/response.js";

export const getCategories = async (req, res, next) => {
  try {
    const data = await categoryService.getCategories();
    return sendSuccess(res, data, "Categories retrieved");
  } catch (err) {
    next(err);
  }
};
