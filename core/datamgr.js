var db = require("./db");
const moment= require('moment') 

var virtual_data = null;
const table_name = "localtable";

exports.init = function ()
{

}

exports.getAllData = async function()
{
	if (virtual_data)
		return virtual_data;
	let result =  await db.select(null, null, "timestamp desc");
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

		mapped[date][1].push([item.image, item.comment]);
	}
	return ordered;
}

exports.addData = async function(date, image, comment)
{
	if (virtual_data)
	{
		if (!virtual_data[date])
		{
			virtual_data[date] = [];
		}
		virtual_data[date].push([image, comment])
		console.log(virtual_data)
	}
	else
	{
		function tostring(str)
		{
			str = str.replace("\\", "\\\\")
			return "'" + str + "'";
		}
		return await db.insert({date: tostring(moment(date).format('YYYY-MM-DD')), timestamp: Date.now(), image: tostring(image), comment: tostring(comment)});
	}
}