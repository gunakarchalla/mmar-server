import { database_connection } from "../../data/services/database_connection";
import { sql_queries_parser } from "../../data/services/sql_queries_parser";
import chai from "chai";
import chaiHttp from "chai-http";
import { PoolClient } from "pg";

chai.use(chaiHttp);

export class TestEnvironmentSetup {
  private static instance: TestEnvironmentSetup;
  private databaseConnection: database_connection;
  private sqlParser: sql_queries_parser;
  private apiUrl: string;

  private constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.databaseConnection = new database_connection();
    this.sqlParser = new sql_queries_parser();
  }

  public static getInstance(apiUrl: string): TestEnvironmentSetup {
    if (!TestEnvironmentSetup.instance) {
      TestEnvironmentSetup.instance = new TestEnvironmentSetup(apiUrl);
    }
    return TestEnvironmentSetup.instance;
  }

  public async setupTestEnvironment(): Promise<{
    client: PoolClient;
    token: string;
  }> {
    const client = await this.databaseConnection.getPool().connect();
    // Handle termination
    process.on("SIGINT", () => {
      this.databaseConnection.releaseDriver();
    });

    const token = await this.authenticateUser();
    return { client, token };
  }

  public async tearDown(
    client: PoolClient,
    uuidsToDelete: string[],
  ): Promise<void> {
    await client.query("DELETE FROM instance_object WHERE uuid = ANY($1)", [
      [uuidsToDelete],
    ]);
    await client.query(
      "DELETE FROM role_attribute_reference WHERE uuid_role = ANY($1)",
      [[uuidsToDelete]],
    );
    await client.query(
      "DELETE FROM role_scene_reference WHERE uuid_role = ANY($1)",
      [[uuidsToDelete]],
    );
    await client.query(
      "DELETE FROM role_class_reference WHERE uuid_role = ANY($1)",
      [[uuidsToDelete]],
    );
    await client.query(
      "DELETE FROM role_port_reference WHERE uuid_role = ANY($1)",
      [[uuidsToDelete]],
    );

    await client.query(
      "DELETE FROM role_relationclass_reference WHERE uuid_role = ANY($1)",
      [[uuidsToDelete]],
    );

    await client.query("DELETE FROM metaobject WHERE uuid = ANY($1)", [
      [uuidsToDelete],
    ]);

    client.release();
    process.off("SIGINT", () => {
      this.databaseConnection.releaseDriver();
    });
  }

  private async authenticateUser(): Promise<string> {
    const res = await chai
      .request(this.apiUrl)
      .post("/login/signin")
      .set("content-type", "application/json")
      .set("accept", "application/json")
      .send({
        username: "admin",
        password: "admin",
      });
    return res.body;
  }
}
