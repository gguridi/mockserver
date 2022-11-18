import httpMocks from "node-mocks-http";
import { getContent } from "../src/paths";
import Response from "../src/response";

describe("response parser", () => {
    let request;

    const createRequest = (data) => {
        return httpMocks.createRequest({
            method: "GET",
            ...data,
        });
    };

    beforeEach(() => {
        request = createRequest({});
    });

    const getResponse = (query, data = {}) => {
        request = createRequest({ url: `/?${encodeURIComponent(query)}`, ...data });
        const options = { mocks: "./test/examples" };
        const [content, filepath] = getContent(request, options);
        return new Response(content, filepath, request);
    };

    describe("status", () => {
        it("adds it from import", () => {
            const response = getResponse("import status");
            expect(response.status).toBe("428");
        });

        it("adds it from eval", () => {
            const response = getResponse("eval status");
            expect(response.status).toBe("418");
        });

        it("adds it from eval using request information", () => {
            const response = getResponse("eval request available");
            expect(response.status).toBe("488");
        });

        it("returns 404 if not present", () => {
            const response = getResponse("unknown", { method: "OPTIONS" });
            expect(response.status).toEqual("404");
        });

        it("returns exception if status is not valid", () => {
            expect(() => {
                getResponse("invalid status");
            }).toThrowError("Response code should be valid string");
        });
    });

    describe("headers", () => {
        const headers = [
            ["Content-Type", "text/plain"],
            ["Cache-Control", "public, max-age=300"],
            ["X-Query", "test-query"],
            ["X-Proxy", "test-proxy"],
        ];

        it("adds it from import", () => {
            const response = getResponse("import header");
            expect(response.headers["X-Header-Import"]).toEqual("Expect This");
        });

        it("adds specific header from eval", () => {
            const time = 1530518207007;
            global.Date.now = jest.fn(() => time);
            const response = getResponse("dynamic content");
            expect(response.headers["X-Subject-Token"]).toEqual(time.toString());
        });

        it("adds multiple same headers", () => {
            const response = getResponse("multiple same header");
            const setCookie = response.headers["Set-Cookie"];
            expect(setCookie).toHaveLength(3);
            expect(setCookie[0]).toEqual("A=A; path=/");
            expect(setCookie[2]).toEqual("C=C; path=/");
        });

        it.each(headers)("adds all the headers it finds", (key, value) => {
            const response = getResponse("multiple headers");
            expect(response.headers[key]).toEqual(value);
        });

        it("adds it from eval using request information", () => {
            const query = "eval request available";
            const response = getResponse(query);
            expect(response.headers["X-Query"]).toEqual(`/?${query}`);
        });
    });

    describe("body", () => {
        it("adds body from import code", () => {
            const response = getResponse("import body");
            expect(response.body).toBe("Expect This Data");
        });

        it("adds body from import json", () => {
            const response = getResponse("json body");
            expect(response.body).toBe(`{ "key": "test-json" }`);
        });

        it("adds body from import json in the middle of data", () => {
            const response = getResponse("json body middle");
            expect(response.body).toBe('before\n{ "key": "test-json" }\nafter');
        });

        it("adds body from multiple import json", () => {
            const response = getResponse("json body multiple");
            const expected = 'before\n{ "key": "test-json" }\nmiddle\n{ "key": "test-json" }\nafter';
            expect(response.body).toBe(expected);
        });

        it("adds body from eval", () => {
            const response = getResponse("eval body");
            expect(response.body).toBe('{"foo": "bar"}');
        });

        it("adds body from multiple eval", () => {
            const response = getResponse("multiple eval");
            expect(response.body).toEqual("This is one eval\nThis is another eval");
        });

        it("adds body from eval multiline", () => {
            const response = getResponse("eval multiline");
            expect(response.body).toBe("Nope, not a post");
        });

        it("adds it from eval using request information", () => {
            const query = "eval request available";
            const response = getResponse(query);
            expect(response.body).toEqual(`Data:\n/?${query}`);
        });

        it("adds it from eval using dirname information", () => {
            const query = "eval dirname available";
            const response = getResponse(query);
            expect(response.body).toEqual(`{"key":"test-json"}`);
        });

        it("returns empty body if not present", () => {
            const response = getResponse("unknown", { method: "OPTIONS" });
            expect(response.body).toEqual("");
        });
    });
});
