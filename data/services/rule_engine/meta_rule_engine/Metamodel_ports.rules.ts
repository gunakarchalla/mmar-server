import { RequestHandler } from "express";

export const verif_port_body: RequestHandler = async (req, res, next) => {
  //TODO implement the rule here
  // eslint-disable-next-line no-constant-condition
  if (true) {
    next();
  } else {
    res.status(400).send("Invalid payload provided !");
  }
};
