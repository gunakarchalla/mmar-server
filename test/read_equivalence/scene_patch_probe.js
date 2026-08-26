#!/usr/bin/env node
/**
 * Measure what one autosave costs.
 *
 * The clients send the whole scene on every autosave. The question this answers
 * is how much of it the server writes when the user moved one node.
 *
 * The counter is logging.t_history, not pg_stat_user_tables: every UPDATE fires
 * an audit trigger that inserts one history row naming the table it wrote, so
 * the count is exact and, unlike the pg_stat counters, is committed with the
 * request rather than flushed some time afterwards. pg_stat's asynchronous flush
 * is slower than it looks and attributes a slow request's writes to the next
 * measurement window.
 *
 *   node test/reset_test_database.js
 *   # start the server, then
 *   node test/read_equivalence/scene_patch_probe.js
 *
 * Seeds the scene fixture itself, so it must run against a fresh database.
 */
require("dotenv").config({path: ".env.test"});
const {Client} = require("pg");
const fixture = require("./scene_fixture");

const B = "http://localhost:8000";

/**
 * @description - The id of the last audit row, so that what a request wrote can
 * be read back afterwards.
 */
async function history_mark(db) {
    const res = await db.query("SELECT coalesce(max(id), 0) AS id FROM logging.t_history");
    return Number(res.rows[0].id);
}

/**
 * @description - Which rows were written since the mark, by table.
 */
async function written_since(db, mark) {
    const res = await db.query(
        `SELECT tabname, count(*)::int AS rows FROM logging.t_history
          WHERE id > $1 AND operation = 'UPDATE' GROUP BY tabname ORDER BY tabname`,
        [mark]
    );
    const rows_updated = {};
    let total = 0;
    for (const r of res.rows) {
        rows_updated[r.tabname] = r.rows;
        total += r.rows;
    }
    return {rows_updated, rows_updated_total: total};
}

(async () => {
    const token = await (
        await fetch(`${B}/login/signin`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: "admin", password: "admin"}),
        })
    ).json();
    const H = {"Content-Type": "application/json", Authorization: `Bearer ${token}`};

    const seeded = await fixture.seed(B, H);
    if (seeded.scene_status >= 300) {
        throw new Error(`seeding the scene answered ${seeded.scene_status}`);
    }
    console.log(
        `seeded: ${fixture.counts.class_instances} class instances x ` +
        `${fixture.counts.attributes_per_class} attributes, ` +
        `${fixture.counts.ported_classes} ports, ${fixture.counts.relations} relations`
    );

    // The body a client autosaves: the whole scene, one node moved and renamed.
    const body = fixture.scene_instance();
    body.class_instances[0].name = "node 0 - moved";
    body.class_instances[0].coordinates_2d = {x: 999, y: 999, z: 0};

    const db = new Client({
        user: process.env.PGUSER, host: process.env.PGHOST, password: process.env.PGPASSWORD,
        port: Number(process.env.PGPORT) || 5432, database: process.env.PGDATABASE,
    });
    await db.connect();

    // No warm-up PATCH: it would apply the very edit being measured, and the
    // measured request would then be an autosave of a scene nothing had changed.
    const mark = await history_mark(db);
    const started = Date.now();
    const res = await fetch(`${B}/instances/sceneInstances/${fixture.ids.scene_instance}`, {
        method: "PATCH", headers: H, body: JSON.stringify(body),
    });
    const wall_ms = Date.now() - started;
    const measured = await written_since(db, mark);

    // And the autosave that follows it, which changes nothing at all: the shape
    // that dominates when 10-15 editors hold a scene open.
    const idle_mark = await history_mark(db);
    const idle_started = Date.now();
    await fetch(`${B}/instances/sceneInstances/${fixture.ids.scene_instance}`, {
        method: "PATCH", headers: H, body: JSON.stringify(body),
    });
    const idle_wall_ms = Date.now() - idle_started;
    const idle = await written_since(db, idle_mark);
    await db.end();

    console.log(JSON.stringify({
        one_object_moved: {status: res.status, wall_ms, ...measured},
        nothing_changed: {wall_ms: idle_wall_ms, ...idle},
    }, null, 2));
    if (res.status !== 200) process.exit(1);
})().catch((e) => {
    console.error("ERR", e);
    process.exit(1);
});
