import winston from "winston";
import fs from "fs";
import path from "path";
import normalizeHeader from "header-case-normalizer";
import { noEmpty } from "./paths";

export default class Response {
    constructor(content, file, request) {
        winston.debug(`Processing request of ${file}`);
        this.file = file;
        this.request = request;
        const [status, headers, body] = this.process(content);
        this.status = this.getStatus(status);
        this.headers = this.getHeaders(headers);
        this.body = this.getBody(body);
    }

    process(content) {
        const [head, body] = content.split("\n\n");
        const [status, ...headers] = head.split("\n");
        return [status, headers, body];
    }

    getStatus(status) {
        if (status) {
            status = this.evaluate(status);
            const regex = /(?<=HTTP\/\d.\d\s{1,1})(\d{3,3})(?=[a-z0-9\s]+)/gi;
            if (!regex.test(status)) {
                throw new Error("Response code should be valid string");
            }
            return status.match(regex).join("");
        }
        return "404";
    }

    getHeaders(headers) {
        const normalised = {};
        headers = headers.filter(noEmpty);
        for (const header of headers) {
            const [key, value] = header.split(":").map((value) => value.trim());
            const headerKey = normalizeHeader(key);
            const headerValue = this.evaluate(value).trim();
            if (typeof normalised[headerKey] === "object") {
                normalised[headerKey] = [...normalised[headerKey], headerValue];
            } else if (typeof normalised[headerKey] === "string") {
                normalised[headerKey] = [normalised[headerKey], headerValue];
            } else {
                normalised[headerKey] = headerValue;
            }
        }
        return normalised;
    }

    getBody(body) {
        return body ? this.evaluate(body).trim() : "";
    }

    eval(code) {
        try {
            const request = this.request;
            const dirname = path.dirname(this.file);
            const result = eval(code);
            return typeof result !== "string" ? JSON.stringify(result) : result;
        } catch (e) {
            throw new Error(`Unable to evaluate ${code}`);
        }
    }

    evaluateCode(value) {
        const matched = /\{\{(.+?)(?=}})/gis.exec(value);
        if (matched) {
            const [_, code] = matched;
            value = value.replace(`{{${code}}}`, this.eval(code));
            return this.evaluateCode(value);
        }
        return value;
    }

    evaluateImport(value) {
        const matched = /#import ([^;]*);/gis.exec(value);
        if (matched) {
            const [_, location] = matched;
            const file = path.join(".", path.dirname(this.file), location);
            const isJS = path.extname(file) === ".js";
            const content = fs.readFileSync(file, { encoding: "utf8" });
            const result = isJS ? this.eval(content) : content;
            value = value.replace(`#import ${location};`, result.trim());
            return this.evaluateImport(value);
        }
        return value;
    }

    evaluate(value) {
        return this.evaluateCode(this.evaluateImport(value));
    }
}
