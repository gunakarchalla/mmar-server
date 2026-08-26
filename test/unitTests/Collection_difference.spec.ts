import { expect } from "chai";
import {
    AttributeInstance,
    ClassInstance,
    ObjectInstance,
    PortInstance,
    RelationclassInstance,
    RoleInstance,
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
 * the shared implementation. A bare ObjectInstance does not describe its own
 * write, so it is always reported as modified: the cases below that use obj()
 * therefore pin the matching of the two collections, not the dirty check.
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
        // the client sent, never the copy already in the database. A bare
        // ObjectInstance is always reported, so the name here only shows which of
        // the two objects came back.
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

/**
 * @description - The point of the dirty check: an object present on both sides is
 * only reported as modified when writing it would actually put something
 * different in the database. Before this, `modified` held every object present on
 * both sides, and the callers write everything in `modified`, so an autosave that
 * moved one node of a 150-object scene rewrote all 150.
 */
describe("get_collection_difference only reports what a write would change", () => {
    /**
     * @description - An attribute instance carrying a value, the field an autosave
     * of a form actually changes.
     */
    function attribute(uuid: string, value: string): AttributeInstance {
        const attr = new AttributeInstance(uuid, "meta-attr", "", "", value);
        return attr;
    }

    /**
     * @description - A class instance with a name and the attributes given.
     */
    function node(uuid: string, name: string, attrs: AttributeInstance[] = []): ClassInstance {
        const instance = new ClassInstance(uuid, "meta-class");
        instance.set_name(name);
        instance.attribute_instance = attrs;
        return instance;
    }

    const diff_classes = (incoming: ClassInstance[], stored: ClassInstance[]) => {
        const scene = new SceneInstance("s-1", "scene-type");
        scene.set_class_instances(stored);
        return scene.get_class_instance_difference(incoming);
    };

    it("does not report an object nothing has changed", () => {
        const {added, removed, modified} = diff_classes(
            [node("c-1", "unchanged")],
            [node("c-1", "unchanged")]
        );
        expect(added).to.be.empty;
        expect(removed).to.be.empty;
        expect(modified, "an untouched object must not be written").to.be.empty;
    });

    it("reports only the object that changed, out of many", () => {
        const stored = Array.from({length: 50}, (_, i) => node(`c-${i}`, `node ${i}`));
        const incoming = Array.from({length: 50}, (_, i) => node(`c-${i}`, `node ${i}`));
        incoming[17].set_name("node 17 moved");

        const {modified} = diff_classes(incoming, stored);
        expect(modified.map((o) => o.get_uuid())).to.deep.equal(["c-17"]);
    });

    it("reports an object whose own columns match but whose attribute changed", () => {
        // The trap in dirty-checking a tree: the caller's update() walks into the
        // attributes, so skipping the parent silently drops the child's edit.
        const {modified} = diff_classes(
            [node("c-1", "same", [attribute("a-1", "edited")])],
            [node("c-1", "same", [attribute("a-1", "original")])]
        );
        expect(modified.map((o) => o.get_uuid())).to.deep.equal(["c-1"]);
    });

    it("reports an object whose attribute changed two levels down", () => {
        const with_port = (value: string) => {
            const port = new PortInstance("p-1", "meta-port");
            port.set_attribute_instance([attribute("a-1", value)]);
            const instance = node("c-1", "same");
            instance.port_instance = [port];
            return instance;
        };
        const {modified} = diff_classes([with_port("edited")], [with_port("original")]);
        expect(modified.map((o) => o.get_uuid())).to.deep.equal(["c-1"]);
    });

    it("reports an object that has gained a child", () => {
        const {modified} = diff_classes(
            [node("c-1", "same", [attribute("a-1", "v"), attribute("a-2", "v")])],
            [node("c-1", "same", [attribute("a-1", "v")])]
        );
        expect(modified.map((o) => o.get_uuid())).to.deep.equal(["c-1"]);
    });

    it("treats a null incoming column as no change, because the UPDATE coalesces it", () => {
        // update_object_instance writes coalesce($n, column): a null keeps what is
        // stored, so it can never be a difference.
        const incoming = node("c-1", "same");
        incoming.set_description(null as unknown as string);
        const stored = node("c-1", "same");
        stored.set_description("a description the client did not send back");

        expect(diff_classes([incoming], [stored]).modified).to.be.empty;
    });

    it("does not confuse a value read back from postgres with a changed one", () => {
        // The stored side comes from the database and the incoming side from the
        // client's JSON, so the same number can arrive as 5 and as "5". Writing one
        // over the other changes nothing.
        const incoming = attribute("a-1", "5");
        const stored = attribute("a-1", 5 as unknown as string);
        const holder = new PortInstance("p-1", "meta-port");
        holder.set_attribute_instance([stored]);

        expect(holder.get_attribute_instance_difference([incoming]).modified).to.be.empty;
    });

    it("reports a role instance whose reference changed", () => {
        const role = (reference: string) => {
            const r = new RoleInstance("r-1", "meta-role");
            r.uuid_has_reference_class_instance = reference;
            return r;
        };
        const scene = new SceneInstance("s-1", "scene-type");
        scene.set_role_instances([role("c-1")]);
        expect(scene.get_role_instance_difference([role("c-2")]).modified)
            .to.have.lengthOf(1);
        expect(scene.get_role_instance_difference([role("c-1")]).modified).to.be.empty;
    });

    it("reports a relation whose bendpoints moved", () => {
        const relation = (points: object[]) => {
            const from = new RoleInstance("r-from", "meta-role");
            const to = new RoleInstance("r-to", "meta-role");
            const rel = new RelationclassInstance("rc-1", "meta-relationclass", from, to, points);
            rel.set_name("edge");
            return rel;
        };
        const scene = new SceneInstance("s-1", "scene-type");
        scene.set_relationclass_instances([relation([{x: 1, y: 1}])]);

        expect(scene.get_relationclass_instance_difference([relation([{x: 1, y: 1}])]).modified,
            "an unmoved relation must not be rewritten").to.be.empty;
        expect(scene.get_relationclass_instance_difference([relation([{x: 2, y: 9}])]).modified)
            .to.have.lengthOf(1);
    });

    it("still reports a class that does not describe its own write", () => {
        // The fallback is the previous, always-write behaviour, so a write path
        // nobody has modelled is never skipped.
        const unmodelled = new ObjectInstance("o-1");
        expect(unmodelled.get_write_spec()).to.equal(null);
        expect(diff([unmodelled], [new ObjectInstance("o-1")]).modified).to.have.lengthOf(1);
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
