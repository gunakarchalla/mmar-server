import {RequestHandler} from "express";
import {route_params} from "../../data/services/middleware/uuid_params.middleware";
import {HTTP404Error} from "../../data/services/middleware/error_handling/standard_errors.middleware";
import {getUserByUsername} from "../../data/meta/User_lookup.connection";

class User_lookup_controller {
    /**
     * @description - Look up a user by exact username; returns only safe public fields.
     * @param req.params.username - Exact username to look up.
     * @yield {status: 200, body: {uuid, username, displayname}}
     * @throws {HTTP404Error} - User not found.
     */
    get_user_by_username: RequestHandler = async (req, res, next) => {
        try {
            /*
            #swagger.tags = ['Users']
            #swagger.summary = 'Look up a user by exact username (returns uuid, username, displayname only)'
            #swagger.responses[200] = { "description": "Successful operation" }
            #swagger.responses[404] = { "description": "User not found" }
            */
            const username = route_params(req).username;
            const user = await getUserByUsername(username);
            if (!user) {
                return next(new HTTP404Error(`User with username '${username}' not found`));
            }
            return res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    };
}

export default new User_lookup_controller();
