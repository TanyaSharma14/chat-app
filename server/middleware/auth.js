// request -> middleware-> route
// to check whether the incoming requests have a valid jwt token or not

const jwt = require('jsonwebtoken'); // import the jwt library(create , verify and decode jwt tokens)

module.exports = function(req, res, next) { // exporting the middleware function
    const header = req.header('Authorization'); // the jwt token is the identification of the user

    if (!header) { // if the header is missing ie the user did not send a token ie unauthorized that is why 401
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const token = header.replace('Bearer ', ''); // removing the bearer from the header since the jwt verification only needs the toekn part

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // secret key stored in the enviornment variables
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
