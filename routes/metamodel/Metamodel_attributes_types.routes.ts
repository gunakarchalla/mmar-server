import { Router } from "express";
import Metamodel_attribute_types_controller from "../../controllers/meta/Metamodel_attribute_types.controller";
import { verif_attributetype_body } from "../../data/services/rule_engine/meta_rule_engine/Metamodel_attributes.rules";
import { authenticate_token } from "../../data/services/middleware/auth.middleware";

/**
 * @description - These are the routes for the attribute types.
 * @type {Router}
 */
const attributetypeMetaRouter = Router();

attributetypeMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Retrieve all attribute types'
  #swagger.description = 'This endpoint fetches a comprehensive list of all defined attribute types within the metamodel.'
  #swagger.responses[200] = {
    description: 'Successful operation. Returns an array of attribute type objects.',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: { $ref: '#/components/schemas/AttributeType' }
        }
      }
    }
  }
  */
  "/attributeTypes",
  authenticate_token,
  Metamodel_attribute_types_controller.get_all_attributetypes
);

attributetypeMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Fetch a specific attribute type by its unique identifier (UUID)'
  #swagger.description = 'This endpoint retrieves detailed information about a single attribute type identified by its UUID.'
  #swagger.responses[200] = {
    description: 'Successful operation. Returns the attribute type object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID is invalid.' }
  #swagger.responses[404] = { description: 'Not Found. No attribute type with the specified UUID exists.' }
  */
  "/attributeTypes/:uuid",
  authenticate_token,
  Metamodel_attribute_types_controller.get_attributetype_by_uuid
);

attributetypeMetaRouter.patch(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Modify an existing attribute type'
  #swagger.description = 'This endpoint allows you to update specific properties of an attribute type identified by its UUID.'
  #swagger.requestBody = {
    description: 'The modified attribute type data',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    },
    required: true
  }
  #swagger.responses[200] = {
    description: 'Successful operation. Returns the updated attribute type object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request. The provided UUID or payload is invalid.'
  }
  #swagger.responses[404] = {
    description: 'Not Found. The attribute type with the specified UUID does not exist.'
  }
  */
  "/attributeTypes/:uuid",
  verif_attributetype_body,
  authenticate_token,
  Metamodel_attribute_types_controller.patch_attributetype_by_uuid
);

attributetypeMetaRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Create a new attribute type'
  #swagger.description = 'This endpoint facilitates the creation of a new attribute type with a user-specified UUID.'
  #swagger.requestBody = {
    description: 'The data for the new attribute type',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    },
    required: true
  }
  #swagger.responses[201] = {
    description: 'Created. The new attribute type was successfully created. Returns the created attribute type object.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID or payload is invalid.' }
  */
  "/attributeTypes/:uuid",
  verif_attributetype_body,
  authenticate_token,
  Metamodel_attribute_types_controller.post_attributetype_by_uuid
);

attributetypeMetaRouter.delete(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Remove an attribute type'
  #swagger.description = 'This endpoint enables the deletion of a specific attribute type identified by its UUID.'
  #swagger.responses[204] = { description: 'No Content. The attribute type was successfully deleted.' }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID is invalid.' }
  #swagger.responses[404] = { description: 'Not Found. The attribute type with the specified UUID does not exist.' }
  */
  "/attributeTypes/:uuid",
  authenticate_token,
  Metamodel_attribute_types_controller.delete_attributetype_by_uuid
);

// -----------------------------------------------------------------------------
// For attribute Meta
// -----------------------------------------------------------------------------

attributetypeMetaRouter.get(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Get the attribute type associated with a specific attribute'
  #swagger.description = 'This endpoint retrieves the attribute type linked to a given attribute, identified by its UUID.'
  #swagger.responses[200] = {
    description: 'Successful operation. Returns the attribute type object associated with the attribute.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID is invalid.' }
  #swagger.responses[404] = { 
    description: 'Not Found. The attribute with the specified UUID or its associated attribute type does not exist.' 
  }
  */
  "/attributes/:uuid/attributeTypes",
  authenticate_token,
  Metamodel_attribute_types_controller.get_attributetype_for_attribute
);

attributetypeMetaRouter.post(
  /*
  #swagger.tags = ['Metamodel']
  #swagger.summary = 'Link an attribute type to an attribute'
  #swagger.description = 'This endpoint associates an existing attribute type with a specific attribute.'
  #swagger.requestBody = {
    description: 'The attribute type to be linked',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    },
    required: true
  }
  #swagger.responses[200] = {
    description: 'Successful operation. The attribute type was linked to the attribute.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/AttributeType' }
      }
    }
  }
  #swagger.responses[400] = { description: 'Bad Request. The provided UUID or payload is invalid.' }
  #swagger.responses[404] = { description: 'Not Found. The attribute with the specified UUID does not exist.' }
  */
  "/attributes/:uuid/attributeTypes",
  verif_attributetype_body,
  authenticate_token,
  Metamodel_attribute_types_controller.post_attributetype_for_attribute
);

//attributetypeMetaRouter.delete('/attributes/:uuid/attributeTypes', delete_attributetype_for_attribute);

export default attributetypeMetaRouter;
