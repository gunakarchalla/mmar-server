import {database_connection} from "../database_connection";

let databaseOnline = false;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export async function database_test(req, res, next): void {
    if (!databaseOnline) {
        databaseOnline = await isDatabaseOnline();
        res.status(503).send('Service Unavailable: Database is offline');
    } else {
        next();
    }

}


async function isDatabaseOnline() {
    try {
        const db = database_connection.getInstance();
        const client = await db.getPool().connect();
        await client.query('SELECT 1;');
        client.release();
        return true;
    } catch (error) {
        return false;
    }
}

function fibonacci(n: number): number {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

export async function testDatabaseConnection(attempt: number): Promise<void> {
    const isOnline = await isDatabaseOnline();
    if (!isOnline) {
        databaseOnline = false;
        console.log(`Failed to connect to database. Attempt ${attempt}`);
        const delay = fibonacci(attempt) * 1000; // Convert Fibonacci number to milliseconds
        console.log(`Retrying in ${delay / 1000} seconds...`);
        setTimeout(() => {
            testDatabaseConnection(attempt + 1);
        }, delay);
    } else {
        databaseOnline = true;
        console.log('Database connection established.');
    }
}
