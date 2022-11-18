import normalizeHeader from "header-case-normalizer";

const findHeader = (headers, header) => {
    const normalisedKey = normalizeHeader(header.toLowerCase());
    for (const key of Object.keys(headers)) {
        if (normalizeHeader(key.toLowerCase()) === normalisedKey) {
            return [normalisedKey, headers[key]];
        }
    }
    return ["", ""];
};

export const getQuery = (request) => {
    return request.query;
};

export const getPath = (request) => {
    return request.path;
};

export const getMethod = (request) => {
    return request.method.toUpperCase();
};

export const getHeadersToWatch = (options) => {
    const headers = options.headers || process.env.MOCK_HEADERS || "";
    return headers.split(",").filter((item, pos, self) => {
        return item && self.indexOf(item) == pos;
    });
};

export const getHeadersWatched = (request, options) => {
    let headers = [];
    getHeadersToWatch(options).forEach((header) => {
        const [key, value] = findHeader(request.headers, header);
        if (value) {
            headers.push(`_${key}=${value}`);
        }
    });
    return headers;
};
