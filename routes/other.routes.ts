import { Router } from "express";
import { authenticate_token } from "../data/services/middleware/auth.middleware";

const otherRouter = Router();

otherRouter.get("/", authenticate_token, function (req, res) {
  res.render("home", { username: req.body.tokendata.username });
});

//test endpoint to check if the server is running
otherRouter.get("/test", function (req, res) {
  res.send("Server is running");
});

export default otherRouter;
