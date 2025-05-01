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

/**
 * @classdesc - This class is used to handle all the requests for the file management.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_file_controller
 */
class Metamodel_filesController {
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
            await client.query("BEGIN");

            const uuid = (req.query.uuid as string | undefined) || req.params.uuid;
            if (!uuid) throw new API404Error("Missing file uuid parameter");

            const sc = await Metamodel_files_connection.getByUuid(
                client,
                uuid,
                req.body.tokendata ? req.body.tokendata.uuid : undefined
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
            await client.query("BEGIN");
            const name = req.query.name as string | undefined;
            if (!name) throw new API404Error("Missing file name parameter");

            const sc = await Metamodel_files_connection.getByName(
                client,
                name,
                req.body.tokendata ? req.body.tokendata.uuid : undefined
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
            await client.query("BEGIN");

            if (!req.file) throw new API404Error(`Cannot find the file.`);

            const specified_uuid = req.params.uuid;
            const { originalname, buffer, mimetype } = req.file;
            const newFile = File.fromJS(req.body) as File;

            newFile.set_data(buffer);
            newFile.set_type(mimetype);
            newFile.set_name(originalname);
            newFile.uuid = specified_uuid;

            const sc = await Metamodel_files_connection.create(
                client,
                newFile,
                req.body.tokendata ? req.body.tokendata.uuid : undefined
            );

            if (sc instanceof File) {
                // res.status(201).send(sc.get_data());
                res.status(201).json({ url: `https://localhost:8001/files/${newFile.uuid}` });
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
            await client.query("BEGIN");

            if (!req.file) throw new API404Error(`Cannot find the file.`);

            const specified_uuid = req.params.uuid;
            const { originalname, buffer, mimetype } = req.file;
            const newFile = File.fromJS(req.body) as File;

            newFile.set_data(buffer);
            newFile.set_type(mimetype);
            newFile.set_name(originalname);
            newFile.uuid = specified_uuid;

            const sc = await Metamodel_files_connection.update(
                client,
                specified_uuid,
                newFile,
                req.body.tokendata ? req.body.tokendata.uuid : undefined
            );

            if (sc instanceof File) {
                // res.status(200).send(sc.get_data());
                res.status(201).json({ url: `https://localhost:8001/files/${newFile.uuid}`, uuid: newFile.uuid });
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
            await client.query("BEGIN");

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
                req.body.tokendata ? req.body.tokendata.uuid : undefined
            );

            if (typeof sc === 'string') {
                res.status(200).send(`File with UUID ${specified_uuid} has been deleted sucessfully.`);
                // res.status(201).json({url:`https://localhost:8001/files/${newFile.uuid}`});
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
            await client.query("BEGIN");

            if (!req.file) throw new API404Error(`Cannot find the file.`);

            const specified_uuid = uuidv4();
            const { originalname, buffer, mimetype } = req.file;
            const newFile = File.fromJS(req.body) as File;

            newFile.set_data(buffer);
            newFile.set_type(mimetype);
            newFile.set_name(originalname);
            newFile.uuid = specified_uuid;

            const sc = await Metamodel_files_connection.create(
                client,
                newFile,
                req.body.tokendata ? req.body.tokendata.uuid : undefined
            );

            if (sc instanceof File) {
                // res.status(201).send(sc.get_data());
                res.status(201).json({ url: `https://localhost:8001/files/${newFile.uuid}`, uuid: newFile.uuid });
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
            await client.query("BEGIN");
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
