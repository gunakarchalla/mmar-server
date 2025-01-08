import { RequestHandler } from "express";

export const verif_attributetype_body: RequestHandler = async (
  req,
  res,
  next
) => {
  /*
      console.log("Middleware attributeType type body checker");
      const client = await database_connection.getPool().connect();
      process.on('SIGINT', function() { database_connection.releaseDriver(); });
      const search_metaobject_query = queries.getQuery_rules("search_metaobject");
      const uuid = await client.query(search_metaobject_query, [req.params.uuid]);
      if(uuid.rowCount != 0){
          //the uuid exist

      }else{
          //the uuid doesn't exist
      }
  */

  //TODO implement the rule here
  // eslint-disable-next-line no-constant-condition
  if (true) {
    next();
  } else {
    res.status(400).send("Invalid payload provided !");
  }
};

export const verif_attribute_body: RequestHandler = async (req, res, next) => {
  //TODO implement the rule here
  // eslint-disable-next-line no-constant-condition
  if (true) {
    next();
  } else {
    res.status(400).send("Invalid payload provided !");
  }
};
