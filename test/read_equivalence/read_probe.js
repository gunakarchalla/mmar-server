#!/usr/bin/env node
/**
 * Where does one scene-instance READ spend its statements?
 *
 * query_probe.js answers that question for a PATCH. This one answers it for
 * GET /instances/sceneInstances/:uuid, attributing each statement to the query
 * text that issued it, so that a per-object fan-out is visible as one statement
 * repeated once per object.
 *
 * Prefer this to sum(seq_scan)+sum(idx_scan): those counters are index probes,
 * so one batched query over 150 parents counts as ~150 and is indistinguishable
 * from 150 separate queries. Both are reported below; the statement counts are
 * the ones that answer the question. See gotchas/measuring in state.json.
 *
 *   node test/reset_test_database.js
 *   MMAR_QUERY_STACKS=1 <env> node --require ./test/read_equivalence/pg_query_log.js \
 *       ../dist/mmar-server/index.js &
 *   node test/read_equivalence/read_probe.js
 */
require("dotenv").config({ path: ".env.test" });
const fs = require("fs");
const { Client } = require("pg");
const fixture = require("./scene_fixture");

const B = "http://localhost:8000";
const QLOG = process.env.MMAR_QUERY_LOG || "/tmp/mmar_queries.log";

/**
 * @description - The statements logged so far, in the order they were issued.
 * @returns {object[]} - One record per statement.
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

/**
 * @description - Table scans and index probes, for the record. They are flushed
 * asynchronously, hence the settle time either side.
 * @param {Client} db - A connection of our own.
 * @returns {Promise<number>} - sum(seq_scan) + sum(idx_scan).
 */
async function scans(db) {
    const res = await db.query(
        "SELECT coalesce(sum(seq_scan),0) + coalesce(sum(idx_scan),0) AS n FROM pg_stat_user_tables"
    );
    return Number(res.rows[0].n);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

    // A read may be warmed up - unlike a write it changes nothing. See the README.
    await fetch(url, { headers });
    await sleep(1200);

    const before = logged().length;
    const scans_before = await scans(db);
    const started = Date.now();
    const res = await fetch(url, { headers });
    const body = await res.json();
    const wall_ms = Date.now() - started;
    await sleep(1200);
    const scans_after = await scans(db);
    const queries = logged().slice(before);
    await db.end();

    const by_origin = new Map();
    const by_statement = new Map();
    for (const q of queries) {
        const o = origin(q.at);
        by_origin.set(o, (by_origin.get(o) || 0) + 1);
        const s = q.q.replace(/\s+/g, " ").replace(/\$\d+/g, "?").trim().slice(0, 110);
        by_statement.set(s, (by_statement.get(s) || 0) + 1);
    }
    const rank = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

    console.log(
        `\n=== scene read === status ${res.status}  ${wall_ms} ms  ` +
        `${queries.length} queries  ${scans_after - scans_before} scans`
    );
    console.log(
        `    returned: ${body.class_instances?.length} classes, ` +
        `${body.relationclasses_instances?.length} relations, ` +
        `${body.role_instances?.length} scene roles, ` +
        `${body.port_instances?.length} scene ports, ` +
        `${body.attribute_instances?.length} scene attributes`
    );
    for (const [k, n] of rank(by_origin, 6)) console.log(`${String(n).padStart(7)}  ${k}`);
    console.log("  -- most frequent statements --");
    for (const [k, n] of rank(by_statement, 12)) console.log(`${String(n).padStart(7)}  ${k}`);
    if (res.status !== 200) process.exit(1);
})().catch((e) => {
    console.error("ERR", e);
    process.exit(1);
});
