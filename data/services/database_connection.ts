import { Pool, PoolConfig } from "pg";
import { readFileSync } from "fs";
import { testDatabaseConnection } from "./middleware/database_test";
import path = require("path");

/**
 * @description - This class is the connection to the database.
 * @export - This class is exported so that it can be used by other files.
 * @class DatabaseConnection
 */
export class database_connection {
  private static instance: database_connection;
  private config = path.join(__dirname, "..", "..", "config", "DBConfig.json");
  /**
   * @description - This variable is the parsed database configuration.
   * @private
   */
  private dbconfig = JSON.parse(readFileSync(this.config, "utf-8"));
  private readonly pool: Pool;
  private poolConfig: PoolConfig;

  /**
   * @description - This function is the constructor of the class.
   * @memberof DatabaseConnection
   * @constructor
   */
  constructor() {
    this.pool = new Pool(this.dbconfig);
    this.poolConfig = this.dbconfig;

    this.pool.on("error", async (err) => {
      console.log("Database connection error POOL", err.message);
      await testDatabaseConnection(1);
    });

    this.pool.on("connect", (client) => {
      client.on("error", async (err) => {
        console.log("Database connection error CLIENT", err.message);
      });
    });
  }

  public static getInstance(): database_connection {
    if (!database_connection.instance) {
      database_connection.instance = new database_connection();
    }
    return database_connection.instance;
  }

  /**
   * @description - This function releases the connection to the database.
   * @memberof DatabaseConnection
   * @method
   * @async
   * @return {Promise<void>} - This function returns a promise that resolves when the connection is released.
   */
  async releaseDriver(): Promise<void> {
    await this.pool.end();
    console.log(
      "Pool " +
        this.poolConfig.database +
        "@" +
        this.poolConfig.host +
        " has been shutdown.",
    );
    process.exit(0);
  }

  /**
   * @description - This function gets the pool of connections to the database.
   * @memberof DatabaseConnection
   * @method
   * @return {Pool} - The pool of connections to the database.
   */
  getPool(): Pool {
    return this.pool;
  }
}
