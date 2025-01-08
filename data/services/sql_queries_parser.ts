import {readFileSync} from "fs";
import * as path from "path";

export { sql_queries_parser };

type Query = {
  name: string;
  query: string;
};

/**
 * @description - This function parses the sql queries from the sql_queries.json file
 * @class sql_queries_parser
 * @export - This function is exported to be used in the other files
 */
class sql_queries_parser {
  private queriesList_get: Array<Query> = [];
  private queriesList_post: Array<Query> = [];
  private queriesList_delete: Array<Query> = [];
  private queriesList_rules: Array<Query> = [];

  constructor() {
    // get the path of the file
    const path_list_get = path.join(
      __dirname,
      "..",
      "sqlQueries",
      "get_sqlQueries.json"
    );
    const queriesListGet = JSON.parse(readFileSync(path_list_get, "utf8"));
    queriesListGet.queries.forEach((element: Query) => {
      // to ensure that the stored elements are really strings
      const newQuery: Query = {
        name: element.name.toString(),
        query: element.query.toString(),
      };
      this.queriesList_get.push(newQuery);
    });

    const path_list_post = path.join(
      __dirname,
      "..",
      "sqlQueries",
      "post_sqlQueries.json"
    );
    const queriesListPost = JSON.parse(readFileSync(path_list_post, "utf8"));
    queriesListPost.queries.forEach((element: Query) => {
      // to ensure that the stroed elements are really strings
      const newQuery: Query = {
        name: element.name.toString(),
        query: element.query.toString(),
      };
      this.queriesList_post.push(newQuery);
    });

    const path_list_delete = path.join(
      __dirname,
      "..",
      "sqlQueries",
      "delete_sqlQueries.json"
    );
    const queriesListDelete = JSON.parse(
      readFileSync(path_list_delete, "utf8")
    );
    queriesListDelete.queries.forEach((element: Query) => {
      // to ensure that the stroed elements are really strings
      const newQuery: Query = {
        name: element.name.toString(),
        query: element.query.toString(),
      };
      this.queriesList_delete.push(newQuery);
    });

    const path_list_rules = path.join(
      __dirname,
      "..",
      "sqlQueries",
      "rules_sqlQueries.json"
    );
    const queriesListRules = JSON.parse(readFileSync(path_list_rules, "utf8"));
    queriesListRules.queries.forEach((element: Query) => {
      // to ensure that the stroed elements are really strings
      const newQuery: Query = {
        name: element.name.toString(),
        query: element.query.toString(),
      };
      this.queriesList_rules.push(newQuery);
    });
  }

  /**
   * @description - This function returns the list of queries for the get request
   * @param {string} queryName - The name of the query
   * @returns {string} - The query
   * @memberof sql_queries_parser
   * @export - This function is exported to be used in the other files
   * @throws - This function throws an error if the query is not found
   */
  getQuery_get(queryName: string): string {
    // solution from : https://stackoverflow.com/questions/54738221/typescript-array-find-possibly-undefind
    const result = this.queriesList_get.find(
      (e) => e.name === queryName
    )?.query;
    if (result != undefined) {
      return result;
    } else {
      throw new TypeError(
        "The SQL query named " +
          queryName +
          " could not be found in the delete querylist "
      );
    }
  }

  /**
   * @description - This function returns the list of queries for the post request
   * @param {string} queryName - The name of the query
   * @returns {string} - The query
   * @memberof sql_queries_parser
   * @export - This function is exported to be used in the other files
   * @throws - This function throws an error if the query is not found
   */
  getQuery_post(queryName: string): string {
    // solution from : https://stackoverflow.com/questions/54738221/typescript-array-find-possibly-undefind
    const result = this.queriesList_post.find(
      (e) => e.name === queryName
    )?.query;
    if (result != undefined) {
      return result;
    } else {
      throw new TypeError(
        "The SQL query named " +
          queryName +
          " could not be found in the delete querylist "
      );
    }
  }

  /**
   * @description - This function returns the list of queries for the delete request
   * @param {string} queryName - The name of the query
   * @returns {string} - The query
   * @memberof sql_queries_parser
   * @export - This function is exported to be used in the other files
   * @throws - This function throws an error if the query is not found
   */
  getQuery_delete(queryName: string): string {
    // solution from : https://stackoverflow.com/questions/54738221/typescript-array-find-possibly-undefind
    const result = this.queriesList_delete.find(
      (e) => e.name === queryName
    )?.query;
    if (result != undefined) {
      return result;
    } else {
      throw new TypeError(
        "The SQL query named " +
          queryName +
          " could not be found in the delete querylist "
      );
    }
  }

  /**
   * @description - This function returns the list of queries for the rules request
   * @param {string} queryName - The name of the query
   * @returns {string} - The query
   * @memberof sql_queries_parser
   * @export - This function is exported to be used in the other files
   * @throws - This function throws an error if the query is not found
   */
  getQuery_rules(queryName: string): string {
    // solution from : https://stackoverflow.com/questions/54738221/typescript-array-find-possibly-undefind
    const result = this.queriesList_rules.find(
      (e) => e.name === queryName
    )?.query;
    if (result != undefined) {
      return result;
    } else {
      throw new TypeError(
        "The SQL query named " +
          queryName +
          " could not be found in the delete querylist "
      );
    }
  }
}
