
var crypto = require("crypto")
var db = require("../core/db")


const VERSION_NUM = 1;
const TABLE_FORMAT = "name varchar(32), hash char(64), timestamp bigint";
var dbtable = new db.DBTable("account", TABLE_FORMAT, VERSION_NUM);
const LOGIN_HASH = "login";
const MAX_AGE = 1000 * 60 * 60 * 24 * 7; // one weak
const NAME = "name"

function HASH(content) {
    return crypto.createHash("md5").update(content).digest("hex");
}

async function compareHash(hash) {
    let ret = await dbtable.select([], "hash = '" + hash + "'");
    if (ret.length == 0)
    {
        console.log("login hash is not recorded");
        return false;
    }

    let now = Date.now();
    let diff = (now - ret[0].timestamp) ;
    if(diff > MAX_AGE)
    {
        console.log("out of date. diff is ", diff, "is greater than",MAX_AGE);
        return false;
    }   
    return hash == ret[0].hash;
}

function updateHash(name, force_refresh)
{

}

async function authRequest(req) {
    if (req.cookies[LOGIN_HASH]) {
        let cookie = req.cookies[LOGIN_HASH];
        if (cookie && await compareHash(cookie)) {
            return true;
        }
    }
    return false;
}

exports.authRequest = authRequest;

function recordCookies(hash, name, res)
{
    res.cookie(LOGIN_HASH, hash, {maxAge:MAX_AGE})
    res.cookie(NAME, name, {maxAge:MAX_AGE})
}

exports.updateHash =async function(inCookies, res)
{
    let curHash = inCookies[LOGIN_HASH];
    let ret = await dbtable.select([],"hash = '" + curHash + "'");
    let hash = HASH(ret[0].hash);
    await dbtable.update({hash : hash},"hash = '" + curHash + "'")
    recordCookies(hash, ret[0].name, res);
}

exports.loginByName = async function(name,res) {

    let cur = Date.now();
    let refresh_hash = HASH(name + cur);
    let ret = await dbtable.select([], "name='" + name + "'");

    if(ret.length == 0 )
    {
       await dbtable.insert({name: name, hash: refresh_hash, timestamp: cur});
    }
    else 
    {
        await dbtable.update({hash : refresh_hash}, "name='" + name + "'")
    }
    recordCookies(refresh_hash, name, res);

    console.log("login in ", name, refresh_hash, cur);
}

