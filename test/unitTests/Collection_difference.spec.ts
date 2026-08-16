import { expect } from "chai";
import {
    ClassInstance,
    ObjectInstance,
    SceneInstance,
} from "../../../mmar-global-data-structure";

/**
 * @description - The smallest thing with a uuid that get_collection_difference
 * accepts. The function only ever reads get_uuid().
 */
function obj(uuid: string): ObjectInstance {
    return new ObjectInstance(uuid);
}

/**
 * @description - Any ObjectInstance exposes the comparison, so one stands in for
 * the shared implementation.
 */
const diff = <T extends ObjectInstance>(incoming: T[], current: T[]) =>
    obj("subject").get_collection_difference(incoming, current);

describe("get_collection_difference", () => {
    it("reports objects only in the incoming collection as added", () => {
        const { added, removed, modified } = diff([obj("a"), obj("b")], [obj("a")]);
        expect(added.map((o) => o.get_uuid())).to.deep.equal(["b"]);
        expect(removed).to.be.empty;
        expect(modified.map((o) => o.get_uuid())).to.deep.equal(["a"]);
    });

    it("reports objects only in the stored collection as removed", () => {
        const { added, removed } = diff([obj("a")], [obj("a"), obj("gone")]);
        expect(added).to.be.empty;
        expect(removed.map((o) => o.get_uuid())).to.deep.equal(["gone"]);
    });

    it("returns the incoming object for a modification, not the stored one", () => {
        // The caller writes what it finds in `modified`, so it must be the version
        // the client sent, never the copy already in the database.
        const incoming = obj("a");
        incoming.set_name("new name");
        const stored = obj("a");
        stored.set_name("old name");

        const { modified } = diff([incoming], [stored]);
        expect(modified).to.have.lengthOf(1);
        expect(modified[0].get_name()).to.equal("new name");
        expect(modified[0]).to.equal(incoming);
    });

    it("keeps the first occurrence when a uuid is repeated", () => {
        const first = obj("dup");
        first.set_name("first");
        const second = obj("dup");
        second.set_name("second");

        const { modified } = diff([first, second], [obj("dup")]);
        expect(modified[0].get_name()).to.equal("first");
    });

    it("treats an empty incoming collection as removing everything", () => {
        const { added, removed, modified } = diff([], [obj("a"), obj("b")]);
        expect(added).to.be.empty;
        expect(modified).to.be.empty;
        expect(removed.map((o) => o.get_uuid())).to.deep.equal(["a", "b"]);
    });

    it("treats an empty stored collection as adding everything", () => {
        const { added, removed, modified } = diff([obj("a"), obj("b")], []);
        expect(removed).to.be.empty;
        expect(modified).to.be.empty;
        expect(added.map((o) => o.get_uuid())).to.deep.equal(["a", "b"]);
    });

    it("survives a missing stored collection", () => {
        const incoming = [obj("a")];
        const { added, removed } = diff(
            incoming,
            undefined as unknown as ObjectInstance[]
        );
        expect(added).to.equal(incoming);
        expect(removed).to.be.empty;
    });

    it("survives a missing incoming collection", () => {
        const current = [obj("a")];
        const { added, removed } = diff(
            undefined as unknown as ObjectInstance[],
            current
        );
        expect(added).to.be.empty;
        expect(removed).to.equal(current);
    });

    it("scales linearly rather than quadratically", function () {
        // 4,000 objects is 16 million comparisons under the previous
        // includes()/find() implementation, which took seconds. The point is the
        // shape of the growth, so the bound is deliberately loose.
        this.timeout(5_000);
        const n = 4_000;
        const current = Array.from({ length: n }, (_, i) => obj(`u${i}`));
        const incoming = Array.from({ length: n }, (_, i) => obj(`u${i + n / 2}`));

        const started = Date.now();
        const { added, removed, modified } = diff(incoming, current);
        const elapsed = Date.now() - started;

        expect(added).to.have.lengthOf(n / 2);
        expect(removed).to.have.lengthOf(n / 2);
        expect(modified).to.have.lengthOf(n / 2);
        expect(elapsed, `took ${elapsed}ms`).to.be.lessThan(500);
    });
});

describe("SceneInstance collection differences", () => {
    /**
     * @description - A class instance with a given uuid and display name. The
     * second constructor argument is the uuid of the meta class, not the name, so
     * the name is set separately.
     */
    function classInstance(uuid: string, name: string): ClassInstance {
        const instance = new ClassInstance(uuid, "meta-class");
        instance.set_name(name);
        return instance;
    }

    it("compares each collection of a scene independently", () => {
        const stored = new SceneInstance("s-1", "scene-type");
        stored.set_class_instances([
            classInstance("c-keep", "keep"),
            classInstance("c-drop", "drop"),
        ]);

        const incomingClasses = [
            classInstance("c-keep", "keep renamed"),
            classInstance("c-new", "new"),
        ];

        const d = stored.get_class_instance_difference(incomingClasses);
        expect(d.added.map((c) => c.get_uuid())).to.deep.equal(["c-new"]);
        expect(d.removed.map((c) => c.get_uuid())).to.deep.equal(["c-drop"]);
        expect(d.modified.map((c) => c.get_uuid())).to.deep.equal(["c-keep"]);
        expect(d.modified[0].get_name()).to.equal("keep renamed");
    });
});
