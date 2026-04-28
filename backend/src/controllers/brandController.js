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

export const createBrand = async (req, res, next) => {
  try {
    const data = await brandService.createBrand(req.body || {});
    return sendSuccess(res, data, "Brand created", 201);
  } catch (err) {
    next(err);
  }
};

export const updateBrand = async (req, res, next) => {
  try {
    const existing = await brandService.getBrandById(req.params.id);
    if (!existing) {
      const err = new Error("Brand not found");
      err.status = 404;
      throw err;
    }

    const data = await brandService.updateBrand(req.params.id, req.body || {});
    return sendSuccess(res, data, "Brand updated");
  } catch (err) {
    next(err);
  }
};

export const deleteBrand = async (req, res, next) => {
  try {
    const existing = await brandService.getBrandById(req.params.id);
    if (!existing) {
      const err = new Error("Brand not found");
      err.status = 404;
      throw err;
    }

    await brandService.deleteBrand(req.params.id);
    return sendSuccess(res, null, "Brand deleted");
  } catch (err) {
    next(err);
  }
};
