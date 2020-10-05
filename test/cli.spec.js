import newProgram from "../src/cli";

describe("cli parser", () => {
    const args = ["node", "mockserver"];
    const argsValid = [...args, "-m", "value"];
    let program;

    beforeEach(() => {
        program = newProgram();
    });

    describe("'mocks' parameter", () => {
        it("is mandatory", () => {
            expect(() => {
                program.exitOverride().parse(args);
            }).toThrow();
        });

        it("is called with -m", () => {
            program.parse(argsValid);
            expect(program.mocks).toEqual("value");
        });

        it("is called with --mocks", () => {
            program.parse([...args, "--mocks", "value"]);
            expect(program.mocks).toEqual("value");
        });
    });

    describe("'log-level' parameter", () => {
        beforeEach(() => {
            program = newProgram();
        });
        it("default to info", () => {
            program.parse([...argsValid]);
            expect(program.logLevel).toEqual("info");
        });

        it("is called with -l", () => {
            program.parse([...argsValid, "-l", "debug"]);
            expect(program.logLevel).toEqual("debug");
        });

        it("is called with --log-level", () => {
            program.parse([...argsValid, "--log-level", "debug"]);
            expect(program.logLevel).toEqual("debug");
        });
    });

    describe("'port' parameter", () => {
        it("default to 8080", () => {
            program.parse([...argsValid]);
            expect(program.port).toEqual("8080");
        });

        it("is called with -p", () => {
            program.parse([...argsValid, "-p", "8088"]);
            expect(program.port).toEqual("8088");
        });

        it("is called with --port", () => {
            program.parse([...argsValid, "--port", "8088"]);
            expect(program.port).toEqual("8088");
        });
    });

    describe("'body' parameter", () => {
        it("default to 'json'", () => {
            program.parse([...argsValid]);
            expect(program.body).toEqual("json");
        });

        it("is called with -b", () => {
            program.parse([...argsValid, "-b", "text"]);
            expect(program.body).toEqual("text");
        });

        it("is called with --raw", () => {
            program.parse([...argsValid, "--body", "text"]);
            expect(program.body).toEqual("text");
        });
    });

    describe("'headers' parameter", () => {
        it("default to empty", () => {
            program.parse([...argsValid]);
            expect(program.headers).toEqual("");
        });

        it("is called with -h", () => {
            program.parse([...argsValid, "-h", "h1,h2"]);
            expect(program.headers).toEqual("h1,h2");
        });

        it("is called with --headers", () => {
            program.parse([...argsValid, "--headers", "h1,h2"]);
            expect(program.headers).toEqual("h1,h2");
        });
    });
});
