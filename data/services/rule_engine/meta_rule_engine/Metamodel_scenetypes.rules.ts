import { RequestHandler } from "express";

export const verif_scenetype_body: RequestHandler = async (req, res, next) => {
  //console.log("Middleware scenetype body checker");
  //TODO implement the rule here
  // eslint-disable-next-line no-constant-condition
  if (true) {
    //console.log(req.body);
    next();
  } else {
    res.status(400).send("Invalid payload provided !");
  }
};
