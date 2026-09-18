import { expect } from "chai";
import {
    add_table_cell,
    add_table_row,
    AttributeInstance,
    move_table_row,
    remove_table_row,
    table_columns_in_order,
    table_row_count,
    table_rows,
    table_violations,
} from "../../../mmar-global-data-structure";

/**
 * @description - The table helpers of mmar-global-data-structure (Instance_tables),
 * which the server's table rule and both clients build on.
 */

const COLUMNS = [
    { attribute: { uuid: "value" }, sequence: 2 },
    { attribute: { uuid: "name" }, sequence: 1 },
];

function cell(uuid: string, column: string, row: number) {
    const instance = new AttributeInstance(uuid, column, undefined as never, undefined as never, uuid);
    instance.table_row = row;
    instance.table_attribute_reference = "table";
    return instance;
}

/** A two-column table with `rows` full rows; cell uuids are `<column><row>`. */
function table(rows: number) {
    const instance = new AttributeInstance("table", "table-attribute", undefined as never, undefined as never, "");
    for (let row = 0; row < rows; row++) {
        instance.table_attributes.push(cell(`name${row}`, "name", row), cell(`value${row}`, "value", row));
    }
    return instance;
}

const grid = (instance: AttributeInstance) =>
    table_rows(instance, COLUMNS).map((row) => row.map((c) => c?.uuid));

describe("Instance_tables", () => {
    it("orders columns by sequence", () => {
        expect(table_columns_in_order(COLUMNS).map((c) => c.attribute.uuid)).to.deep.equal(["name", "value"]);
    });

    it("counts rows from the highest row, and an empty table as none", () => {
        expect(table_row_count(table(3))).to.equal(3);
        expect(table_row_count(table(0))).to.equal(0);
    });

    it("lays the cells out by row and column, whatever order they are stored in", () => {
        const instance = table(2);
        instance.table_attributes.reverse();
        expect(grid(instance)).to.deep.equal([["name0", "value0"], ["name1", "value1"]]);
    });

    it("leaves a position without a cell empty", () => {
        const instance = table(2);
        instance.table_attributes.splice(0, 1);
        expect(grid(instance)).to.deep.equal([[undefined, "value0"], ["name1", "value1"]]);
    });

    it("adds a row at the end, numbering its cells and pointing them at the table", () => {
        const instance = table(2);
        const added = [cell("nameX", "name", 99), cell("valueX", "value", 99)];
        added.forEach((c) => (c.table_attribute_reference = "elsewhere"));

        expect(add_table_row(instance, added)).to.equal(2);
        expect(added.map((c) => [c.table_row, c.table_attribute_reference])).to.deep.equal([[2, "table"], [2, "table"]]);
        expect(grid(instance)[2]).to.deep.equal(["nameX", "valueX"]);
    });

    it("fills in a missing cell", () => {
        const instance = table(2);
        instance.table_attributes.splice(0, 1);
        add_table_cell(instance, 0, cell("name0-new", "name", 99));
        expect(grid(instance)[0]).to.deep.equal(["name0-new", "value0"]);
        expect(table_violations(instance, COLUMNS)).to.be.empty;
    });

    it("removes a row and moves the rows below it up, in the same array", () => {
        const instance = table(3);
        const cells = instance.table_attributes;

        const removed = remove_table_row(instance, 1);

        expect(removed.map((c) => c.uuid)).to.deep.equal(["name1", "value1"]);
        expect(instance.table_attributes).to.equal(cells);
        expect(grid(instance)).to.deep.equal([["name0", "value0"], ["name2", "value2"]]);
        expect(table_violations(instance, COLUMNS)).to.be.empty;
    });

    it("moves a row down and up, shifting the rows in between", () => {
        const instance = table(3);
        expect(move_table_row(instance, 0, 2)).to.equal(true);
        expect(grid(instance)).to.deep.equal([["name1", "value1"], ["name2", "value2"], ["name0", "value0"]]);

        expect(move_table_row(instance, 2, 0)).to.equal(true);
        expect(grid(instance)).to.deep.equal([["name0", "value0"], ["name1", "value1"], ["name2", "value2"]]);
        expect(instance.table_attributes.map((c) => c.table_row)).to.deep.equal([0, 0, 1, 1, 2, 2]);
    });

    it("does not move a row to where it is, or out of range", () => {
        const instance = table(2);
        expect(move_table_row(instance, 1, 1)).to.equal(false);
        expect(move_table_row(instance, 0, 2)).to.equal(false);
        expect(move_table_row(instance, -1, 0)).to.equal(false);
        expect(grid(instance)).to.deep.equal([["name0", "value0"], ["name1", "value1"]]);
    });

    it("works on plain objects as well as on revived instances", () => {
        const plain = { uuid: "table", table_attributes: undefined as unknown as { uuid: string; uuid_attribute: string; table_row: number; table_attribute_reference: string }[] };
        add_table_row(plain, [{ uuid: "a", uuid_attribute: "name", table_row: 0, table_attribute_reference: "" }]);
        expect(table_rows(plain, COLUMNS).map((row) => row.map((c) => c?.uuid))).to.deep.equal([["a", undefined]]);
    });

    describe("table_violations", () => {
        it("accepts a table that keeps the rules", () => {
            expect(table_violations(table(3), COLUMNS)).to.be.empty;
            expect(table_violations(table(0), COLUMNS)).to.be.empty;
        });

        it("reports a gap in the rows", () => {
            const instance = table(3);
            remove_table_row(instance, 2);
            instance.table_attributes.filter((c) => c.table_row === 1).forEach((c) => (c.table_row = 2));
            expect(table_violations(instance, COLUMNS)).to.deep.equal(["row 1 is missing: rows are numbered from 0 without gaps"]);
        });

        it("reports a cell without a valid row", () => {
            const instance = table(1);
            instance.table_attributes[0].table_row = undefined as unknown as number;
            instance.table_attributes[1].table_row = 0.5;
            expect(table_violations(instance, COLUMNS)).to.have.length(2);
        });

        it("reports two cells at one position, a foreign column and another table's cell", () => {
            const instance = table(1);
            const twin = cell("twin", "name", 0);
            const stray = cell("stray", "other", 0);
            const foreign = cell("foreign", "value", 0);
            foreign.table_row = 1;
            foreign.table_attribute_reference = "another-table";
            instance.table_attributes.push(twin, stray, foreign);

            const problems = table_violations(instance, COLUMNS);
            expect(problems.some((p) => p.includes("more than one cell of attribute name"))).to.equal(true);
            expect(problems.some((p) => p.includes("stray is not in a column"))).to.equal(true);
            expect(problems.some((p) => p.includes("foreign belongs to another table"))).to.equal(true);
        });

        it("reports cells on an attribute that is not a table", () => {
            expect(table_violations(table(1), [])).to.deep.equal(["it is not a table but holds 2 cell(s)"]);
            expect(table_violations(table(0), [])).to.be.empty;
        });
    });
});
