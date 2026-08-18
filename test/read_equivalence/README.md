# Read-equivalence harness

The test suite does not compare the *content* of a read against what the previous
implementation returned — it asserts status codes and a few fields. That is enough for
most changes and useless for a read rewrite: an earlier attempt at batching the metamodel
reads passed all 239 tests while silently dropping the `has_table_attribute` subtree from
every attribute type, leaking join columns into the response, and reordering attributes.

This harness answers the only question that matters for such a change: **does the endpoint
still return the same document?**

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

Three traps this caught, worth knowing before touching a read path:

- `plainToInstance` copies **every** property of the row onto the object, so a `SELECT *`
  over a join, or an aliased helper column, becomes a field of the API response.
- An attribute type is a subtree, not a row: it carries a role and a table of columns whose
  entries are themselves attributes. Replacing the query that loads it is not the same as
  replacing the loader.
- Array order was not arbitrary. Attributes came back ordered by their `sequence` with the
  unsequenced ones first, and a join spanning many parents does not reproduce that on its
  own — it has to be stated.
