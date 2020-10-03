import httpMocks from "node-mocks-http";
import {
    getQuery,
    getPath,
    getMethod,
    getHeadersToWatch,
    getHeadersWatched,
} from "../src/request";

describe("request parser", () => {
    const request = httpMocks.createRequest({
        method: "GET",
        url: "/test/42?paramA=43",
        headers: {
            headerA: "valueA",
            "header-B": "valueB",
        },
    });

    it("extracts the path", () => {
        expect(getPath(request)).toBe("/test/42");
    });

    it("extracts the query", () => {
        expect(getQuery(request)).toBe("paramA=43");
    });

    it("extracts the method", () => {
        expect(getMethod(request)).toBe("GET");
    });

    describe("gets headers to watch", () => {
        afterEach(() => {
            delete process.env["MOCK_HEADERS"];
        });

        test("defaults to empty array", () => {
            expect(getHeadersToWatch({})).toEqual([]);
        });

        test("normalises the headers", () => {
            const options = { headers: "t,B,d-A,vA" };
            expect(getHeadersToWatch({})).toEqual([]);
        });

        test("from options", () => {
            const options = { headers: "a,b,c-A" };
            expect(getHeadersToWatch(options)).toEqual(["a", "b", "c-A"]);
        });

        test("from environment variable", () => {
            process.env["MOCK_HEADERS"] = "a,b,c-A";
            expect(getHeadersToWatch({})).toEqual(["a", "b", "c-A"]);
        });

        test("options have preference", () => {
            const options = { headers: "a,b,c-A" };
            process.env["MOCK_HEADERS"] = "d,e,f-B";
            expect(getHeadersToWatch(options)).toEqual(["a", "b", "c-A"]);
        });
    });

    describe("get headers watched", () => {
        test("defaults to empty array", () => {
            expect(getHeadersWatched(request, {})).toEqual([]);
        });

        test("returns path-like matching getHeadersToWatch normalised", () => {
            const options = { headers: "headerA,headerB" };
            expect(getHeadersWatched(request, options)).toEqual([
                "_Headera=valueA",
            ]);
        });
    });
});
