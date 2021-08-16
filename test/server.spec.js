import request from "supertest";
import { performance } from "perf_hooks";

describe("mockserver", () => {
    let mockserver;
    let args = ["node", "mockserver", "-m", "./test/examples"];

    beforeAll(() => {
        const { start } = require("../src/server");
        mockserver = start(args);
    });

    afterAll((done) => {
        mockserver.close(done);
    });

    const getResponse = (query, path = "") => {
        return request(mockserver).get(`/${path}?${query}`);
    };

    describe("request body", () => {
        it("offers the body as json by default", (done) => {
            const body = { test: "value" };
            request(mockserver)
                .post(`/?body json`)
                .send(body)
                .expect(body)
                .expect(200, done);
        });

        describe("text server", () => {
            let textServer;

            beforeAll(() => {
                const { start } = require("../src/server");
                textServer = start([...args, "--body", "text", "-p", "8081"]);
            });

            afterAll((done) => {
                textServer.close(done);
            });

            it("offers the body as string if --body text is passed", (done) => {
                const body = "this is a body string";
                request(textServer)
                    .post(`/?body text`)
                    .type("text/plain")
                    .send(body)
                    .expect(body)
                    .expect(200, done);
            });
        });

        describe("raw server", () => {
            let rawServer;

            beforeAll(() => {
                const { start } = require("../src/server");
                rawServer = start([...args, "--body", "raw", "-p", "8082"]);
            });

            afterAll((done) => {
                rawServer.close(done);
            });

            it("offers the body as raw buffer if --body raw is passed", (done) => {
                const body = "this is a raw body";
                request(rawServer)
                    .post(`/?body raw`)
                    .type("application/octet-stream")
                    .send(body)
                    .expect(body)
                    .expect(200, done);
            });
        });

        describe("urlencoded server", () => {
            let formServer;

            beforeAll(() => {
                const { start } = require("../src/server");
                const newargs = [...args, "--body", "urlencoded", "-p", "8083"];
                formServer = start(newargs);
            });

            afterAll((done) => {
                formServer.close(done);
            });

            it("offers the body as form data if --body urlencoded is passed", (done) => {
                request(formServer)
                    .post(`/?body urlencoded`)
                    .type("application/x-www-form-urlencoded")
                    .send("key=value")
                    .expect(`{"key":"value"}`)
                    .expect(200, done);
            });
        });

        describe("middlewares", () => {
            let middlewareServer;

            beforeAll(() => {
                const { start } = require("../src/server");
                const newargs = [
                    ...args,
                    "-w",
                    "./test/examples/middlewares",
                    "--body",
                    "text",
                    "-p",
                    "8087",
                ];
                middlewareServer = start(newargs);
            });

            afterAll((done) => {
                middlewareServer.close(done);
            });

            const getResponse = () => {
                return request(middlewareServer)
                    .post(`/?middlewares`)
                    .type("text/plain")
                    .send("this Is a Test");
            };

            it("uses the middleware to make body uppercase", (done) => {
                getResponse().expect("THIS IS A TEST").expect(200, done);
            });

            it("uses the middleware to create a uniqe id", (done) => {
                getResponse().expect("X-Response-ID", /\d{4}/, done);
            });

            it("uses the middleware in order declared", (done) => {
                getResponse().expect("X-Body", "THIS IS A TEST", done);
            });

            it("uses the after middleware to set cache", (done) => {
                getResponse().expect("X-Cache", /\d{4}/, done);
            });

            it("uses the after middlewares in orders", (done) => {
                getResponse().expect("X-Content", "THIS IS A TEST", done);
            });
        });
    });

    describe("status", () => {
        it("adds it from import", (done) => {
            getResponse("import status").expect(428, done);
        });

        it("adds it from eval", (done) => {
            getResponse("eval status").expect(418, done);
        });

        it("adds it from eval using request information", (done) => {
            getResponse("eval request available").expect(488, done);
        });

        it("returns 500 if something unexpected happened", (done) => {
            getResponse("exception").expect(500, done);
        });

        it("returns 500 if status is not valid", (done) => {
            getResponse("invalid status").expect(500, done);
        });
    });

    describe("headers", () => {
        const headers = [
            ["Content-Type", "text/plain; charset=utf-8"],
            ["Cache-Control", "public, max-age=300"],
            ["X-Query", "test-query"],
            ["X-Proxy", "test-proxy"],
        ];

        it("adds it from import", (done) => {
            getResponse("import header")
                .expect("X-Header-Import", "Expect This")
                .expect(200, done);
        });

        it("adds specific header from eval", (done) => {
            const time = 1530518207007;
            global.Date.now = jest.fn(() => time);
            getResponse("dynamic content")
                .expect("X-Subject-Token", time.toString())
                .expect(200, done);
        });

        it("adds multiple same headers", (done) => {
            getResponse("multiple same header")
                .expect("Set-Cookie", "A=A; path=/,B=B; path=/,C=C; path=/")
                .expect(200, done);
        });

        it.each(headers)(
            "adds all the headers it finds",
            (key, value, done) => {
                getResponse("multiple headers")
                    .expect(key, value)
                    .expect(200, done);
            },
        );

        it("adds it from eval using request information", (done) => {
            const query = "eval request available";
            getResponse(query)
                .expect("X-Query", `/?${query}`)
                .expect(488, done);
        });
    });

    describe("body", () => {
        it("adds body from import code", (done) => {
            getResponse("import body")
                .expect("Expect This Data")
                .expect(200, done);
        });

        it("adds body from import json", (done) => {
            getResponse("json body")
                .expect(`{ "key": "test-json" }`)
                .expect(200, done);
        });

        it("adds body from import json in the middle of data", (done) => {
            getResponse("json body middle")
                .expect('before\n{ "key": "test-json" }\nafter')
                .expect(200, done);
        });

        it("adds body from multiple import json", (done) => {
            getResponse("json body multiple")
                .expect(
                    'before\n{ "key": "test-json" }\nmiddle\n{ "key": "test-json" }\nafter',
                )
                .expect(200, done);
        });

        it("adds body from eval", (done) => {
            getResponse("eval body").expect('{"foo": "bar"}').expect(200, done);
        });

        it("adds it from eval using request information", (done) => {
            const query = "eval request available";
            getResponse(query).expect(`Data:\n/?${query}`).expect(488, done);
        });

        it("returns empty body if not present", (done) => {
            getResponse("empty body").expect("").expect(204, done);
        });

        it("returns exception message if something unexpected happened", (done) => {
            getResponse("exception")
                .expect("Unable to evaluate boom!")
                .expect(500, done);
        });

        it("returns exception message if status is not valid", (done) => {
            getResponse("invalid status")
                .expect("Response code should be valid string")
                .expect(500, done);
        });

        describe("multiple resources", () => {
            const resources = {
                resources: [
                    { id: 1, name: "resource one" },
                    { id: 2, name: "resource two" },
                ],
            };

            it("composes from multiple files", (done) => {
                getResponse("compose", "rest")
                    .expect(resources)
                    .expect(200, done);
            });

            it("composes from multiple json files recursively", (done) => {
                getResponse("compose import", "rest")
                    .expect((res) => expect(res.body).toMatchObject(resources))
                    .expect(200, done);
            });

            it("composes from paths with dashes without problems", (done) => {
                getResponse("compose dashed", "rest")
                    .expect((res) => expect(res.body).toMatchObject(resources))
                    .expect(200, done);
            });
        });
    });

    it("does not start with an invalid body parser", () => {
        const { start } = require("../src/server");
        expect(() => {
            start([...args, "--body", "foo", "-p", "8085"]);
        }).toThrowError("Unknown body parser foo");
    });

    it("does not stop if can't find the middlewares", (done) => {
        const { start } = require("../src/server");
        const server = start([...args, "-w", "random/path", "-p", "8086"]);
        server.close(done);
    });

    it("delayes response if Response-Delay header is set", (done) => {
        const start = performance.now();
        request(mockserver)
            .post(`/?response delay`)
            .expect(200)
            .expect("POST with response delayed")
            .then((err, res) => {
                const end = performance.now();
                expect(end - start).toBeGreaterThan(1500);
                done();
            });
    });
});
