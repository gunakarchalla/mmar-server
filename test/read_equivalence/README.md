# Read-equivalence harness

The test suite does not compare the *content* of a read against what the previous
implementation returned — it asserts status codes and a few fields. That is enough for
most changes and useless for a read rewrite: an earlier attempt at batching the metamodel
reads passed all 239 tests while silently dropping the `has_table_attribute` subtree from
every attribute type, leaking join columns into the response, and reordering attributes.

This harness answers the only question that matters for such a change: **does the endpoint
still return the same document?**

`capture.js` covers four metamodel fixtures **and one scene instance** the size of a
real one — 130 class instances of 5 attributes, 20 of them with a port, 15 relations
with roles and bendpoints, built by `scene_fixture.js` from uuids derived from names
so that two builds seed identical rows. Before phase 3 it only covered the metamodel
reads, so a change to the instance read or the instance write path was invisible here.

```bash
# 1. on the unchanged code, with the server running against a fresh database
node test/reset_test_database.js
node test/read_equivalence/capture.js /tmp/ref.json

# 2. make the change, rebuild, restart, then
node test/reset_test_database.js
node test/read_equivalence/capture.js /tmp/new.json

# 3. compare
node test/read_equivalence/compare.js /tmp/ref.json /tmp/new.json
```

`compare.js` matches array members by uuid, so a reordering is reported separately from a
real difference in content, and it ignores `creation_time` / `modification_time`, which
differ between two freshly seeded databases and cannot be affected by how a read runs. It
exits non-zero when anything else differs.

## Array order is not stable, and never was

`compare.js` reports a reordering separately for a reason: two captures of **the same
build** against **two fresh databases** do not agree on order. The instance reads and
several metamodel reads have no `ORDER BY` at all, so what comes back is physical row
order, and that moves whenever a row is rewritten. Treat an ORDER line as noise unless
the query it comes from does state an order — the attribute queries do, and phase 2
traced a two-array difference to the capture rather than to the change for the same
reason.

## Measuring a write

`scene_patch_probe.js` seeds the same scene and reports what one autosave writes:

```bash
node test/reset_test_database.js
# start the server, then
node test/read_equivalence/scene_patch_probe.js
```

It counts rows in `logging.t_history`, not `pg_stat_user_tables`. Every UPDATE fires an
audit trigger that inserts one history row naming the table it wrote, so the count is
exact and is committed with the request. The `pg_stat` counters are flushed
asynchronously and, on a request that takes seconds, attribute its writes to the next
measurement window — which reads as "this request wrote nothing" followed by "this one
wrote twice as much".

Three traps this caught, worth knowing before touching a read path:

- `plainToInstance` copies **every** property of the row onto the object, so a `SELECT *`
  over a join, or an aliased helper column, becomes a field of the API response.
- An attribute type is a subtree, not a row: it carries a role and a table of columns whose
  entries are themselves attributes. Replacing the query that loads it is not the same as
  replacing the loader.
- Array order was not arbitrary. Attributes came back ordered by their `sequence` with the
  unsequenced ones first, and a join spanning many parents does not reproduce that on its
  own — it has to be stated.
