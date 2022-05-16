
var sharp = require("sharp")
const fs = require("fs");
const path = require("path")

const limitation = 1080;
async function resize(filepath)
{
    console.log("begin process ", filepath)
 
    let tmppath = path.dirname(filepath)  + "/"+ path.basename(filepath) + "_origin" + path.extname(filepath) ;
    fs.renameSync(filepath, tmppath)
    let image = sharp(tmppath);
    const metadata = await image.metadata();
    let resize_side = "width";
    if (metadata.width < metadata.height)
        resize_side = "height";

    if (metadata[resize_side] < 1080)
    {
        fs.renameSync(tmppath,filepath)
        return;
    }

    let options = {};
    options[resize_side] = 1080;
    await image.resize(options).toFile(filepath);
    // fs.rmSync(tmppath);
    console.log("convert ", filepath)
}

exports.resize = resize;


// function get_files(path)
// {
//     return fs.readdirSync(path);
// }

// function is_dir(path)
// {
//     return fs.statSync(path).isDirectory();
// }

// async function process_localfile(path)
// {
//     let files = get_files(path)
//     files.forEach(async item=>{
//         let fullpath = path + item
//         if (is_dir(fullpath))
//         {
//            await process_localfile(fullpath + "/");            
//         }
//         else
//         {
//             await resize(fullpath);
//         }
//     });
// }

// const image_path = path.join(__dirname , "../") + "public/test/";

// async function init()
// {
//     await process_localfile(image_path);
// }

// init();