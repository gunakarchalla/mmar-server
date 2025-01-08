import {Router} from "express";
import UsergroupsController from "../../controllers/meta/Usergroups.controller";
import {authenticate_token} from "../../data/services/middleware/auth.middleware";

const usergroupRouter = Router();

// get user group
usergroupRouter.get(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Get all user groups"
    #swagger.responses[200] = {
      "description": "Successful operation",
      "content": {
        "application/json": {
          "schema": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Usergroup"   
   
            }
          }
        }
      }
    }
    */
    "/",
    authenticate_token,
    UsergroupsController.get_usergroups,
  );
  
  usergroupRouter.post(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Create a new user group"
    #swagger.requestBody = {
      "description": "New user group object",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Usergroup" 
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
            "$ref": "#/components/schemas/Usergroup" 
          }
        }
      }
    }
    #swagger.responses[400] = {
      "description": "Invalid user group supplied",
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
    authenticate_token,
    UsergroupsController.post_usergroup,
  );
  
  usergroupRouter.get(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Get user groups for a user by UUID"
    #swagger.responses[200] = {
      "description": "Successful operation",
      "content": {
        "application/json": {
          "schema": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Usergroup"   
   
            }
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
    "/users/:uuid",
    authenticate_token,
    UsergroupsController.get_usergroup_for_user_uuid,
  );
  
  usergroupRouter.delete(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Remove a user from a user group"
    #swagger.responses[204] = {
      "description": "User removed from user group successfully" 
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
      "description": "User or user group not found",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Error" 
          }
        }
      }
    }
    */
    "/:groupUuid/users/:userUuid",
    authenticate_token,
    UsergroupsController.delete_usergroup_for_user_uuid,
  );
  
  usergroupRouter.post(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Add a user to a user group"
    #swagger.responses[200] = {
      "description": "Successful operation" 
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
      "description": "User or user group not found",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Error" 
          }
        }
      }
    }
    */
    "/:groupUuid/users/:userUuid",
    authenticate_token,
    UsergroupsController.add_usergroup_for_user_uuid,
  );

// ... (previous code) ...

usergroupRouter.post(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Add a meta object to a user group"
    #swagger.responses[200] = {
      "description": "Successful operation" 
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
      "description": "User group or meta object not found",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Error" 
          }
        }
      }
    }
    */
    "/:uuid/metaObjects/:uuidMetaObject",
    authenticate_token,
    UsergroupsController.add_metaobject_to_usergroup,
  );
  
  usergroupRouter.delete(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Delete a meta object from a user group"
    #swagger.responses[204] = {
      "description": "Meta object deleted from user group successfully" 
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
      "description": "User group or meta object not found",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Error" 
          }
        }
      }
    }
    */
    "/:uuid/metaObjects/:uuidMetaObject",
    authenticate_token,
    UsergroupsController.delete_metaobject_from_usergroup,
  );
  
  usergroupRouter.post(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Add an instance object to a user group"
    #swagger.responses[200] = {
      "description": "Successful operation" 
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
      "description": "User group or instance object not found",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Error" 
          }
        }
      }
    }
    */
    "/:uuid/instanceObjects/:uuidInstanceObject",
    authenticate_token,
    UsergroupsController.add_instanceobject_to_usergroup,
  );
  
  usergroupRouter.delete(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Delete an instance object from a user group"
    #swagger.responses[204] = {
      "description": "Instance object deleted from user group successfully" 
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
      "description": "User group or instance object not found",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Error" 
          }
        }
      }
    }
    */
    "/:uuid/instanceObjects/:uuidInstanceObject",
    authenticate_token,
    UsergroupsController.delete_metaobject_from_usergroup, 
  );

  usergroupRouter.get(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Get a user group by UUID"
    #swagger.responses[200] = {
      "description": "Successful operation",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Usergroup" 
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
    "/:uuid",
    authenticate_token,
    UsergroupsController.get_usergroup_by_uuid,
  );
  
  usergroupRouter.patch(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Update a user group by UUID"
    #swagger.requestBody = {
      "description": "Updated user group object",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Usergroup" 
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
            "$ref": "#/components/schemas/Usergroup" 
          }
        }
      }
    }
    #swagger.responses[400] = {
      "description": "Invalid user group supplied",
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
    "/:uuid",
    authenticate_token,
    UsergroupsController.patch_usergroup,
  );
  
  usergroupRouter.post(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Create a new user group"
    #swagger.responses[200] = {
      "description": "Successful operation",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Usergroup" 
          }
        }
      }
    }
    #swagger.responses[400] = {
      "description": "Invalid user group supplied",
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
    UsergroupsController.post_usergroup,
  );
  
  usergroupRouter.delete(
    /*
    #swagger.tags = ["User Groups"]
    #swagger.summary = "Delete a user group by UUID"
    #swagger.responses[204] = {
      "description": "User group deleted successfully" 
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
    UsergroupsController.delete_usergroup,
  );

// post user group
// update usergroup
// delete usergroup

// get usergroup of user uuid
// delete usergroup for user uuid
// add usergroup for user uuid

export default usergroupRouter;
