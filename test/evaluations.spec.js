import { evaluateFile, evaluateJSON } from "../src/evaluations";

describe("evaluations", () => {
    const resources = {
        resources: [
            { id: 1, name: "resource one" },
            { id: 2, name: "resource two" },
        ],
    };

    describe("evaluate file", () => {
        it("loads data file directly", () => {
            const content = evaluateFile("./test/examples/data.json");
            expect(content).toEqual(`{ "key": "test-json" }\n`);
        });

        it("loads data file with imports inside", () => {
            const content = evaluateFile("./test/examples/rest/data.json");
            expect(JSON.parse(content)).toMatchObject(resources);
        });
    });

    describe("evaluate json", () => {
        it("loads json file directly", () => {
            const content = evaluateJSON("./test/examples/data.json");
            expect(content).toMatchObject({ key: "test-json" });
        });

        it("loads json file with imports inside", () => {
            const content = evaluateJSON("./test/examples/rest/data.json");
            expect(content).toMatchObject(resources);
        });
    });
});
