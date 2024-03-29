import httpMocks from "node-mocks-http";
import { getContent, getFilenames, getFiles, getPathWildcards } from "../src/paths";

describe("paths to use for the request", () => {
    let request;

    const createRequest = (data) => {
        return httpMocks.createRequest({
            method: "GET",
            url: "/test/42/details?",
            body: "body",
            headers: {
                "header-A": "valueA",
                "Header-b": "valueB",
                "header-c": "valueC",
            },
            ...data,
        });
    };

    beforeEach(() => {
        request = createRequest({});
    });

    describe("filename permutations", () => {
        const headers = "header-A,header-B";
        const expected = [
            ["GET"],
            ["GET_Header-A=valueA"],
            ["GET_Header-B=valueB"],
            ["GET--body"],
            ["GET_Header-B=valueB_Header-A=valueA"],
            ["GET--body_Header-A=valueA"],
            ["GET_Header-A=valueA_Header-B=valueB"],
            ["GET--body_Header-B=valueB"],
            ["GET_Header-A=valueA--body"],
            ["GET_Header-B=valueB--body"],
            ["GET--body_Header-B=valueB_Header-A=valueA"],
            ["GET_Header-B=valueB--body_Header-A=valueA"],
            ["GET--body_Header-A=valueA_Header-B=valueB"],
            ["GET_Header-A=valueA--body_Header-B=valueB"],
            ["GET_Header-B=valueB_Header-A=valueA--body"],
            ["GET_Header-A=valueA_Header-B=valueB--body"],
        ];

        it.each(expected)("uses the watched headers from options", (expected) => {
            const permutations = getFilenames(request, { headers });
            expect(permutations).toContainEqual(expected);
        });

        it.each(expected)("uses the watched headers from MOCK_HEADERS envvar", (expected) => {
            process.env["MOCK_HEADERS"] = headers;
            expect(getFilenames(request, {})).toContainEqual(expected);
            delete process.env["MOCK_HEADERS"];
        });

        it.each(expected)("removes the query parameters from path", (expected) => {
            request = createRequest({ url: "/test/42/details?this is to ignore" });
            const permutations = getFilenames(request, { headers });
            expect(permutations).toContainEqual(expected);
        });

        it("uses base if the root path is requested", () => {
            request = createRequest({ url: "/", body: "" });
            expect(getFilenames(request, {})).toEqual(["GET"]);
        });

        it("serialises body as url if it's an object", () => {
            request = createRequest({ headers: {}, body: { test: "value" } });
            expect(getFilenames(request, {})).toEqual(["GET", "GET--test=value"]);
        });

        it("uses query parameters in the permutations", () => {
            request = createRequest({ headers: {}, url: "/?test=value" });
            expect(getFilenames(request, {})).toEqual([
                "GET",
                "GET--test=value",
                "GET--body",
                "GET--body--test=value",
                "GET--test=value--body",
            ]);
        });
    });

    describe("current path wildcard permutations", () => {
        const expected = [
            ["test/42/__"],
            ["test/__/details"],
            ["__/42/details"],
            ["test/__/__"],
            ["__/42/__"],
            ["test/__/__"],
            ["__/__/__"],
        ];

        it.each(expected)("uses wildcard __ to search generic paths", (expected) => {
            expect(getPathWildcards(request)).toContainEqual(expected);
        });
    });

    describe("paths to look for the response", () => {
        let files;

        beforeEach(() => {
            files = getFiles(request, { mocks: "./here" });
        });

        it("tries the most restrictive path first", () => {
            expect(files[0]).toBe("here/test/42/details/GET--body");
        });

        it.each([
            ["here/test/__/__/GET", "here/test/42/__/GET"],
            ["here/test/42/__/GET", "here/test/42/details/GET"],
            ["here/test/42/details/GET", "here/test/42/details/GET--body"],
            ["here/__/__/__/GET", "here/__/42/__/GET"],
        ])("the most generic wildcards go after the less generic wildcards", (moreGeneric, lessGeneric) => {
            expect(files).toContainEqual(moreGeneric);
            expect(files).toContainEqual(lessGeneric);
            expect(files.indexOf(lessGeneric)).toBeLessThan(files.indexOf(moreGeneric));
        });

        it("orders by path chunks and number wildcard, so the most generic path goes at the end", () => {
            const [lastItem] = files.slice(-1);
            expect(lastItem).toBe("here/__/__/__/GET");
        });
    });

    describe("gets response content", () => {
        const options = { mocks: "./test/examples" };

        beforeEach(() => {
            request = createRequest({ url: "/" });
        });

        test("loads file content if match found", () => {
            const [content, _] = getContent(request, options);
            expect(content).toContain("GET with body");
        });

        test("returns the file that matched the request", () => {
            const [_, location] = getContent(request, options);
            expect(location).toBe("test/examples/GET--body.mock");
        });

        test("loads file for that request method only", () => {
            request = createRequest({ url: "/", method: "POST" });
            const [content, _] = getContent(request, options);
            expect(content).toContain("POST without body");
        });

        test("returns empty if no file matches", () => {
            request = createRequest({ url: "/path/not/exists" });
            const [content, filepath] = getContent(request, options);
            expect(content).toEqual("");
            expect(filepath).toEqual("");
        });
    });

    describe("full request", () => {
        beforeEach(() => {
            request = httpMocks.createRequest({
                method: "POST",
                url: "/path/subpath/item?param1=value1",
                body: { key: "value" },
                headers: {
                    "X-H1": "h1",
                    "X-H2": "h2",
                },
            });
        });

        it("gets all these permutation paths in exact order", () => {
            const expected = require("./examples/path-permutations.json");
            const headers = "X-H1,X-H2";
            const mocks = "./mock-folder";
            const files = getFiles(request, { headers, mocks });
            expect(files).toEqual(expected);
        });
    });
});
