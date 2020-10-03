const cacheHeader = (req, res, next) => {
    res.header("X-Cache", res.get("X-Response-ID"));
    next();
};

const contentHeader = (req, res, next) => {
    res.header("X-Content", res.body);
    next();
};

module.exports = {
    cacheHeader,
    contentHeader,
};
