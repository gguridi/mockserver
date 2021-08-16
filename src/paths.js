import winston from "winston";
import path from "path";
import fs from "fs";
import { getPath, getQuery, getHeadersWatched } from "./request";
import combinatorics from "simple-combinatorics";

export const noEmpty = (item) => {
    return item;
};

const unique = (item, pos, array) => {
    return array.indexOf(item) === pos;
};

const countWildcards = (value) => {
    return (value.match(/__/g) || []).length;
};

const countPathChunks = (value) => {
    return value.split(path.sep).length;
};

export const getFiles = (request, options) => {
    let files = [];
    const filepaths = getPaths(request);
    const filenames = getFilenames(request, options);
    for (const filepath of filepaths) {
        for (const filename of filenames) {
            files.push(path.join(`${options.mocks}`, filepath, filename));
        }
    }
    return files.sort((a, b) => {
        const pathChunksCount = countPathChunks(b) - countPathChunks(a);
        const wildcardCount = countWildcards(a) - countWildcards(b);
        return pathChunksCount || wildcardCount || b.length - a.length;
    });
};

const getQueryElements = (request) => {
    const query = getQuery(request);
    return query ? query.split("&").map((param) => `--${param}`) : [];
};

const getBodyElements = (request) => {
    let body = request.body;
    if (typeof body == "object") {
        body = Object.keys(body)
            .map((key) => `${key}=${body[key]}`)
            .join("&");
    }
    return body ? [`--${body}`.toLowerCase()] : [];
};

export const getFilenames = (request, options) => {
    const elements = [].concat(
        getHeadersWatched(request, options),
        getQueryElements(request),
        getBodyElements(request),
    );
    let combinations = [[""]];
    for (let i = 1; i <= elements.length; i++) {
        combinations = combinations.concat(
            combinatorics.permuteList(elements, i, true),
        );
    }
    return combinations
        .map((file) => request.method + file.join(""))
        .filter(unique);
};

export const getPathWildcards = (request) => {
    let paths = [];
    const chunks = getPath(request).split("/").filter(noEmpty);
    const options = ["__", ""];
    const wildcards = combinatorics.permuteList(options, chunks.length, false);
    for (const combination of wildcards) {
        const replaced = chunks.map((value, i) => combination[i] || value);
        paths.push(path.join(...replaced));
    }
    return paths;
};

export const getPaths = (request) => {
    return [].concat(getPathWildcards(request));
};

export const getContent = (request, options) => {
    for (let file of getFiles(request, options)) {
        const filepath = `${file}.mock`;
        winston.debug(`Checking filepath ${filepath}`);
        if (fs.existsSync(filepath)) {
            try {
                const content = fs.readFileSync(filepath, { encoding: "utf8" });
                winston.info(`Loaded ${filepath} file for request...`);
                return [content, filepath];
            } catch (err) {
                winston.info(`Error loading response file for ${request.url}`);
            }
        }
    }
    return ["", ""];
};
