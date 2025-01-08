import * as jwt from "jsonwebtoken";
import * as process from "process";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function authenticate_token(req, res, next): void {
    const authHeader = req.headers.authorization;
    const authCookie = req.cookies.authcookie;
    const auth = authHeader ? authHeader.split(" ")[1] : authCookie;

    if (!auth) {
        res.status(401).send("No token provided");
        return;
    }

    if (auth.trim() === "") {
        res.status(401).send("Empty token provided");
        return;
    }

    try {
        req.body.tokendata = jwt.verify(auth, process.env.JWT_SECRET as string);
        next();
    } catch (err) {
        res.status(401).send("Invalid token");
    }
}
