import { RequestHandler } from "express";
import { verif_metamodel_body } from "./Metamodel_attributes.rules";

/**
 * A class carries its attributes and its ports' attributes, so saving one writes them:
 * the metamodel attribute rules apply to the whole body.
 */
export const verif_class_body: RequestHandler = verif_metamodel_body;
