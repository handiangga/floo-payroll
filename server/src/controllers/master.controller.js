import { Worker, Model, Period } from "../db.js";
import { id, workerSchema, modelSchema } from "../validators/schemas.js";
import * as master from "../services/master.service.js";
export const bootstrap = async (req, res) =>
  res.json({
    workers: await Worker.findAll({ order: [["name", "ASC"]] }),
    models: await Model.findAll({ order: [["name", "ASC"]] }),
    periods: await Period.findAll({ order: [["date", "DESC"]] }),
  });
export function masterController(Entity, schema, resource) {
  return {
    create: async (req, res) =>
      res
        .status(201)
        .json(
          await master.create(
            Entity,
            schema.parse(req.body),
            req.user.id,
            resource,
          ),
        ),
    update: async (req, res) =>
      res.json(
        await master.update(
          Entity,
          id.parse(req.params.id),
          schema.parse(req.body),
          req.user.id,
          resource,
        ),
      ),
    remove: async (req, res) =>
      res.json(
        await master.remove(
          Entity,
          id.parse(req.params.id),
          req.user.id,
          resource,
        ),
      ),
  };
}
export const workers = masterController(Worker, workerSchema, "workers");
export const models = masterController(Model, modelSchema, "models");
