import { RequestHandler } from "express";
import { verif_metamodel_body } from "./Metamodel_attributes.rules";

/**
 * A port carries its attributes, so saving one writes them: the metamodel attribute
 * rules apply to the whole body.
 */
export const verif_port_body: RequestHandler = verif_metamodel_body;
