var express = require('express');
var router = express.Router();
var datamgr = require("../core/datamgr")
var accountmgr = require("../core/accountmgr")


router.get('/getall', async function (req, res, next) {
  res.send(await datamgr.getAllData());
});

router.get('/login', async function (req, res, next) {
  console.log("logining")
  let access = false;
  let name = req.query.upload_name;
  let xjreg = /(lovesiying)/ig
  if (xjreg.test(name)) {
    access = "xj";
  }
  else {
    let regs = [/(siying)/, /(思影)/]
    for (let i in regs) {
      if (regs[i].test(name)) {
        access = "sy";
        break;
      }
    }
  }

  if (!access) {
    res.render("login", { title: "lovesiying", warn: "Name is invalid." })
  }
  else {
    await accountmgr.loginByName(access, res);
    res.redirect('/');
  }
})

module.exports = router;
