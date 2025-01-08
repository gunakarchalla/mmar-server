import { Router } from "express";
import Metamodel_rules_controller from "../../controllers/meta/Metamodel_rules.controller";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the rules.
 * @type {Router}
 */
const ruleMetaRouter: Router = Router();

//ruleMetaRouter.post('/rules/:uuid', verif_rules_body, post_rules_for_metaObject);
ruleMetaRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Create a new rule (independent of a meta-object)'
  #swagger.description = 'This endpoint allows you to create a new rule that is not directly associated with any specific meta-object.'
  #swagger.requestBody = {
    description: 'The data for the new rule',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Created. The new rule was successfully created. Returns the created rule object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    }
  }
  #swagger.responses[400] = { 
    description: 'Bad Request. The provided payload is invalid or a rule with the same UUID already exists.' 
  }
  */
  "/rules", 
  authenticate_token,
  Metamodel_rules_controller.post_rule_by_uuid
);

ruleMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Get all rules associated with a specific meta-object'
  #swagger.description = 'This endpoint retrieves all rules linked to a given meta-object, identified by its UUID.'
  #swagger.responses[200] = {
    description: 'Successful operation. Returns an array of rule objects associated with the meta-object.',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: { $ref: '#/components/schemas/Rule' }
        }
      }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID is invalid.' }
  #swagger.responses[404] = { description: 'Not Found. The meta-object with the specified UUID does not exist.' }
  */
  "/rules/metaObjects/:uuid",
  authenticate_token,
  Metamodel_rules_controller.get_rules_for_metaobject_uuid
);

ruleMetaRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Create a new rule and associate it with a meta-object'
  #swagger.description = 'This endpoint creates a new rule and establishes a link between it and a specific meta-object.'
  #swagger.requestBody = {
    description: 'The data for the new rule',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Created. The new rule was successfully created and linked to the meta-object. Returns the created rule object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    }
  }
  #swagger.responses[400] = { 
    description: 'Bad Request. The provided UUID or payload is invalid, or a rule with the same UUID already exists.'
  }
  #swagger.responses[404] = { description: 'Not Found. The meta-object with the specified UUID does not exist.' }
  */
  "/rules/metaObjects/:uuid",
  authenticate_token,
  Metamodel_rules_controller.post_rules_for_metaobject
);

ruleMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Fetch a specific rule by its unique identifier (UUID)'
  #swagger.description = 'This endpoint retrieves detailed information about a single rule identified by its UUID.'
  #swagger.responses[200] = {
    description: 'Successful operation. Returns the rule object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID is invalid.' }
  #swagger.responses[404] = { description: 'Not Found. No rule with the specified UUID exists.' }
  */
  "/rules/:uuid",
  authenticate_token,
  Metamodel_rules_controller.get_rules_by_uuid
);

ruleMetaRouter.patch(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Modify an existing rule'
  #swagger.description = 'This endpoint allows you to update specific properties of a rule identified by its UUID.'
  #swagger.requestBody = {
    description: 'The modified rule data',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    },
    required: true
  }
  #swagger.responses[200] = {
    description: 'Successful operation. Returns the updated rule object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID or payload is invalid.' }
  #swagger.responses[404] = { description: 'Not Found. The rule with the specified UUID does not exist.' }
  */
  "/rules/:uuid",
  authenticate_token,
  Metamodel_rules_controller.patch_rule_by_uuid
);

ruleMetaRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Create a new rule with a specific UUID'
  #swagger.description = 'This endpoint allows you to create a new rule and assign it a specific UUID. If a rule with the same UUID already exists, it will return a 400 Bad Request error.'
  #swagger.requestBody = {
    description: 'The data for the new rule',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Created. The new rule was successfully created. Returns the created rule object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Rule' }
      }
    }
  }
  #swagger.responses[400]= { 
    description: 'Bad Request. The provided UUID or payload is invalid, or a rule with the same UUID already exists.' 
  }
  */
  "/rules/:uuid",
  authenticate_token,
  Metamodel_rules_controller.post_rule_by_uuid
);

ruleMetaRouter.delete(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Delete a rule'
  #swagger.description = 'This endpoint enables the deletion of a specific rule identified by its UUID.'
  #swagger.responses[204] = { description: 'No Content. The rule was successfully deleted.' }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID is invalid.' }
  #swagger.responses[404] = { description: 'Not Found. The rule with the specified UUID does not exist.' }
  */
  "/rules/:uuid",
  authenticate_token,
  Metamodel_rules_controller.delete_rules_by_uuid
);

export default ruleMetaRouter;
