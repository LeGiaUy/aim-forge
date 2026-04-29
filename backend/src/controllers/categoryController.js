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

export const createCategory = async (req, res, next) => {
  try {
    const data = await categoryService.createCategory(req.body || {});
    return sendSuccess(res, data, "Category created", 201);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const existing = await categoryService.getCategoryById(req.params.id);
    if (!existing) {
      const err = new Error("Category not found");
      err.status = 404;
      throw err;
    }

    const data = await categoryService.updateCategory(
      req.params.id,
      req.body || {}
    );
    return sendSuccess(res, data, "Category updated");
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const existing = await categoryService.getCategoryById(req.params.id);
    if (!existing) {
      const err = new Error("Category not found");
      err.status = 404;
      throw err;
    }

    await categoryService.deleteCategory(req.params.id);
    return sendSuccess(res, null, "Category deleted");
  } catch (err) {
    next(err);
  }
};
