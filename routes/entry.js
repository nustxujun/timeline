
var accountmgr = require("../core/accountmgr")


module.exports =async function (req, res, next)
{
    if (req._parsedOriginalUrl && req._parsedOriginalUrl.pathname == "/login")
    {
        res.render("login", {title:"loveeveryday", warn:""})
    }
    else if (await accountmgr.authRequest(req))
    {
        await accountmgr.updateHash(req.cookies, res);
        next();
    }
    else if (req._parsedOriginalUrl && req._parsedOriginalUrl.pathname == "/api/login") {
        next();
    }
    else
    {
        res.redirect("/login")
    }
}