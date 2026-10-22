import * as periods from "../services/period.service.js";
export const open = async (req, res) =>
  res
    .status(201)
    .json(await periods.openPeriod({ input: req.body, userId: req.user.id }));
export const close = async (req, res) =>
  res.json(
    await periods.closePeriod({ recordId: req.params.id, userId: req.user.id }),
  );
export const reopen = async (req, res) =>
  res.json(
    await periods.reopenPeriod({
      recordId: req.params.id,
      input: req.body,
      userId: req.user.id,
    }),
  );
