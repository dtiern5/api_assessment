import { expect } from "chai";
const request = require("supertest");
const app = require("../app.js");

describe("GET ping", () => {
  it("Returns ping", (done) => {
    request(app)
      .get("/api/ping")
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body.success).to.be.true;
        done();
      });
  });
});

describe("GET ?sortBy=likes&direction=desc", () => {
  it("Returns tag parameter error", (done) => {
    request(app)
      .get("/api/posts")
      .query({ sortBy: "likes", direction: "desc" })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        expect(res.body.error == "Tags parameter is required").to.be.true;
        done();
      });
  });
});

describe("GET ?tag=tech&sortBy=fake", () => {
  it("Returns sortBy parameter error", (done) => {
    request(app)
      .get("/api/posts")
      .query({ tag: "tech", sortBy: "likeees" })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        expect(res.body.error == "sortBy parameter is invalid").to.be.true;
        done();
      });
  });
});

describe("GET ?tag=tech&direction=random", () => {
  it("Returns direction parameter error", (done) => {
    request(app)
      .get("/api/posts")
      .query({ tag: "tech", direction: "random" })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        expect(res.body.error == "direction parameter is invalid").to.be.true;
        done();
      });
  });
});

describe("GET ?tag=tech", () => {
  it("Gets only tech tags and defaults to ascending", (done) => {
    request(app)
      .get("/api/posts")
      .query({ tag: "tech" })
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        for (let i = 0; i < res.body.length; i++) {
          if (i > 0) {
            expect(res.body[i].id).to.be.greaterThanOrEqual(res.body[i - 1].id);
          }
          expect(res.body[i].tags).includes("tech");
        }
        done();
      });
  });
});

describe("GET ?tag=tech&direction=desc", () => {
  it("Descends tech tags by ID", (done) => {
    request(app)
      .get("/api/posts")
      .query({ tag: "tech", direction: "desc" })
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        for (let i = 1; i < res.body.length; i++) {
          expect(res.body[i - 1].id).to.be.greaterThan(res.body[i].id);
        }
        done();
      });
  });
});

describe("GET ?tag=tech&tag=history&sortBy=likes&direction=desc", () => {
  it("Descends tech and history tags by likes", (done) => {
    request(app)
      .get("/api/posts")
      .query({
        tag: "tech",
        tag: "history",
        sortBy: "likes",
        direction: "desc",
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        for (let i = 0; i < res.body.length; i++) {
          if (i > 0) {
            expect(res.body[i - 1].likes).to.be.greaterThanOrEqual(
              res.body[i].likes
            );
          }
          expect(
            res.body[i].tags.includes("tech") ||
              res.body[i].tags.includes("history")
          ).to.be.true;
        }
        done();
      });
  });
});

describe("GET ?tag=tech&tag=health&sortBy=likes&direction=asc", () => {
  it("Ascends tech and health tags by popularity", (done) => {
    request(app)
      .get("/api/posts")
      .query({
        tag: "tech",
        tag: "health",
        sortBy: "popularity",
        direction: "asc",
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(200);
        for (let i = 0; i < res.body.length; i++) {
          if (i > 0) {
            expect(res.body[i].popularity).to.be.greaterThanOrEqual(
              res.body[i - 1].popularity
            );
          }
          expect(
            res.body[i].tags.includes("tech") ||
              res.body[i].tags.includes("health")
          ).to.be.true;
        }
        done();
      });
  });
});
