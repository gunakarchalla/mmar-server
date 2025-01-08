import { Router } from "express";
import UsersController from "../../controllers/meta/Users_controller";

const loginRouter = Router();

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
  #swagger.summary = "Handle user sign-in or sign-up"
  #swagger.requestBody = {
    "description": "User credentials or registration data",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "submit": {
              "type": "string",
              "enum": ["SignIn", "SignUp"],
              "description": "Indicates whether to sign in or sign up"
            },
          },
          "required": ["submit"] 
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "Successful sign-in or sign-up",
    "content": {
      "application/json": {
        "schema": {
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid credentials or registration data",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/", 
  (req, res, next) => {
    const submit = req.body.submit;
    if (submit === "SignIn") {
      UsersController.signin_user(req, res, next);
    } else if (submit === "SignUp") {
      UsersController.post_user(req, res, next);
    }
  }
);

loginRouter.post(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Sign up a new user"
  #swagger.requestBody = {
    "description": "New user registration data",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/User" 
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "Successful sign-up",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/User" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid registration data",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/signup", 
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
            "username": {
              "type": "string"
            },
            "password": {
              "type": "string"
            }
          },
          "required": ["username", "password"] 
        }
      }
    },
    "required":   
 true
  }
  #swagger.responses[200] = {
    "description": "Successful sign-in",
    "content": {
      "application/json": {
        "schema": {
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid credentials",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/signin", 
  UsersController.signin_user
);

loginRouter.get(
  /*
  #swagger.tags = ["Login"]
  #swagger.summary = "Sign out the current user"
  #swagger.responses[200] = {
    "description": "Successful sign-out" 
  }
  */
  "/signout", 
  UsersController.signout_user
);

export default loginRouter;
