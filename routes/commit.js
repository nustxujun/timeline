var express = require('express');
var router = express.Router();
var datamgr = require("../core/datamgr")
const multer = require("multer")

const storage = multer.diskStorage({
  destination(req, res, cb){
    cb(null, "public/images/");
  },
  filename(req,file,cb){
    const path = file.originalname.split('.');
    cb(null, path[0] + "-" + Date.now() + "." + path[path.length - 1]);
  }
});

var upload = multer({storage:storage})

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
  console.log(req.query);
});

router.post('/', upload.single("upload_pic"),function(req, res) {
  res.render('main', { title: 'loveeveryday' });
  console.log(req.file);
  console.log(req.body);

  let path;
  if (req.file)
    path = req.file.path.slice(7)
  let date = new Date()
  datamgr.addData(date.toLocaleDateString(), path, req.body.upload_comment);

});

module.exports = router;
