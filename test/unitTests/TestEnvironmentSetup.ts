import { database_connection } from "../../data/services/database_connection";
import { sql_queries_parser } from "../../data/services/sql_queries_parser";
import chai from "chai";
import chaiHttp from "chai-http";
import { PoolClient } from "pg";

chai.use(chaiHttp);

/**
 * @description - The rows that existed before a spec started, so that everything
 * it went on to create can be identified and removed afterwards.
 */
interface Baseline {
    metaobjects: Set<string>;
    instances: Set<string>;
}

/**
 * @description - The tables a spec can add rows to. Both cascade to everything
 * that specialises them — a class row hangs off a metaobject, a class instance off
 * an instance_object — so removing these two removes the rest.
 */
const OWNED_TABLES = ["instance_object", "metaobject"] as const;
type OwnedTable = (typeof OWNED_TABLES)[number];

export class TestEnvironmentSetup {
  private static instance: TestEnvironmentSetup;
  private databaseConnection: database_connection;
  private sqlParser: sql_queries_parser;
  private apiUrl: string;
  private baseline?: Baseline;
  private onSigint?: () => void;

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

    // Handle termination. The listener is kept so that it can actually be
    // removed later: passing a fresh arrow function to process.off() removes
    // nothing, which used to leak one listener per spec file.
    this.onSigint = () => {
      void this.databaseConnection.releaseDriver();
    };
    process.on("SIGINT", this.onSigint);

    // The baseline is taken once, on the first spec to run, and every tearDown
    // afterwards restores the database to it. Re-taking it per spec looked
    // equivalent but was not: anything a spec left behind became part of the next
    // spec's baseline and was then never removed, so leftovers still accumulated
    // across the suite.
    if (!this.baseline) {
      this.baseline = await this.snapshot(client);
    }

    const token = await this.authenticateUser();
    return { client, token };
  }

  /**
   * @description - Record which rows already exist, so that the difference can be
   * removed afterwards.
   * @param {PoolClient} client - The client to the database.
   * @returns {Promise<Baseline>} - The uuids present before the spec ran.
   */
  private async snapshot(client: PoolClient): Promise<Baseline> {
    const read = async (table: OwnedTable) =>
      new Set<string>(
        (await client.query(`SELECT uuid FROM ${table}`)).rows.map(
          (row) => row.uuid as string,
        ),
      );
    return {
      instances: await read("instance_object"),
      metaobjects: await read("metaobject"),
    };
  }

  /**
   * @description - Remove every row of a table that was not there at the start.
   *
   * Foreign keys between the fixtures mean the rows cannot be deleted in an
   * arbitrary order — some are RESTRICT — and the dependency order is not known
   * here. Rather than encode it, each pass deletes what it can and the failures
   * are retried on the next pass; the loop ends when a whole pass achieves
   * nothing, which is either success or a genuine cycle.
   * @param {PoolClient} client - The client to the database.
   * @param {OwnedTable} table - The table to clean. Not user input: see OWNED_TABLES.
   * @param {Set<string>} keep - The uuids that were there before.
   * @returns {Promise<string[]>} - The uuids that could not be removed.
   */
  private async purge(
    client: PoolClient,
    table: OwnedTable,
    keep: Set<string>,
  ): Promise<string[]> {
    const all = (await client.query(`SELECT uuid FROM ${table}`)).rows.map(
      (row) => row.uuid as string,
    );
    let pending = all.filter((uuid) => !keep.has(uuid));

    let progressed = true;
    while (pending.length > 0 && progressed) {
      progressed = false;
      const blocked: string[] = [];
      for (const uuid of pending) {
        try {
          await client.query(`DELETE FROM ${table} WHERE uuid = $1`, [uuid]);
          progressed = true;
        } catch {
          // Still referenced by something that has not been deleted yet.
          blocked.push(uuid);
        }
      }
      pending = blocked;
    }
    return pending;
  }

  /**
   * @description - Return the database to the state the spec found it in.
   *
   * The explicitly named uuids are removed first, together with the reference
   * rows that do not cascade from metaobject. Everything else the spec created is
   * then removed by comparison against the snapshot: relying on each spec to list
   * its own fixtures meant whatever it forgot survived into the next spec, and
   * the suite's result depended on the order it happened to run in.
   * @param {PoolClient} client - The client to the database.
   * @param {string[]} uuidsToDelete - The uuids the spec knows it created.
   */
  public async tearDown(
    client: PoolClient,
    uuidsToDelete: string[],
  ): Promise<void> {
    try {
      // The explicit deletes are best effort: they cover the reference rows that
      // do not cascade from metaobject. A failure here must not skip the sweep
      // below, which is what actually guarantees the database is left as found.
      try {
        await client.query("DELETE FROM instance_object WHERE uuid = ANY($1)", [
          [uuidsToDelete],
        ]);
        for (const table of [
          "role_attribute_reference",
          "role_scene_reference",
          "role_class_reference",
          "role_port_reference",
          "role_relationclass_reference",
        ]) {
          await client.query(
            `DELETE FROM ${table} WHERE uuid_role = ANY($1)`,
            [[uuidsToDelete]],
          );
        }
        await client.query("DELETE FROM metaobject WHERE uuid = ANY($1)", [
          [uuidsToDelete],
        ]);
      } catch (err) {
        console.warn(
          `TestEnvironmentSetup: the explicit cleanup failed, falling back to the ` +
          `sweep: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      if (this.baseline) {
        await this.purge(client, "instance_object", this.baseline.instances);
        const stuck = await this.purge(
          client,
          "metaobject",
          this.baseline.metaobjects,
        );
        if (stuck.length > 0) {
          console.warn(
            `TestEnvironmentSetup: ${stuck.length} metaobject row(s) could not be ` +
            `removed and will leak into the next spec: ${stuck.join(", ")}`,
          );
        }
      }
    } finally {
      // The baseline is deliberately kept: it describes the pristine database,
      // not this spec, and every later tearDown restores to the same point.
      client.release();
      if (this.onSigint) {
        process.off("SIGINT", this.onSigint);
        this.onSigint = undefined;
      }
    }
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
