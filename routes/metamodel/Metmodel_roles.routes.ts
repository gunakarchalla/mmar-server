import Metamodel_relationclass_controller from "../../controllers/meta/Metamodel_relationclasses.controller";

import { Router } from "express";
import Metamodel_roles_controller from "../../controllers/meta/Metamodel_roles.controller";
import { verif_role_body } from "../../data/services/rule_engine/meta_rule_engine/Metamodel_roles.rules";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

const roleMetaRouter: Router = Router();

roleMetaRouter.get(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Get all roles"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Role"   
 
          }
        }
      }
    }
  }
  */
  "/roles",
  authenticate_token,
  Metamodel_roles_controller.get_roles
);

roleMetaRouter.get(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Get a role by UUID"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Role" 
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
    "description": "Role not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/roles/:uuid",
  authenticate_token,
  Metamodel_roles_controller.get_roles_by_uuid
);

roleMetaRouter.patch(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Update a role by UUID"
  #swagger.requestBody = {
    "description": "Updated role object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Role" 
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
          "$ref": "#/components/schemas/Role" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid role supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Role not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/roles/:uuid",
  verif_role_body,
  authenticate_token,
  Metamodel_roles_controller.patch_role_by_uuid
);

roleMetaRouter.post(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Create a new role"
  #swagger.requestBody = {
    "description": "New role object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Role" 
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
          "$ref": "#/components/schemas/Role" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid role supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/roles/:uuid",
  verif_role_body,
  authenticate_token,
  Metamodel_roles_controller.post_role_by_uuid
);

roleMetaRouter.delete(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Delete a role by UUID"
  #swagger.responses[204] = {
    "description": "Role deleted successfully" 
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
  "/roles/:uuid",
  authenticate_token,
  Metamodel_roles_controller.delete_roles_by_uuid
);

// -----------------------------------------------------------------------------
// For relationClass
// -----------------------------------------------------------------------------

roleMetaRouter.get(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Get the 'role from' for a relation class by UUID"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Role" 
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
    "description": "Relation class not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/relationClasses/:uuid/roleFrom",
  authenticate_token,
  Metamodel_relationclass_controller.get_rolefrom_for_relationclass
);

roleMetaRouter.get(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Get the 'role to' for a relation class by UUID"
  #swagger.responses[200] = {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Role" 
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
    "description": "Relation class not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/relationClasses/:uuid/roleTo",
  authenticate_token,
  Metamodel_relationclass_controller.get_roleto_for_relationclass
);

roleMetaRouter.post(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Create roles for a relation class"
  #swagger.requestBody = {
    "description": "Role object to create for the relation class",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Role" 
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
          "$ref": "#/components/schemas/Role" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid role or relation class UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Relation class not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/relationClasses/:uuid/roles",
  verif_role_body,
  authenticate_token,
  Metamodel_roles_controller.post_roles_for_relationclass
);

// -----------------------------------------------------------------------------
// For sceneType
// -----------------------------------------------------------------------------

// TODO
//roleMetaRouter.get('/sceneTypes/:uuid/roles',get_roles_for_scene);

roleMetaRouter.post(
  /*
  #swagger.tags = ["Metamodel"]
  #swagger.summary = "Create roles for a scene type"
  #swagger.requestBody = {
    "description": "Role object to create for the scene type",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Role" 
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
          "$ref": "#/components/schemas/Role" 
        }
      }
    }
  }
  #swagger.responses[400] = {
    "description": "Invalid role or scene type UUID supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  #swagger.responses[404] = {
    "description": "Scene type not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error" 
        }
      }
    }
  }
  */
  "/sceneTypes/:uuid/roles",
  verif_role_body,
  authenticate_token,
  Metamodel_roles_controller.post_roles
);

export default roleMetaRouter;
