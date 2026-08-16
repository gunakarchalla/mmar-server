import { Router } from "express";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";
import Users_controller from "../../controllers/meta/Users_controller";
import User_lookup_controller from "../../controllers/meta/User_lookup_controller";

const usersRouter: Router = Router();

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
