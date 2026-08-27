import { Router } from "express";
import rateLimit from "express-rate-limit";
import UsersController from "../../controllers/meta/Users_controller";
import {
  authenticate_token,
  require_administrator,
} from "../../data/services/middleware/auth.middleware";
import { environment } from "../../data/services/environment";

const loginRouter = Router();

/**
 * @description - The unauthenticated endpoints that test a password: signing in,
 * and changing one's own password by supplying the current one. Every attempt
 * costs a bcrypt comparison, which is deliberately expensive, so without a limit
 * they serve as both a password oracle and a cheap way to saturate the CPU.
 * Failed attempts are what count; a client that succeeds is not the problem.
 *
 * A single instance, so that the endpoints share one bucket: they guess the same
 * secret, and an allowance each would simply double the number of tries.
 */
const credential_limiter = rateLimit({
  windowMs: environment.login_rate_limit_window_ms,
  limit: environment.login_rate_limit,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
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
  credential_limiter,
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
  credential_limiter,
  UsersController.signin_user
);

loginRouter.post(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Change one's own password, authorised by the current one"
  #swagger.description = "Reachable without a token: it is offered in the sign in dialog, where nobody is signed in yet. Knowing the current password is what authorises the change, and the endpoint is rate limited alongside sign in."
  #swagger.requestBody = {
    "description": "The login, the password in force, and the one to replace it with",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "username": { "type": "string" },
            "current_password": { "type": "string" },
            "new_password": { "type": "string" }
          },
          "required": ["username", "current_password", "new_password"]
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "The user, which never carries the password",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/User" }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "A field is missing, or the new password is too long to hash",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/Error" }
      }
    }
  }
  #swagger.responses[401] = {
    "description": "Wrong username or current password",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/Error" }
      }
    }
  }
  #swagger.responses[429] = {
    "description": "Too many failed attempts"
  }
  */
  "/password",
  credential_limiter,
  UsersController.change_own_password
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
