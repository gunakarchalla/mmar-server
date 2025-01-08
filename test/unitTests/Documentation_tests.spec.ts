import "mocha";
import chai from "chai";
import chaiHttp from "chai-http";

process.env.NODE_ENV = "test";

chai.use(chaiHttp);
const expect = chai.expect;
const API_URL = "http://localhost:8000";
const TIMEOUT = 30000;

describe("Documentation test", function () {
  const server = chai.request(API_URL);
  this.timeout(TIMEOUT);

  it("Should return the documentation page over http", async () => {
    const res1 = await server.get("/docs/");
    expect(res1).to.exist;
    expect(res1.status).to.equal(200);
  });
});
