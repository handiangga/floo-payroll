import * as payroll from "../services/payroll.service.js";
export const list = async (req, res) =>
  res.json(await payroll.listPayrolls(req.params.id));
export const save = async (req, res) =>
  res.json(
    await payroll.savePayroll({
      recordId: req.params.id,
      input: req.body,
      userId: req.user.id,
    }),
  );
export const remove = async (req, res) =>
  res.json(
    await payroll.removePayroll({
      recordId: req.params.id,
      payrollId: req.params.payrollId,
      userId: req.user.id,
    }),
  );
