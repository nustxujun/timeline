var express = require('express');
var router = express.Router();
var datamgr = require("../core/datamgr")


router.get('/getall', async function(req, res, next) {
  // res.send('respond with a resource');
  // console.log(req.query);

  // res.send(datamgr.getAllData())
  // console.log (await datamgr.getAllData())
  res.send(await datamgr.getAllData());
});

module.exports = router;
