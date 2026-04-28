import * as attributeService from "../services/attributeService.js";
import { sendSuccess } from "../utils/response.js";

export const getAttributes = async (req, res, next) => {
  try {
    const { category_id } = req.query;
    const data = await attributeService.getAttributes(category_id);
    return sendSuccess(res, data, "Attributes retrieved");
  } catch (err) {
    next(err);
  }
};

export const createAttribute = async (req, res, next) => {
  try {
    const data = await attributeService.createAttribute(req.body || {});
    return sendSuccess(res, data, "Attribute created", 201);
  } catch (err) {
    next(err);
  }
};

export const updateAttribute = async (req, res, next) => {
  try {
    const existing = await attributeService.getAttributeById(req.params.id);
    if (!existing) {
      const err = new Error("Attribute not found");
      err.status = 404;
      throw err;
    }

    const data = await attributeService.updateAttribute(req.params.id, req.body || {});
    return sendSuccess(res, data, "Attribute updated");
  } catch (err) {
    next(err);
  }
};

export const deleteAttribute = async (req, res, next) => {
  try {
    const existing = await attributeService.getAttributeById(req.params.id);
    if (!existing) {
      const err = new Error("Attribute not found");
      err.status = 404;
      throw err;
    }

    await attributeService.deleteAttribute(req.params.id);
    return sendSuccess(res, null, "Attribute deleted");
  } catch (err) {
    next(err);
  }
};
