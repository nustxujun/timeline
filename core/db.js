
const IS_DEVELOPMENT = false;

var TABLE_PREFIX = ""
if (IS_DEVELOPMENT)
{
    TABLE_PREFIX = "debug_"
}
// const { version } = require("jade/lib/jade");

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

function keepAlive() {
    getConnection(function (err, connection, done) {
        if (err) { return; }
        connection.ping();
        console.log("ping to keepalive...")
        done();
    });
}
setInterval(keepAlive, 60 * 60 * 1000);

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

function getRealTableName(table_name, versionNum)
{
    return TABLE_PREFIX + table_name + "_" +  versionNum;
}

async function initTable(table_name, format, versionNum){

    let is_table_exists = await query("select count(table_name) as ct from information_schema.TABLES where table_name = '" + getRealTableName(table_name,versionNum) + "';");
    is_table_exists = is_table_exists[0].ct;


    let result = await query("select num from version where table_name = '" + TABLE_PREFIX + table_name + "';");
    let dbversion = versionNum;
    if (result[0])
        dbversion = result[0].num;
    else if (is_table_exists)
    {
        is_table_exists = false;
        console.warn("We find table ",getRealTableName(table_name,versionNum), " exists which is not recorded in table 'version', so we backup the old table, and rebuid it");
        await query("create table " + getRealTableName(table_name,versionNum) + "_backup like " + getRealTableName(table_name,versionNum) + ";");
        await query("insert into " + getRealTableName(table_name,versionNum) + "_backup select * from " + getRealTableName(table_name,versionNum) + ";" );
    }
    
    if (dbversion != versionNum)
    {
        console.log("current data version is ", dbversion, ", but latest version is ", versionNum, ". so we need to rebuild.")
        rebuild(table_name, format, dbversion, versionNum);
    }
    else if (!is_table_exists)
    {
        console.log ("cannot find table, build it.")
        await query("delete from version where table_name = '" + TABLE_PREFIX +  table_name + "';");
        await query("insert into version values('" + TABLE_PREFIX +  table_name + "', "+ versionNum +");")
        rebuild(table_name, format, versionNum,versionNum)
    }
    console.log(table_name ,"is already prepared.")
};


async function rebuild(table_name, format, oldversion, newversion)
{
    console.log("begin to rebuild tables")
    let old_table_name = getRealTableName(table_name, oldversion);
    let new_table_name = getRealTableName(table_name, newversion);

    let is_old_table_exists = await query("select count(table_name) as ct from information_schema.TABLES where table_name = '" + old_table_name + "';");
    is_old_table_exists = is_old_table_exists[0].ct;

    await query("drop table if exists " + new_table_name + ";");
    await query( "create table " + new_table_name + " (" + format +") ;");

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

    await query("update version set num = " + newversion + " where table_name = '" + TABLE_PREFIX + table_name + "';");

    console.log("Rebuild complete.")
}

function tostring(str)
{
    if (typeof(str) == "string")
    {
        str = str.replace("\\", "\\\\")
        return "'" + str + "'";
    }
    else
        return str;
}
class DBTable
{
    constructor(table_name, format, version)
    {
        this.table_name = getRealTableName(table_name, version);
        initTable(table_name, format, version);
    }

    async select(cols, condistion, order)
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
    
        let sql = "select " + col_str + " from " + this.table_name;
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

    async insert (item)
    {
        let col_list = "";
        let value_list = "";

        for (let field in item)
        {
            col_list += field + ",";
            value_list += tostring(item[field]) + ",";
        }
        col_list = col_list.substring(0, col_list.length - 1);
        value_list = value_list.substring(0, value_list.length - 1);

        return await query("insert into " + this.table_name + "(" + col_list + ") values(" + value_list + ");");
    }

    async update(item, condistion)
    {
        let sql = "update " + this.table_name + " set " ;
        for (let field in item)
        {
            sql += field + "=" + tostring(item[field]) + ",";
        }
        sql = sql.substring(0, sql.length - 1);
        if (condistion)
        {
            sql += " where " + condistion;
        }

        return await query(sql);
    }
};
exports.DBTable = DBTable;