import winston from "winston";

const format = winston.format;
const transports = winston.transports;

jest.mock("winston", () => {
    return {
        createLogger: jest.fn(),
        add: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        format: {
            combine: () => {},
            timestamp: () => {},
            cli: () => {},
            printf: () => {},
        },
        transports: {
            Console: jest.fn().mockImplementation(() => {
                return jest.fn();
            }),
        },
    };
});
