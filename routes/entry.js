
var accountmgr = require("../core/accountmgr")


module.exports =async function (req, res, next)
{
    if (req._parsedOriginalUrl && req._parsedOriginalUrl.pathname == "/login")
    {
        res.render("login", {title:"loveeveryday", warn:""})
    }
    else if (req._parsedOriginalUrl && req._parsedOriginalUrl.pathname == "/api/login") {
        console.log("logining")
        next();
    }
    else if (await accountmgr.authRequest(req))
    {
        console.log("login suc. update hash")
        await accountmgr.updateHash(req.cookies, res);
        next();
    }
    else
    {
        res.redirect("/login")
    }
}