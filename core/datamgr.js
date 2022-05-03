var virtual_data = {};

exports.init = function ()
{

}

exports.getAllData = function()
{
	return virtual_data;
}

exports.addData = function(date, image, comment)
{
	if (virtual_data)
	{
		if (!virtual_data[date])
		{
			virtual_data[date] = [];
		}
		virtual_data[date].push([image, comment])
	}
	console.log(virtual_data)
}