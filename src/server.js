import bodyParser from "body-parser";
import express from "express";
import path from "path";
import winston from "winston";
import newProgram, { PARSER_JSON, PARSER_RAW, PARSER_TEXT, PARSER_URLENCODED } from "./cli";
import { getContent } from "./paths";
import Response from "./response";
export { evaluateFile, evaluateJSON } from "./evaluations";

export const logging = (level) => {
    const logger = winston.createLogger({
        level: level,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.cli(),
            winston.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} ${level}: ${message}`;
            }),
        ),
        transports: [new winston.transports.Console()],
    });
    winston.add(logger);
    winston.info(`Log level set to ${level}`);
};

const parser = (requested) => {
    winston.info(`Using parser ${requested}`);
    switch (requested) {
        case PARSER_JSON:
            return bodyParser.json();
        case PARSER_TEXT:
            return bodyParser.text({ type: "text/*" });
        case PARSER_RAW:
            return bodyParser.raw();
        case PARSER_URLENCODED:
            return bodyParser.urlencoded();
        default:
            throw new Error(`Unknown body parser ${requested}`);
    }
};

const middlewares = (order, options) => {
    if (options.middlewares) {
        const file = path.join(process.env.PWD, options.middlewares, order);
        try {
            winston.info(`Loading middlewares from ${file}`);
            const middlewares = require(file);
            return Object.values(middlewares);
        } catch (e) {
            winston.info(`Unable to load ${file} middlewares: ${e.message}`);
        }
    }
    return [(req, res, next) => next()];
};

const delay = (res) => {
    const delay = parseInt(res.get("Response-Delay"), 10);
    if (!isNaN(delay)) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
    }
};

const handler = (program) => (req, res, next) => {
    winston.debug(`Received request ${req.url} with body ${JSON.stringify(req.body)}`);

    try {
        const [content, filepath] = getContent(req, program);
        if (content) {
            const response = new Response(content, filepath, req);
            Object.entries(response.headers).forEach(([key, value]) => {
                res.header(key, value);
            });
            res.status(parseInt(response.status));
            res.body = response.body;
        } else {
            res.status(404);
            res.body = "Response file not found!";
        }
    } catch (e) {
        winston.error(`Response error: ${e.message}`);
        res.status(500);
        res.end(e.message);
    }
    next();
};

export const start = (args) => {
    let program = newProgram();
    program.parse(args);
    const options = program.opts();

    logging(options.logLevel);

    const app = express();
    app.use(parser(options.body));
    app.use(...middlewares("before.js", options));
    app.all("*", handler(options));
    app.use(...middlewares("after.js", options));
    app.use((_, res, next) => {
        delay(res);
        res.send(res.body);
    });

    const mockserver = app.listen(options.port, () => {
        const host = mockserver.address().address;
        const port = mockserver.address().port;
        winston.info(`Mockserver serving ${options.mocks} at http://${host}:${port}`);
    });
    return mockserver;
};
