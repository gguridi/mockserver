import fs from "fs";
import path from "path";

export const evaluateLocation = (sourceFile, relativeFile) => {
    const sourceDir = path.dirname(sourceFile);
    return path.join(".", sourceDir, relativeFile);
};

export const evaluateCode = (code) => {
    return (request, dirname) => {
        try {
            const result = eval(code);
            return typeof result !== "string" ? JSON.stringify(result) : result;
        } catch (e) {
            throw new Error(`Unable to evaluate ${code}`);
        }
    };
};

export const evaluateContent = (file) => {
    return (request, dirname) => {
        const isJS = path.extname(file) === ".js";
        const content = fs.readFileSync(file, { encoding: "utf8" });
        return isJS ? evaluateCode(content)(request, dirname) : content;
    };
};

export const evaluateInline = (content) => {
    return (request, dirname) => {
        const matched = /\{\{(.+?)(?=}})/gis.exec(content);
        if (matched) {
            const [_, code] = matched;
            const result = evaluateCode(code)(request, dirname);
            content = content.replace(`{{${code}}}`, result);
            return evaluateInline(content)(request, dirname);
        }
        return content;
    };
};

export const evaluateImport = (content, file) => {
    return (request, dirname) => {
        const matched = /#import (.+?)(?=;)/gis.exec(content);
        if (matched) {
            const [_, importLocation] = matched;
            const ifile = evaluateLocation(file, importLocation);
            const imported = evaluateContent(ifile)(request, dirname);
            const replaceRegex = new RegExp(`"?#import ${importLocation};"?`);
            content = content.replace(replaceRegex, imported.trim());
            return evaluateImport(content, file)(request, dirname);
        }
        return content;
    };
};

/**
 * Accesses directly a data file from the mockserver, importing the referenced
 * files and evaluating the inline code to offer the result directly in
 * javascript.
 *
 * Useful when you want to access data files from outside the mockserver.
 *
 * @param string   file          File to evaluate.
 * @param object   [request={}]  Request to pass to the file in case inline code needs to resolve it.
 *
 * @return string Returns the contents of the file fully evaluated.
 */
export const evaluateFile = (file, request = {}) => {
    const dirname = path.dirname(file);
    const content = evaluateContent(file)(request, dirname);
    const imported = evaluateImport(content, file)(request, dirname);
    return evaluateInline(imported)(request, dirname);
};

/**
 * Accesses directly a JSON file from the mockserver, importing the referenced
 * files and evaluating the inline code to offer the final JSON directly in
 * javascript as an object.
 *
 * Useful when you want to access data files from outside the mockserver.
 *
 * @param string   file          JSON file to evaluate.
 * @param object   [request={}]  Request to pass to the file in case inline code needs to resolve it.
 *
 * @return string Returns the JSON of the file fully evaluated.
 */
export const evaluateJSON = (file, request = {}) => {
    return JSON.parse(evaluateFile(file, request));
};
