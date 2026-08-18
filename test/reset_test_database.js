#!/usr/bin/env node
/**
 * Recreate the test database from mmar-database/init.sql.
 *
 * The specs share one schema and are only as isolated as TestEnvironmentSetup can
 * make them, so a run that starts from leftover state is not a reliable signal:
 * the same spec passes alone and fails in the suite, or the other way round.
 * Starting from the schema every time removes that variable.
 *
 * It refuses to touch anything but a database whose name ends in _test, so it
 * cannot be pointed at the development or production database by mistake.
 *
 *   node test/reset_test_database.js          # uses .env.test if present, else .env
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const env_file = fs.existsSync(path.join(__dirname, "..", ".env.test"))
    ? ".env.test"
    : ".env";
require("dotenv").config({ path: path.join(__dirname, "..", env_file) });

const database = process.env.PGDATABASE;
const connection = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT) || 5432,
};

async function main() {
    if (!database || !database.endsWith("_test")) {
        throw new Error(
            `Refusing to reset "${database}": this only operates on a database ` +
            `whose name ends in _test. Set PGDATABASE in ${env_file}.`
        );
    }

    const maintenance = new Client({ ...connection, database: "postgres" });
    await maintenance.connect();
    // Anything still connected would block the drop.
    await maintenance.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [database]
    );
    await maintenance.query(`DROP DATABASE IF EXISTS ${database}`);
    await maintenance.query(`CREATE DATABASE ${database}`);
    await maintenance.end();

    const schema = fs.readFileSync(
        path.join(__dirname, "..", "..", "mmar-database", "init.sql"),
        "utf8"
    );
    const fresh = new Client({ ...connection, database: database });
    await fresh.connect();
    await fresh.query(schema);
    // init.sql clears search_path for its own session, so name the schema here.
    const counts = await fresh.query(
        `SELECT (SELECT count(*) FROM public.metaobject) AS metaobjects,
                (SELECT count(*) FROM public.instance_object) AS instances,
                (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS indexes`
    );
    await fresh.end();

    console.log(`${database} recreated from init.sql:`, counts.rows[0]);
}

main().catch((err) => {
    console.error("Failed to reset the test database:", err.message);
    process.exit(1);
});
