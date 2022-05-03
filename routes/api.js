var express = require('express');
var router = express.Router();
var datamgr = require("../core/datamgr")


router.get('/getall', function(req, res, next) {
  // res.send('respond with a resource');
  // console.log(req.query);

  res.send(datamgr.getAllData())
});

module.exports = router;
