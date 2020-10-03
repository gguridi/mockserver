const uppercase = (req, res, next) => {
    req.body = req.body.toUpperCase();
    next();
};

const uniqueId = (req, res, next) => {
    req.headers["X-Unique-ID"] = Math.floor(Math.random() * 999 + 1000);
    next();
};

const bodyHeader = (req, res, next) => {
    req.headers["X-Body"] = req.body;
    next();
};

module.exports = {
    uppercase,
    uniqueId,
    bodyHeader,
};
