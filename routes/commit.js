var express = require('express');
var router = express.Router();
var datamgr = require("../core/datamgr")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const image_path = path.join(__dirname , "../") + "public/images/";
if (!fs.existsSync(image_path))
{
  fs.mkdirSync(image_path);
}


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

router.post('/', upload.single("upload_pic"),async function(req, res) {
  let path = "";
  if (req.file)
    path = req.file.path.slice(7)
  let date = new Date()
  if (path != "" || req.body.upload_comment != "")
  {
    await datamgr.addData(date, path, req.body.upload_comment, req.cookies.name);
  }
  res.redirect('/');
});

module.exports = router;
