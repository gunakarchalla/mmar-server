import { Router } from "express";
import {
  authenticate_token,
  require_administrator,
} from "../../data/services/middleware/auth.middleware";
import Users_controller from "../../controllers/meta/Users_controller";
import User_lookup_controller from "../../controllers/meta/User_lookup_controller";
import { validate_uuid_params } from "../../data/services/middleware/uuid_params.middleware";

const usersRouter: Router = Router();

// A malformed uuid is a bad request, not a database error: without this the
// value reaches PostgreSQL, fails to cast, and comes back to the caller as a 500.
validate_uuid_params(usersRouter);

usersRouter.get(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Get a user by username"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/User" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid username supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "User not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/username/:username",
  authenticate_token,
  Users_controller.get_user_by_username,
);

usersRouter.get(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Get a user by UUID"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/User" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "User not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/uuid/:uuid",
  authenticate_token,
  Users_controller.get_user_by_uuid,
);

usersRouter.get(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Get all users"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array", 
          "items": {
            "$ref": "#/components/schemas/User"   
 
          }
        }
      }
    }
  }
  */
  "/", 
  authenticate_token, 
  Users_controller.get_all_users
);

usersRouter.get(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Look up a user by exact username (returns uuid, username, displayname only)"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "uuid": { "type": "string" },
            "username": { "type": "string" },
            "displayname": { "type": "string" }
          }
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "User not found",
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/Error" }
      }
    }
  }
  */
  "/byUsername/:username",
  authenticate_token,
  User_lookup_controller.get_user_by_username,
);

usersRouter.delete(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Delete a user by UUID"
  #swagger.responses[204] = {
    "description": "User deleted successfully" 
  }
  #swagger.responses[400] = {
    "description": "Invalid UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/:uuid",
  authenticate_token,
  Users_controller.delete_user_by_uuid,
);

usersRouter.patch(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Update a user by UUID"
  #swagger.requestBody = {
    "description": "Updated user object",
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
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/User" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid user supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "User not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/:uuid",
  authenticate_token,
  Users_controller.patch_user_by_uuid,
);

usersRouter.post(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Set the password of a user. Administrators only."
  #swagger.requestBody = {
    "description": "The new password",
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "password": { "type": "string" }
          },
          "required": ["password"]
        }
      }
    },
    "required": true
  }
  #swagger.responses[200] = {
    "description": "The user, which never carries the password",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/User"
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "No password supplied, or one too long to hash",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[401] = {
    "description": "No valid token supplied"
  }
  #swagger.responses[403] = {
    "description": "The caller is not an administrator",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "User not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/:uuid/password",
  authenticate_token,
  require_administrator,
  Users_controller.set_user_password,
);

usersRouter.get(
  /*
  #swagger.tags = ["Users"]
  #swagger.summary = "Get users by user group UUID"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/User" 
          }
        }
      }
    }
  }
  #swagger.responses[400]   
 = {
    "description": "Invalid UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "User group not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/usergroups/:uuid",
  authenticate_token,
  Users_controller.get_users_by_usergroup_uuid,
);

export default usersRouter;
