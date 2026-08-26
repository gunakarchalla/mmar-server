#!/usr/bin/env node
/**
 * Where does one autosave's work actually go?
 *
 * scene_patch_probe.js answers what a PATCH WRITES. This answers what it READS,
 * and - more usefully - which part of the request issued each read: the body
 * verification middleware, the authorization middleware, or the controller and
 * the instance data layer underneath it.
 *
 * Phase 4 was scoped to the re-reads in the write path. This is what showed
 * that the write path is not where a scene PATCH spends its time.
 *
 *   node test/reset_test_database.js
 *   MMAR_QUERY_STACKS=1 <env> node --require ./test/read_equivalence/pg_query_log.js \
 *       ../dist/mmar-server/index.js &
 *   node test/read_equivalence/query_probe.js
 *
 * The server must be running with pg_query_log.js preloaded and
 * MMAR_QUERY_STACKS=1, or every statement lands in "unattributed".
 */
require("dotenv").config({ path: ".env.test" });
const fs = require("fs");
const { Client } = require("pg");
const fixture = require("./scene_fixture");

const B = "http://localhost:8000";
const QLOG = process.env.MMAR_QUERY_LOG || "/tmp/mmar_queries.log";

/**
 * @description - The statements logged so far. Read whole rather than tailed:
 * the file is a few megabytes at this fixture size and this runs twice.
 * @returns {object[]} - One record per statement, in the order they were issued.
 */
function logged() {
    try {
        return fs.readFileSync(QLOG, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    } catch {
        return [];
    }
}

/**
 * @description - Which part of the request issued a statement, from its stack.
 * @param {string} at - The call site recorded by pg_query_log.
 * @returns {string} - The bucket name.
 */
function origin(at) {
    if (!at) return "unattributed (run the server with MMAR_QUERY_STACKS=1)";
    if (at.includes("rule_engine") || at.includes("verificator")) return "body-verification middleware";
    if (at.includes("scene_authorization")) return "authorization middleware";
    if (at.includes("controllers/")) return "controller + data layer";
    return "other";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @description - Count what one PATCH costs.
 * @param {Client} db - A connection of our own, for the audit log.
 * @param {string} name - What this request represents.
 * @param {object} body - The body to send.
 * @param {string} url - The scene instance to PATCH.
 * @param {object} headers - The request headers, with the bearer token.
 * @returns {Promise<object>} - The measurement.
 */
async function measure(db, name, body, url, headers) {
    const before = logged().length;
    const mark = (await db.query("SELECT coalesce(max(id),0) AS id FROM logging.t_history")).rows[0].id;
    const started = Date.now();
    const res = await fetch(url, { method: "PATCH", headers, body: JSON.stringify(body) });
    const wall_ms = Date.now() - started;
    const queries = logged().slice(before);
    const written = await db.query(
        "SELECT count(*)::int AS n FROM logging.t_history WHERE id > $1 AND operation = 'UPDATE'",
        [mark]
    );

    const by_origin = new Map();
    const by_statement = new Map();
    for (const q of queries) {
        const o = origin(q.at);
        by_origin.set(o, (by_origin.get(o) || 0) + 1);
        const s = q.q.replace(/\$\d+/g, "?").slice(0, 100);
        by_statement.set(s, (by_statement.get(s) || 0) + 1);
    }
    const rank = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
    return {
        name,
        status: res.status,
        wall_ms,
        queries: queries.length,
        rows_written: written.rows[0].n,
        by_origin: rank(by_origin, 6),
        by_statement: rank(by_statement, 8),
    };
}

(async () => {
    const token = await (
        await fetch(`${B}/login/signin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "admin" }),
        })
    ).json();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const seeded = await fixture.seed(B, headers);
    if (seeded.scene_status >= 300) throw new Error(`seeding the scene answered ${seeded.scene_status}`);

    const db = new Client({
        user: process.env.PGUSER, host: process.env.PGHOST, password: process.env.PGPASSWORD,
        port: Number(process.env.PGPORT) || 5432, database: process.env.PGDATABASE,
    });
    await db.connect();

    const url = `${B}/instances/sceneInstances/${fixture.ids.scene_instance}`;
    const body = fixture.scene_instance();
    body.class_instances[0].name = "node 0 - moved";
    body.class_instances[0].coordinates_2d = { x: 999, y: 999, z: 0 };

    // No warm-up: it would apply the very edit being measured. See the README.
    const moved = await measure(db, "one_object_moved", body, url, headers);
    await sleep(500);
    const idle = await measure(db, "nothing_changed", body, url, headers);
    await db.end();

    for (const m of [moved, idle]) {
        console.log(
            `\n=== ${m.name} === status ${m.status}  ${m.wall_ms} ms  ` +
            `${m.queries} queries  ${m.rows_written} rows written`
        );
        for (const [k, n] of m.by_origin) console.log(`${String(n).padStart(7)}  ${k}`);
        console.log("  -- most frequent statements --");
        for (const [k, n] of m.by_statement) console.log(`${String(n).padStart(7)}  ${k}`);
    }
    if (moved.status !== 200) process.exit(1);
})().catch((e) => {
    console.error("ERR", e);
    process.exit(1);
});
