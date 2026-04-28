import * as brandService from "../services/brandService.js";
import { sendSuccess } from "../utils/response.js";

export const getBrands = async (req, res, next) => {
  try {
    const data = await brandService.getBrands();
    return sendSuccess(res, data, "Brands retrieved");
  } catch (err) {
    next(err);
  }
};
