import * as productService from "../services/productService.js";
import { sendSuccess } from "../utils/response.js";

export const getProducts = async (req, res, next) => {
  try {
    const { category_id, brand_id, min_price, max_price, search, page, limit } = req.query;
    const data = await productService.getProducts({ category_id, brand_id, min_price, max_price, search, page, limit });
    return sendSuccess(res, data, "Products retrieved");
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const data = await productService.getProductById(req.params.id);
    return sendSuccess(res, data, "Product retrieved");
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const data = await productService.createProduct(req.body);
    return sendSuccess(res, data, "Product created", 201);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const data = await productService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, data, "Product updated");
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    return sendSuccess(res, null, "Product deleted");
  } catch (err) {
    next(err);
  }
};
