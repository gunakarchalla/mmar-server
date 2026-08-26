import { RequestHandler } from "express";
import {
    HTTP404Error,
    BaseError,
    HTTP400Error,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import { v4 as uuidv4 } from "uuid";
import Metamodel_files_connection from "../../data/meta/Metamodel_files.connection";
import { File } from "../../../mmar-global-data-structure";
import { compressImage } from "../../data/services/compress.service";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { withTransaction } from "../../data/services/transaction";
import { environment } from "../../data/services/environment";

/**
 * @classdesc - This class is used to handle all the requests for the file management.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_file_controller
 */
class Metamodel_filesController {

    get_all_files: RequestHandler = withTransaction(async (client, req) => {
        const sc = await Metamodel_files_connection.getAll(
            client,
            requireUser(req).uuid
        );
        if (sc instanceof Array) {
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Failed to retrieve files`);
        }
    });

    /**
     * @description - Get a specific file by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the file.
     * @param res
     * @param next
     * @yield {status: 200, body: {File}} - The file.
     * @throws {HTTP404Error} - If the file is not found.
     * @throws {HTTP500Error} - If the acquisition of the file fails.
     * @memberof Metamodel_file_controller
     * @method
     */
    get_file_by_uuid: RequestHandler = withTransaction(
        async (client, req, res) => {
            const uuid = (req.query.uuid as string | undefined) || req.params.uuid;
            if (!uuid) throw new HTTP404Error("Missing file uuid parameter");

            const sc = await Metamodel_files_connection.getByUuid(
                client,
                uuid,
                requireUser(req).uuid
            );
            if (sc instanceof File) {
                // A file is answered as its own bytes under its own content type, so
                // this handler writes the response itself rather than returning a
                // payload for withTransaction to serialise as JSON. Sending here and
                // committing after is safe only because the handler reads and writes
                // nothing: there is no result a client could race.
                res.setHeader("Content-Type", sc.get_type());
                res.send(sc.get_data());
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve file ${req.params.uuid}`);
            }
        }
    );

    /**
     * @description - Get a specific file by its name.
     * @param {string} req.params.name - The name of the file.
     * @param res
     * @param next
     * @yield {status: 200, body: {File}} - The file.
     * @throws {HTTP404Error} - If the file is not found.
     * @throws {HTTP500Error} - If the acquisition of the file fails.
     * @memberof Metamodel_file_controller
     * @method
     */
    get_file_by_name: RequestHandler = withTransaction(
        async (client, req, res) => {
            const name = req.query.name as string | undefined;
            if (!name) throw new HTTP404Error("Missing file name parameter");

            const sc = await Metamodel_files_connection.getByName(
                client,
                name,
                requireUser(req).uuid
            );
            if (sc instanceof File) {
                // A file is answered as its own bytes under its own content type, so
                // this handler writes the response itself rather than returning a
                // payload for withTransaction to serialise as JSON. Sending here and
                // committing after is safe only because the handler reads and writes
                // nothing: there is no result a client could race.
                res.setHeader("Content-Type", sc.get_type());
                res.send(sc.get_data());
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve file ${req.params.uuid}`);
            }
        }
    );

    post_file_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        if (!req.file) throw new HTTP404Error(`Cannot find the file.`);

        const { originalname, buffer, mimetype } = req.file;
        const newFile = File.fromJS(req.body) as File;

        newFile.set_data(buffer);
        newFile.set_type(mimetype);
        newFile.set_name(originalname);
        newFile.set_uuid(req.params.uuid);

        const sc = await Metamodel_files_connection.create(
            client,
            newFile,
            requireUser(req).uuid
        );

        if (sc instanceof File) {
            const publicBaseUrl = environment.public_base_url || `${req.protocol}://${req.get("host")}`;
            // The ?filter is applied by withTransaction to what is returned,
            // so the file and its url are composed here and filtered there.
            return {
                ...sc,
                url: `${publicBaseUrl}/metamodel/files/${newFile.uuid}`
            };
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Cannot post the file ${req.params.uuid}.`);
        }
    }, { status: 201 });

    patch_file_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        let originalname, buffer, mimetype;

        if (!req.file) {
            // No multipart upload, so the content has to come from the JSON
            // body as a serialised buffer. Each step is checked: reading
            // req.body.data.data outright turned a malformed request into a
            // TypeError and a 500 rather than a 400.
            const payload = req.body?.["data"]?.["data"];
            if (!payload) {
                throw new HTTP400Error(
                    `No file uploaded, and the request body carries no data to store.`
                );
            }
            originalname = req.body["name"];
            buffer = Buffer.from(payload);
            mimetype = req.body["type"];
        }
        else {
            ({ originalname, buffer, mimetype } = req.file);
        }

        const specified_uuid = req.params.uuid;
        const newFile = File.fromJS(req.body) as File;

        newFile.set_data(buffer);
        newFile.set_type(mimetype);
        newFile.set_name(originalname);
        newFile.uuid = specified_uuid;

        const hardPatch = req.query.hardpatch === "true" ? true : false;
        const compress = req.query.compress === "true" ? true : false;
        const targetWidth: number | undefined = req.query.targetWidth ? parseInt(req.query.targetWidth as string) : undefined;
        const quality: number | undefined = req.query.quality ? parseInt(req.query.quality as string) : undefined;

        if (compress) {
            if (targetWidth === undefined || targetWidth <= 0 || quality === undefined || quality <= 0 || quality > 100) {
                throw new HTTP400Error(
                    `Compression needs a positive targetWidth and a quality between 1 and 100.`
                );
            }
            if (newFile.get_type().split("/")[0] !== "image") {
                throw new HTTP400Error(`Compression is only supported for image files.`);
            }
            const compressedBuffer = await compressImage(newFile, targetWidth, quality);
            newFile.set_data(compressedBuffer);
        }


        let sc;

        if (hardPatch) {
            sc = await Metamodel_files_connection.hardUpdate(
                client,
                specified_uuid,
                newFile,
                requireUser(req).uuid
            );

        } else {
            sc = await Metamodel_files_connection.update(
                client,
                specified_uuid,
                newFile,
                requireUser(req).uuid
            );
        }

        if (sc instanceof File) {
            const publicBaseUrl = environment.public_base_url || `${req.protocol}://${req.get("host")}`;
            // The ?filter is applied by withTransaction to what is returned,
            // so the file and its url are composed here and filtered there.
            return {
                ...sc,
                url: `${publicBaseUrl}/metamodel/files/${newFile.uuid}`
            };
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Cannot patch the file ${req.params.uuid}.`);
        }
    });

    delete_file_by_uuid: RequestHandler = withTransaction(async (client, req) => {
        const specified_uuid = req.params.uuid;

        const sc = await Metamodel_files_connection.deleteByUuid(
            client,
            specified_uuid,
            requireUser(req).uuid
        );

        if (Array.isArray(sc)) {
            // The uuids that were deleted, as every other delete in the API
            // answers. It used to be a prose confirmation sent as text/plain.
            return sc;
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Cannot delete the file ${req.params.uuid}.`);
        }
    });

    post_file: RequestHandler = withTransaction(async (client, req) => {
        if (!req.file) throw new HTTP404Error(`Cannot find the file.`);

        const specified_uuid = uuidv4();
        const { originalname, buffer, mimetype } = req.file;
        const newFile = File.fromJS(req.body) as File;

        newFile.set_data(buffer);
        newFile.set_type(mimetype);
        newFile.set_name(originalname);
        newFile.uuid = specified_uuid;

        const compress = req.query.compress === "true" ? true : false;
        const targetWidth: number | undefined = req.query.targetWidth ? parseInt(req.query.targetWidth as string) : undefined;
        const quality: number | undefined = req.query.quality ? parseInt(req.query.quality as string) : undefined;

        if (compress) {
            if (targetWidth === undefined || targetWidth <= 0 || quality === undefined || quality <= 0 || quality > 100) {
                throw new HTTP400Error(
                    `Compression needs a positive targetWidth and a quality between 1 and 100.`
                );
            }
            if (newFile.get_type().split("/")[0] !== "image") {
                throw new HTTP400Error(`Compression is only supported for image files.`);
            }
            const compressedBuffer = await compressImage(newFile, targetWidth, quality);
            newFile.set_data(compressedBuffer);
        }

        const sc = await Metamodel_files_connection.create(
            client,
            newFile,
            requireUser(req).uuid
        );

        if (sc instanceof File) {
            const publicBaseUrl = environment.public_base_url || `${req.protocol}://${req.get("host")}`;
            return { url: `${publicBaseUrl}/metamodel/files/${newFile.uuid}`, uuid: newFile.uuid };
        } else if (sc instanceof BaseError) {
            throw sc;
        } else {
            throw new HTTP500Error(`Cannot post the file ${specified_uuid}.`);
        }
    }, { status: 201 });

    public get_all_uuids: RequestHandler = withTransaction(async (client) => {
        const queryResult = await client.query("SELECT uuid_metaobject FROM file;");
        return { uuids: queryResult.rows.map((row) => row.uuid_metaobject) };
    });
}

export default new Metamodel_filesController();
