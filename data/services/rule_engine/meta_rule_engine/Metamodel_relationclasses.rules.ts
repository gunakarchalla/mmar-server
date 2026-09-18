import { RequestHandler } from "express";
import { verif_metamodel_body } from "./Metamodel_attributes.rules";

/**
 * A relation class carries its attributes and the roles at both its ends, so saving one
 * writes them: the metamodel attribute rules apply to the whole body.
 */
export const verif_relationClass_body: RequestHandler = verif_metamodel_body;
