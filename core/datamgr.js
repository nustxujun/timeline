var db = require("./db");

const VERSION_NUM = 4;
const TABLE_FORMAT = "date char(10), timestamp bigint, comment varchar(256), image varchar(256), name varchar(32)";
var dbtable = new db.DBTable("localtable",TABLE_FORMAT,VERSION_NUM);
const moment= require('moment') 


exports.init = function ()
{

}

exports.getAllData = async function()
{
	let result =  await dbtable.select(null, null, "timestamp desc");
	let ordered = []
	let mapped = {}
	for (let i in result)
	{
		let item = result[i];

		let date = item.date;
		if (!mapped[date])
		{
			mapped[date] = [date,[]]
			ordered.push(mapped[date]);
		}

		mapped[date][1].push([item.image, item.comment, item.name]);
	}
	return ordered;
}

exports.addData = async function(date, image, comment, name)
{
		return await dbtable.insert({date: moment(date).format('YYYY-MM-DD'), timestamp: Date.now(), image: image, comment: comment, name:name});
}