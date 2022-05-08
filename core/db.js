
const VERSION_NUM = 3;
const TABLE_NAME = "localtable_" + VERSION_NUM;
const TABLE_FORMAT = "date char(10), timestamp bigint, comment varchar(256), image varchar(256)";

var mysql = require("mysql2")
var dbconfig = 
{
    host : 'localhost',
    port : '3306',
    user : 'root',
    password: '123456',
    database: 'localdata',
};

const USE_CONNECTION_POOLING = false;

if (USE_CONNECTION_POOLING)
    var connectionPooling = mysql.createPool(dbconfig);
else
{
    var connection = mysql.createConnection(dbconfig);    
    connection.connect();
}
function getConnection(callback)
{
    if (USE_CONNECTION_POOLING) {
        connectionPooling.getConnection(function (err, conn) {
            if (err) {
                console.error(err)
            }
            callback(err, conn, () => { conn.release() });
        })
    }
    else 
    {
        callback(null, connection, ()=>{})
    }
}

if (connectionPooling || connection)
    console.log("mysql is connected.")
else
{
    console.log("failed to connect mysql.")
    throw new Error("mysql errror.");
}

function query(sql)
{
    return new Promise((resolve, reject)=>{
       getConnection(function (err, conn, finish)
        {
            if (err)
            {
                reject(err)
                finish();
            }
            else
            {
                console.info("[sql]", sql)
                conn.query(sql, function (err, rows)
                {
                    if (err)
                    {
                        console.error(err)
                        reject(err)
                    }
                    else
                    {
                        resolve( rows);
                    }
                    finish();
                })
            }

        });
	});
}

exports.query = query;
async function init(){

    let is_table_exists = await query("select count(table_name) as ct from information_schema.TABLES where table_name = '" + TABLE_NAME + "';");
    is_table_exists = is_table_exists[0].ct;


    let result = await query("select num from version where id = 0;")
    let dbversion = result[0].num;
    if (dbversion != VERSION_NUM)
    {
        console.log("current data version is ", dbversion, ", but latest version is ", VERSION_NUM, ". so we need to rebuild.")
        rebuild(dbversion, VERSION_NUM);
    }
    else if (!is_table_exists)
    {
        console.log ("cannot find table, build it.")
        rebuild(VERSION_NUM,VERSION_NUM)
    }
    console.log("db is already prepared.")
};

init();

async function rebuild(oldversion, newversion)
{
    console.log("begin to rebuild tables")
    let old_table_name = 'localtable_' + oldversion;
    let new_table_name = 'localtable_' + newversion;

    let is_old_table_exists = await query("select count(table_name) as ct from information_schema.TABLES where table_name = '" + old_table_name + "';");
    is_old_table_exists = is_old_table_exists[0].ct;

    await query("drop table if exists " + new_table_name + ";");
    await query( "create table " + new_table_name + " (" + TABLE_FORMAT +") ;");

    if (is_old_table_exists)
    {
        async function findCols(table_name)
        {
            return await query("select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where table_schema = 'localdata' and table_name = '" + table_name + "';")
        }
        let old_cols = await findCols(old_table_name);
        let new_cols = await findCols(new_table_name);

        let new_cols_map = {};
        for (let i in new_cols)
        {
            new_cols_map[new_cols[i].COLUMN_NAME] = true;
        }

        let availble_cols = []
        for (let i in old_cols)
        {
            let col_name = old_cols[i].COLUMN_NAME;
            if (new_cols_map[col_name])
            {
                availble_cols.push(col_name);
            }
        }

        let availble_list = "";
        for(let i in availble_cols)
        {
            availble_list += availble_cols[i] + " ,";
        }
        availble_list = availble_list.substring(0, availble_list.length - 1);

        await query("insert into " + new_table_name + "(" + availble_list + ") select " + availble_list + " from " + old_table_name + ";");
        // await query("drop table if exists " + old_table_name + ";");

    }

    await query("update version set num = " + VERSION_NUM + " where id = 0;");

    console.log("rebuild complete.")
}

exports.select = async function (cols, condistion, order)
{
    let col_str = "";
    if (!cols || !cols.length) 
    {
        col_str = "*";
    }
    else
    {
        for (let c in cols)
        {
            col_str += cols[c];
        }
    }

    let sql = "select " + col_str + " from " + TABLE_NAME;
    if (condistion)
    {
        sql += " where " + condistion;
    }
    if (order)
    {
        sql += " order by " + order;
    }
    let result = await query(sql);
    return result;
}

exports.insert = async function (item)
{
    let col_list = "";
    let value_list = "";

    for (let field in item)
    {
        col_list += field + ",";
        value_list += item[field] + ",";
    }
    col_list = col_list.substring(0, col_list.length - 1);
    value_list = value_list.substring(0, value_list.length - 1);

    return await query("insert into " + TABLE_NAME + "(" + col_list + ") values(" + value_list + ");");
}