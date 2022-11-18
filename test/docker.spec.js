import frisby from "frisby";

describe("docker integration", () => {
    frisby.globalSetup({
        request: {
            baseUrl: "http://localhost:8000",
            rawBody: true,
            inspectOnFailure: true,
        },
    });

    const resources = [
        { id: 1, name: "resource one" },
        { id: 2, name: "resource two" },
    ];

    const text = (response) => {
        const buffer = new Uint8Array(response.body);
        return String.fromCharCode.apply(null, buffer);
    };

    const body = (expected) => {
        return (response) => {
            expect(text(response)).toEqual(expected);
        };
    };

    const json = (expected) => {
        return (response) => {
            expect(JSON.parse(text(response))).toMatchObject(expected);
        };
    };

    it("gets evaluated status", (done) => {
        frisby.get("/?eval status").expect("status", 418).done(done);
    });

    it("gets standard body request", (done) => {
        frisby.get("/?body").expect("status", 200).then(body("GET with body")).done(done);
    });

    it("gets standard dynamic body request", (done) => {
        frisby.get("/?dynamic content").expect("status", 200).then(body("Dynamic Content")).done(done);
    });

    it("gets standard eval request", (done) => {
        frisby
            .get("/?eval request available")
            .expect("status", 488)
            .then(body("Data:\n/?eval request available"))
            .done(done);
    });

    it("gets standard rest compose", (done) => {
        frisby
            .get("/rest?compose")
            .expect("status", 200)
            .then(json({ resources: expect.objectContaining([]) }))
            .done(done);
    });

    it("gets standard rest compose import", (done) => {
        frisby
            .get("/rest?compose import")
            .expect("status", 200)
            .then(
                json({
                    info: expect.any(String),
                    remember: expect.any(String),
                    resources,
                }),
            )
            .done(done);
    });

    it("gets standard rest compose dashed", (done) => {
        frisby
            .get("/rest?compose dashed")
            .expect("status", 200)
            .then(
                json({
                    remember: expect.any(String),
                    resources,
                }),
            )
            .done(done);
    });
});
