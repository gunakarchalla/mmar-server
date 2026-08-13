import { RequestHandler } from "express";
import { database_connection } from "../../index";
import {
    API404Error,
    BaseError,
    HTTP500Error,
} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import { v4 as uuidv4 } from "uuid";
import Metamodel_files_connection from "../../data/meta/Metamodel_files.connection";
import { File, UUID } from "../../../mmar-global-data-structure";
import { filter_object } from "../../data/services/middleware/object_filter";
import { compressImage } from "../../data/services/compress.service";
import { requireUser } from "../../data/services/middleware/auth.middleware";
import { begin_transaction } from "../../data/services/transaction";

/**
 * @classdesc - This class is used to handle all the requests for the file management.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_file_controller
 */
class Metamodel_filesController {

    get_all_files: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const sc = await Metamodel_files_connection.getAll(
                client,
                requireUser(req).uuid
            );
            if (sc instanceof Array) {
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve files`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Get a specific file by its uuid.
     * @param {UUID} req.params.uuid - The uuid of the file.
     * @param res
     * @param next
     * @yield {status: 200, body: {File}} - The file.
     * @throws {API404Error} - If the file is not found.
     * @throws {HTTP500Error} - If the acquisition of the file fails.
     * @memberof Metamodel_file_controller
     * @method
     */
    get_file_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            const uuid = (req.query.uuid as string | undefined) || req.params.uuid;
            if (!uuid) throw new API404Error("Missing file uuid parameter");

            const sc = await Metamodel_files_connection.getByUuid(
                client,
                uuid,
                requireUser(req).uuid
            );
            if (sc instanceof File) {
                res.setHeader("Content-Type", sc.get_type());
                res.send(sc.get_data());
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve file ${req.params.uuid}`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Get a specific file by its name.
     * @param {string} req.params.name - The name of the file.
     * @param res
     * @param next
     * @yield {status: 200, body: {File}} - The file.
     * @throws {API404Error} - If the file is not found.
     * @throws {HTTP500Error} - If the acquisition of the file fails.
     * @memberof Metamodel_file_controller
     * @method
     */
    get_file_by_name: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);
            const name = req.query.name as string | undefined;
            if (!name) throw new API404Error("Missing file name parameter");

            const sc = await Metamodel_files_connection.getByName(
                client,
                name,
                requireUser(req).uuid
            );
            if (sc instanceof File) {
                res.setHeader("Content-Type", sc.get_type());
                res.send(sc.get_data());
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Failed to retrieve file ${req.params.uuid}`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    post_file_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            if (!req.file) throw new API404Error(`Cannot find the file.`);

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
                // res.status(201).send(sc.get_data());

                const filteredObject = filter_object(sc, req.query.filter);
                const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
                res.status(201).json({
                    ...(typeof filteredObject === 'object' && filteredObject !== null ? filteredObject : {}),
                    url: `${publicBaseUrl}/metamodel/files/${newFile.uuid}`
                });
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Cannot post the file ${req.params.uuid}.`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    patch_file_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            let originalname, buffer, mimetype;

            if (!req.file) {
                // If no file is uploaded, check if the data is in the body
                if (!req.body["data"]["data"]) {
                    // If no data is provided in the body, throw an error
                    throw new API404Error(`Cannot find the file.`);
                }
                else {
                    // Data is in the body
                    originalname = req.body["name"];
                    buffer = Buffer.from(req.body["data"]["data"]);
                    mimetype = req.body["type"];
                }
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
            let targetWidth: number | undefined = req.query.targetWidth ? parseInt(req.query.targetWidth as string) : undefined;
            let quality: number | undefined = req.query.quality ? parseInt(req.query.quality as string) : undefined;

            if (compress) {
                if (targetWidth === undefined || targetWidth <= 0 || quality === undefined || quality <= 0 || quality > 100) {
                    throw new API404Error(`Invalid parameters for compression.`);
                }
                if (newFile.get_type().split("/")[0] !== "image") {
                    throw new API404Error(`Compression is only supported for image files.`);
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
                const filteredObject = filter_object(sc, req.query.filter);
                const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
                res.status(200).json({
                    ...(typeof filteredObject === "object" && filteredObject !== null ? filteredObject : {}),
                    url: `${publicBaseUrl}/metamodel/files/${newFile.uuid}`
                });
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Cannot patch the file ${req.params.uuid}.`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    //to do
    delete_file_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);

            // if (!req.file) throw new API404Error(`Cannot find the file.`);

            const specified_uuid = req.params.uuid;
            // const {originalname, buffer, mimetype} = req.file;
            // const newFile = File.fromJS(req.body) as File;

            // newFile.set_data(buffer);
            // newFile.set_type(mimetype);
            // newFile.set_name(originalname);
            // newFile.uuid = specified_uuid;

            const sc = await Metamodel_files_connection.deleteByUuid(
                client,
                specified_uuid,
                requireUser(req).uuid
            );

            if (Array.isArray(sc)) {
                res.status(200).send(`File with UUID ${specified_uuid} has been deleted sucessfully.`);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Cannot delete the file ${req.params.uuid}.`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    post_file: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await begin_transaction(client);

            if (!req.file) throw new API404Error(`Cannot find the file.`);

            const specified_uuid = uuidv4();
            const { originalname, buffer, mimetype } = req.file;
            const newFile = File.fromJS(req.body) as File;

            newFile.set_data(buffer);
            newFile.set_type(mimetype);
            newFile.set_name(originalname);
            newFile.uuid = specified_uuid;

            const compress = req.query.compress === "true" ? true : false;
            let targetWidth: number | undefined = req.query.targetWidth ? parseInt(req.query.targetWidth as string) : undefined;
            let quality: number | undefined = req.query.quality ? parseInt(req.query.quality as string) : undefined;

            if (compress) {
                if (targetWidth === undefined || targetWidth <= 0 || quality === undefined || quality <= 0 || quality > 100) {
                    throw new API404Error(`Invalid parameters for compression.`);
                }
                if (newFile.get_type().split("/")[0] !== "image") {
                    throw new API404Error(`Compression is only supported for image files.`);
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
                // res.status(201).send(sc.get_data());
                const publicBaseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
                res.status(201).json({ url: `${publicBaseUrl}/metamodel/files/${newFile.uuid}`, uuid: newFile.uuid });
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(`Cannot post the file ${specified_uuid}.`);
            }
            await client.query("COMMIT");
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    };

    public get_all_uuids: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();
        try {
            await begin_transaction(client);
            const queryResult = await client.query("SELECT uuid_metaobject FROM file;");
            await client.query("COMMIT");

            res.status(200).json({
                uuids: queryResult.rows.map(row => row.uuid_metaobject),
            });
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            client.release();
        }
    };
}

export default new Metamodel_filesController();
