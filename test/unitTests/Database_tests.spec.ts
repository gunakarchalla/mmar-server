import chai from "chai";
import chaiHttp from "chai-http";
import "mocha";
import { database_connection } from "../../data/services/database_connection";

process.env.NODE_ENV = "test";

chai.use(chaiHttp);
const expect = chai.expect;
const TIMEOUT = 30000;

describe("Database test", function () {
  this.timeout(TIMEOUT);
  it("Should connect to the database", async () => {
    const connection = new database_connection();
    const client = await connection.getPool().connect();
    const res = await client.query("SELECT NOW()");
    expect(res).to.exist;
    expect(res.rowCount).to.equal(1);
  });
});
