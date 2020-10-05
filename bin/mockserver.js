#!/usr/bin/env node

const { evaluateFile, evaluateJSON } = require("../dist/evaluations");
const { start } = require("../dist/server");

module.exports = {
    evaluateFile,
    evaluateJSON,
};

start(process.argv);
