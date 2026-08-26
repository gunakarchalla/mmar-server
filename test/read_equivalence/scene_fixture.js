// A scene instance the size of a real one, built deterministically so that two
// captures of two builds seed byte-identical rows.
//
// Phases 3, 4 and 5 all change the instance read or the instance write path, and
// the four metamodel fixtures capture.js already had say nothing about either:
// they only exercise /metamodel/sceneTypes. This gives all three phases one
// scene of the size the operator stated (100-150 objects, 5-10 attributes each)
// carrying every shape the instance read has to reproduce - attributes, ports,
// roles, and relations with bendpoints.
const crypto = require("crypto");

// A uuid derived from a name rather than drawn at random: the same fixture has
// to come out of the reference build and the changed build, or compare.js has
// nothing to match on.
function uu(name) {
    const h = crypto.createHash("md5").update(`mmar-read-equivalence:${name}`).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const CLASS_INSTANCES = 130;   // class instances of the one meta class
const ATTRS_PER_CLASS = 5;     // attribute instances on each of them
const PORTED_CLASSES = 20;     // how many of them also carry a port instance
const ATTRS_PER_PORT = 2;
const RELATIONS = 15;          // relation instances, each with two roles and bendpoints

const ids = {
    scene_type: uu("scene_type"),
    scene_instance: uu("scene_instance"),
    meta_class: uu("meta_class"),
    meta_bendpoint_class: uu("meta_bendpoint_class"),
    meta_port: uu("meta_port"),
    meta_relationclass: uu("meta_relationclass"),
    meta_role_from: uu("meta_role_from"),
    meta_role_to: uu("meta_role_to"),
    meta_attribute: (i) => uu(`meta_attribute_${i}`),
    meta_attribute_type: (i) => uu(`meta_attribute_type_${i}`),
    meta_port_attribute: (i) => uu(`meta_port_attribute_${i}`),
    meta_port_attribute_type: (i) => uu(`meta_port_attribute_type_${i}`),
    class_instance: (i) => uu(`class_instance_${i}`),
    attribute_instance: (c, a) => uu(`attribute_instance_${c}_${a}`),
    port_instance: (i) => uu(`port_instance_${i}`),
    port_attribute_instance: (p, a) => uu(`port_attribute_instance_${p}_${a}`),
    relation_instance: (i) => uu(`relation_instance_${i}`),
    role_instance_from: (i) => uu(`role_instance_from_${i}`),
    role_instance_to: (i) => uu(`role_instance_to_${i}`),
};

const STRING_REGEX =
    "^([\\x09\\x0A\\x0D\\x20-\\x7E]|[\\xC2-\\xDF][\\x80-\\xBF]|\\xE0[\\xA0-\\xBF][\\x80-\\xBF]|[\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2}|\\xED[\\x80-\\x9F][\\x80-\\xBF]|\\xF0[\\x90-\\xBF][\\x80-\\xBF]{2}|[\\xF1-\\xF3][\\x80-\\xBF]{3}|\\xF4[\\x80-\\x8F][\\x80-\\xBF]{2})*$";

function meta_attribute(uuid, type_uuid, name, sequence) {
    return {
        uuid: uuid,
        name: name,
        description: `${name} of the element`,
        sequence: sequence,
        ui_component: "text-field",
        attribute_type: {
            uuid: type_uuid,
            name: `String ${name}`,
            pre_defined: true,
            default_value: "",
            regex_value: STRING_REGEX,
        },
    };
}

function metamodel() {
    const attributes = [];
    for (let a = 0; a < ATTRS_PER_CLASS; a++) {
        attributes.push(
            meta_attribute(ids.meta_attribute(a), ids.meta_attribute_type(a), `attr_${a}`, a)
        );
    }
    const port_attributes = [];
    for (let a = 0; a < ATTRS_PER_PORT; a++) {
        port_attributes.push(
            meta_attribute(
                ids.meta_port_attribute(a),
                ids.meta_port_attribute_type(a),
                `port_attr_${a}`,
                a
            )
        );
    }

    return {
        uuid: ids.scene_type,
        name: "Read equivalence scene type",
        description: "One scene type the size of a real one",
        classes: [
            {
                uuid: ids.meta_class,
                name: "Node",
                is_reusable: true,
                is_abstract: false,
                geometry: "",
                attributes: attributes,
                ports: [
                    {
                        uuid: ids.meta_port,
                        name: "Node port",
                        uuid_class: ids.meta_class,
                        geometry: "",
                        attributes: port_attributes,
                    },
                ],
            },
            {
                uuid: ids.meta_bendpoint_class,
                name: "Bendpoint",
                is_reusable: true,
                is_abstract: false,
                geometry: "",
            },
        ],
        relationclasses: [
            {
                uuid: ids.meta_relationclass,
                name: "Edge",
                is_reusable: true,
                is_abstract: false,
                bendpoint: ids.meta_bendpoint_class,
                role_from: {
                    uuid: ids.meta_role_from,
                    name: "edge_from",
                    class_references: [{uuid: ids.meta_class, min: 1, max: 1}],
                },
                role_to: {
                    uuid: ids.meta_role_to,
                    name: "edge_to",
                    class_references: [{uuid: ids.meta_class, min: 1, max: 1}],
                },
            },
        ],
    };
}

function class_instances() {
    const out = [];
    for (let c = 0; c < CLASS_INSTANCES; c++) {
        const attribute_instance = [];
        for (let a = 0; a < ATTRS_PER_CLASS; a++) {
            attribute_instance.push({
                uuid: ids.attribute_instance(c, a),
                uuid_attribute: ids.meta_attribute(a),
                assigned_uuid_class_instance: ids.class_instance(c),
                value: `node ${c} attr ${a}`,
            });
        }

        const port_instance = [];
        if (c < PORTED_CLASSES) {
            const port_attributes = [];
            for (let a = 0; a < ATTRS_PER_PORT; a++) {
                port_attributes.push({
                    uuid: ids.port_attribute_instance(c, a),
                    uuid_attribute: ids.meta_port_attribute(a),
                    assigned_uuid_port_instance: ids.port_instance(c),
                    value: `port ${c} attr ${a}`,
                });
            }
            port_instance.push({
                uuid: ids.port_instance(c),
                uuid_port: ids.meta_port,
                uuid_class_instance: ids.class_instance(c),
                name: `port ${c}`,
                geometry: "",
                attribute_instances: port_attributes,
            });
        }

        out.push({
            uuid: ids.class_instance(c),
            uuid_class: ids.meta_class,
            name: `node ${c}`,
            description: `node number ${c}`,
            geometry: "",
            visibility: true,
            coordinates_2d: {x: c * 3, y: c * 5, z: 0},
            relative_coordinate_3d: {x: c, y: 0, z: c},
            absolute_coordinate_3d: {x: c * 2, y: 1, z: c * 2},
            rotation: {x: 0, y: 0, z: 0, w: 1},
            custom_variables: {index: c},
            attribute_instance: attribute_instance,
            port_instance: port_instance,
        });
    }
    return out;
}

function relationclass_instances() {
    const out = [];
    for (let r = 0; r < RELATIONS; r++) {
        const from = ids.class_instance(r);
        const to = ids.class_instance(r + RELATIONS);
        out.push({
            uuid: ids.relation_instance(r),
            uuid_class: ids.meta_relationclass,
            uuid_relationclass: ids.meta_relationclass,
            name: `edge ${r}`,
            geometry: "",
            // Bendpoints live only here, as a text[] of JSON strings.
            line_points: [
                {x: r, y: r, z: 0},
                {x: r + 1, y: r * 2, z: 0},
            ],
            uuid_role_instance_from: ids.role_instance_from(r),
            uuid_role_instance_to: ids.role_instance_to(r),
            role_instance_from: {
                uuid: ids.role_instance_from(r),
                uuid_role: ids.meta_role_from,
                uuid_relationclass: ids.meta_relationclass,
                uuid_has_reference_class_instance: from,
            },
            role_instance_to: {
                uuid: ids.role_instance_to(r),
                uuid_role: ids.meta_role_to,
                uuid_relationclass: ids.meta_relationclass,
                uuid_has_reference_class_instance: to,
            },
        });
    }
    return out;
}

function scene_instance() {
    return {
        uuid: ids.scene_instance,
        uuid_scene_type: ids.scene_type,
        name: "Read equivalence scene",
        description: "A scene of the size the operator stated",
        class_instances: class_instances(),
        relationclasses_instances: relationclass_instances(),
    };
}

/**
 * @description - Seed the fixture through the API, exactly as a client would.
 * Returns the uuids the caller needs to read it back or patch it.
 */
async function seed(base_url, headers) {
    const meta = await fetch(`${base_url}/metamodel/sceneTypes/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(metamodel()),
    });
    const scene = await fetch(
        `${base_url}/instances/sceneTypes/${ids.scene_type}/sceneInstances`,
        {method: "POST", headers: headers, body: JSON.stringify(scene_instance())}
    );
    return {metamodel_status: meta.status, scene_status: scene.status, ids: ids};
}

module.exports = {
    ids,
    metamodel,
    scene_instance,
    seed,
    counts: {
        class_instances: CLASS_INSTANCES,
        attributes_per_class: ATTRS_PER_CLASS,
        ported_classes: PORTED_CLASSES,
        attributes_per_port: ATTRS_PER_PORT,
        relations: RELATIONS,
    },
};
