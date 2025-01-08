import { Router } from "express";
import Instance_role_controller from "../../controllers/instance/Instance_roles.controller";
import {
  verif_role_instance_body,
  verif_role_instance_deletion,
} from "../../data/services/rule_engine/instance_rule_engine/Instance_roles.verificator";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the roles instances.
 * @type {Router}
 */
const roleInstanceRouter = Router();

roleInstanceRouter.get(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get a role instance by UUID'
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/RoleInstance" 
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
    "description": "Role instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/rolesInstances/:uuid",
  authenticate_token,
  Instance_role_controller.get_role_instances_by_uuid
);

roleInstanceRouter.patch(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Update a role instance'
  #swagger.requestBody = {
    "description": "Updated role instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/RoleInstance" 
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
          "$ref": "#/components/schemas/RoleInstance" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Role instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/rolesInstances/:uuid",
  verif_role_instance_body,
  authenticate_token,
  Instance_role_controller.patch_role_instance_by_uuid
);

roleInstanceRouter.post(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a role instance'
  #swagger.requestBody = {
    "description": "New role instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/RoleInstance" 
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
          "$ref": "#/components/schemas/RoleInstance" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/rolesInstances/:uuid",
  verif_role_instance_body,
  authenticate_token,
  Instance_role_controller.post_role_instance_by_uuid
);

roleInstanceRouter.delete(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete a role instance'
  #swagger.responses[204] = {
    "description": "Role instance deleted successfully"
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
  "/rolesInstances/:uuid",
  verif_role_instance_deletion,
  authenticate_token,
  Instance_role_controller.delete_role_instances_by_uuid
);

// -----------------------------------------------------------------------------
// For relationclassesInstances
// -----------------------------------------------------------------------------

//roleInstanceRouter.get('/relationclassesInstances/:uuid/rolesInstances', get_role_instances_for_relationclass_instances); //unsused

roleInstanceRouter.get(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get the "roleFrom" for a relation class instance'
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/RoleInstance" 
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
    "description": "\"roleFrom\" not found for the relation class instance",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/relationclassesInstances/:uuid/roleFrom",
  authenticate_token,
  Instance_role_controller.get_rolefrom_for_relationclass_instances
);

roleInstanceRouter.get(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get the "roleTo" for a relation class instance'
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/RoleInstance" 
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
    "description": "\"roleTo\" not found for the relation class instance",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/relationclassesInstances/:uuid/roleTo",
  authenticate_token, 
  Instance_role_controller.get_roleto_for_relationclass_instances
);

roleInstanceRouter.post(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create role instances for a relation class instance'
  #swagger.requestBody = {
    "description": "New role instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/RoleInstance" 
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
          "$ref": "#/components/schemas/RoleInstance" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Relation class instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/relationclassesInstances/:uuid/rolesInstances",
  verif_role_instance_body,
  authenticate_token,
  Instance_role_controller.post_role_instances_for_relationclass_instances
);

roleInstanceRouter.delete(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete role instances for a relation class instance'
  #swagger.responses[204] = {
    "description": "Role instances deleted successfully"
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
  "/relationclassesInstances/:uuid/rolesInstances",
  verif_role_instance_deletion,
  authenticate_token,
  Instance_role_controller.delete_role_instances_for_parent
);

// -----------------------------------------------------------------------------
// For sceneInstances
// -----------------------------------------------------------------------------

roleInstanceRouter.get(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Get all role instances for a scene instance']
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/RoleInstance" 
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
    "description": "Scene instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneInstances/:uuid/rolesInstances",
  authenticate_token,
  Instance_role_controller.get_roles_instances_for_scene
);

roleInstanceRouter.post(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Create a role instance for a scene instance'
  #swagger.requestBody = {
    "description": "New role instance object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/RoleInstance" 
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
          "$ref": "#/components/schemas/RoleInstance" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Scene instance not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/sceneInstances/:uuid/rolesInstances",
  verif_role_instance_body,
  authenticate_token,
  Instance_role_controller.post_role_instances
);

roleInstanceRouter.delete(
  /* 
  #swagger.tags = ['Instance']
  #swagger.summary = 'Delete all role instances for a scene instance'
  #swagger.responses[204] = {
    "description": "Role instances deleted successfully"
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
  "/sceneInstances/:uuid/rolesInstances",
  verif_role_instance_deletion,
  authenticate_token,
  Instance_role_controller.delete_role_instances_for_parent
);

export default roleInstanceRouter;
