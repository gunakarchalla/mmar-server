import { Router } from "express";
import Metamodel_attributes_controller from "../../controllers/meta/Metamodel_attributes.controller";
import { verif_attribute_body } from "../../data/services/rule_engine/meta_rule_engine/Metamodel_attributes.rules";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the meta attributes.
 * @type {Router}
 */
const attributeMetaRouter: Router = Router();

attributeMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get all attributes"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    }
  }
  #swagger.responses[400]= {
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
  "/attributes",
  authenticate_token,
  Metamodel_attributes_controller.get_all_attributes
);

attributeMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get an attribute by uuid"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid uuid supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/attributes/:uuid",
  authenticate_token,
  Metamodel_attributes_controller.get_attribute_by_uuid
);
attributeMetaRouter.patch(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Update an attribute"
  #swagger.requestBody= {
    "description": "Updated attribute object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/attributes/:uuid",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.patch_attribute_by_uuid
);
attributeMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Create an unlinked attribute",
  #swagger.requestBody= {
    "description": "New attribute object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    }
  }
  #swagger.responses[400]= {
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
  "/attributes/:uuid",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.post_attribute_by_uuid
);
attributeMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete an attribute"
  #swagger.responses[204]= {
    "description": "Attribute deleted successfully"
  },
  #swagger.responses[400]= {
    "description": "Invalid id supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/attributes/:uuid",
  authenticate_token,
  Metamodel_attributes_controller.delete_attributes_by_uuid
);

// -----------------------------------------------------------------------------
// For Scene
// -----------------------------------------------------------------------------

attributeMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ],
  #swagger.summary= "Get all attributes of a scene type by uuid",
  #swagger.operationId= "getAttributesOfSceneTypeById",
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid uuid supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/sceneTypes/:uuid/attributes",
  authenticate_token,
  Metamodel_attributes_controller.get_attributes_for_scene
);

attributeMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Add an attribute to a scene type"
  #swagger.operationId= "AddAttributeToSceneType",
  #swagger.requestBody= {
    "description": "New attribute scene type object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  },
  #swagger.responses[404]= {
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
  "/sceneTypes/:uuid/attributes",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.post_attribute_for_scene
);

attributeMetaRouter.patch(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Update attributes of a scene type"
  #swagger.requestBody= {
    "description": "Updated attributes object",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/sceneTypes/:uuid/attributes",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.patch_attribute_by_parent_uuid
);

attributeMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete all attributes of a scene type"
  #swagger.responses[204]= {
      "description": "Attribute deleted successfully"
    },
    #swagger.responses[400]= {
      "description": "Invalid id supplied",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/Error"
          }
        }
      }
    }
   */
  "/sceneTypes/:uuid/attributes",
  authenticate_token,
  Metamodel_attributes_controller.delete_attributes_for_scene
);

// -----------------------------------------------------------------------------
// For Class
// -----------------------------------------------------------------------------

attributeMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get all attributes of a class by uuid"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid uuid supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/classes/:uuid/attributes",
  authenticate_token,
  Metamodel_attributes_controller.get_attributes_for_class
);

attributeMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Add an attribute to a class"
  #swagger.requestBody= {
    "description": "New attribute class object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/classes/:uuid/attributes",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.post_attribute_for_class
);

attributeMetaRouter.patch(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Update attributes of a class"
  #swagger.requestBody= {
    "description": "Updated attributes object",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
    "description": "Class not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/classes/:uuid/attributes",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.patch_attribute_by_parent_uuid
);

attributeMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete all attributes of a class"
  #swagger.responses[204]= {
    "description": "Attribute deleted successfully"
  }
  #swagger.responses[400]= {
    "description": "Invalid id supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/classes/:uuid/attributes",
  authenticate_token,
  Metamodel_attributes_controller.delete_attributes_for_class
);

// -----------------------------------------------------------------------------
// For RelationClass
// -----------------------------------------------------------------------------

attributeMetaRouter.get(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Get all attributes of a relation class by uuid"
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid uuid supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/relationClasses/:uuid/attributes",
  authenticate_token,
  Metamodel_attributes_controller.get_attributes_for_class
);
attributeMetaRouter.post(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Add an attribute to a relation class",
  #swagger.requestBody= {
    "description": "New attribute object",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Attribute"
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
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
  "/relationClasses/:uuid/attributes",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.post_attribute_for_class
);

attributeMetaRouter.patch(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Update attributes of a relation class"
  #swagger.requestBody= {
    "description": "Updated attributes object",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    },
    "required": true
  }
  #swagger.responses[200]= {
    "description": "Successful operation",
    "content": {
      "application/json": {
        "schema": {
          "type": "array",
          "items": {
            "$ref": "#/components/schemas/Attribute"
          }
        }
      }
    }
  }
  #swagger.responses[400]= {
    "description": "Invalid payload supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  #swagger.responses[404]= {
    "description": "Class not found",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/relationClasses/:uuid/attributes",
  verif_attribute_body,
  authenticate_token,
  Metamodel_attributes_controller.patch_attribute_by_parent_uuid
);

attributeMetaRouter.delete(
  /*
  #swagger.tags= [
    "Metamodel"
  ]
  #swagger.summary= "Delete all attributes of a relation class"
  #swagger.responses[204]= {
    "description": "Attribute deleted successfully"
  }
  #swagger.responses[400]= {
    "description": "Invalid id supplied",
    "content": {
      "application/json": {
        "schema": {
          "$ref": "#/components/schemas/Error"
        }
      }
    }
  }
  */
  "/relationClasses/:uuid/attributes",
  authenticate_token,
  Metamodel_attributes_controller.delete_attributes_for_class
);

// -----------------------------------------------------------------------------
// For decomposableClass
// -----------------------------------------------------------------------------

//attributeMetaRouter.get('/decomposableClasses/:uuid/attributes',get_attributes_for_class);
//attributeMetaRouter.post('/decomposableClasses/:uuid/attributes',verif_attribute_body,post_attribute_for_class);
//attributeMetaRouter.delete('/decomposableClasses/:uuid/attributes',delete_attributes_for_class);

// -----------------------------------------------------------------------------
// For aggregatorClass
// -----------------------------------------------------------------------------

//attributeMetaRouter.get('/aggregatorClasses/:uuid/attributes',get_attributes_for_class);
//attributeMetaRouter.post('/aggregatorClasses/:uuid/attributes',verif_attribute_body,post_attribute_for_class);
//attributeMetaRouter.delete('/aggregatorClasses/:uuid/attributes',delete_attributes_for_class);

export default attributeMetaRouter;
