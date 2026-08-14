import { Router } from "express";
import rateLimit from "express-rate-limit";
import UsersController from "../../controllers/meta/Users_controller";
import {
  authenticate_token,
  require_administrator,
} from "../../data/services/middleware/auth.middleware";

const loginRouter = Router();

/**
 * @description - Sign in is the one unauthenticated endpoint that does real work:
 * every attempt costs a bcrypt comparison, which is deliberately expensive, so
 * without a limit it serves as both a password oracle and a cheap way to saturate
 * the CPU. Failed attempts are what count; a client signing in successfully is
 * not the problem.
 */
const signin_limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign in attempts. Try again later." },
});

// This route renders an EJS template, which might not be directly represented in Swagger
// You could consider adding a description if it's helpful for developers
loginRouter.get(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Render the login page"
  #swagger.responses[200] = {
    "description": "Successful rendering of the login page"
  }
  */
  "/",
  function (req, res) {
    res.render("login.ejs");
  }
);

loginRouter.post(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Sign in an existing user"
  #swagger.requestBody = {
    "description": "User credentials for sign-in",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "username": { "type": "string" },
            "password": { "type": "string" }
          },
          "required": ["username", "password"]
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "Successful sign-in, the body is the issued token"
  }
  #swagger.responses[401] = {
    "description": "Wrong username or password",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/Error" }
      }
    }
  }
  #swagger.responses[429] = {
    "description": "Too many failed sign-in attempts"
  }
  */
  "/",
  signin_limiter,
  UsersController.signin_user
);

loginRouter.post(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Create a user account. Administrators only."
  #swagger.requestBody = {
    "description": "New user registration data",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/User" }
      }
    },
    "required": true
  }
  #swagger.responses[201] = {
    "description": "The created user",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/User" }
      }
    }
  }
  #swagger.responses[401] = {
    "description": "No valid token supplied"
  }
  #swagger.responses[403] = {
    "description": "The caller is not an administrator"
  }
  */
  "/signup",
  authenticate_token,
  require_administrator,
  UsersController.post_user
);

loginRouter.post(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Sign in an existing user"
  #swagger.requestBody = {
    "description": "User credentials for sign-in",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "username": { "type": "string" },
            "password": { "type": "string" }
          },
          "required": ["username", "password"]
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "Successful sign-in, the body is the issued token"
  }
  #swagger.responses[401] = {
    "description": "Wrong username or password",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/Error" }
      }
    }
  }
  #swagger.responses[429] = {
    "description": "Too many failed sign-in attempts"
  }
  */
  "/signin",
  signin_limiter,
  UsersController.signin_user
);

loginRouter.get(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Sign out the current user"
  #swagger.responses[302] = {
    "description": "The authentication cookie is cleared and the caller is redirected"
  }
  */
  "/signout",
  UsersController.signout_user
);

export default loginRouter;
