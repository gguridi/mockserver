import { Command } from "commander";

export const PARSER_JSON = "json";
export const PARSER_TEXT = "text";
export const PARSER_RAW = "raw";
export const PARSER_URLENCODED = "urlencoded";

export default () => {
    let program = new Command();
    program.version(require("../package.json").version);
    program
        .requiredOption(
            "-m, --mocks <string>",
            "path where the mockserver will look for files",
        )
        .option(
            "-w, --middlewares <string>",
            "path where the middlewares can be found",
        )
        .option(
            "-p, --port <string>",
            "port the mockserver will be running on",
            "8080",
        )
        .option(
            "-h, --headers <string>",
            "headers to use to decide which file to load",
            "",
        )
        .option(
            "-b, --body <string>",
            "the request body parser to use for the requests",
            PARSER_JSON,
        )
        .option(
            "-l, --log-level <string>",
            "log level to use in the mockserver",
            "info",
        );
    return program;
};
