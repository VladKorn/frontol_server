const fs = require("fs");
const Firebird = require("node-firebird");

const options: any = {};
// options.host = "127.0.0.1";
options.host = "localhost";
options.port = 3050;
options.database = "database.fdb";
options.database = "C:\\DB\\MAIN.GDB";
options.user = "SYSDBA";
options.password = "masterkey";
options.lowercase_keys = false; // set to true to lowercase keys
options.role = null; // default
options.pageSize = 4096; // default when creating database
// options.pageSize = 10; // default when creating database

export const DbRequest = async (query: string) => {
	return new Promise((resolve, reject) => {
		Firebird.attach(options, function (err: any, db: any) {
			if (err) {
				reject(err);
			}
			db.query(query, function (err: any, result: any) {
				// db.query(`SELECT * FROM SPRT`, function (err, result) {
				if (err) {
					console.log("err", err);
					reject(err);
				}
				resolve(result);
				db.detach();
			});
		});
	});
};
//
export const saveToFile = (name: string, obg: any) => {
	fs.writeFile(`${name}.json`, JSON.stringify(obg, null, 2), null, () => {});
};
export const readFile = (name: string) => {
	return new Promise((resolve, reject) => {
		fs.readFile(`${name}.json`, "utf8", function (err: any, data: any) {
			if (err) {
				reject(err);
			}
			resolve(JSON.parse(data));
		});
	});
};
export const addColl = () => {
	DbRequest(`ALTER TABLE DOCUMENT ADD last_order_update VARCHAR(25)`);
	// DbRequest(`ALTER TABLE DOCUMENT DROP LAST_UP`)
};

export const createTrigger = async () => {
	const res = await DbRequest(`create trigger on_orders_change for DOCUMENT
    before insert or update
as
  begin
    new.last_order_update = CURRENT_TIMESTAMP;
  end`).catch((err) => {
		console.log("createTriger_err", err);
	});
	console.log("createTriger", res);
	saveTriggders();
};
// createTrigger();

export const deleteTrigger = async () => {
	const res = await DbRequest(`DROP trigger on_orders_change`).catch(
		(err) => {
			console.log("createTriger_err", err);
		}
	);
	console.log("res deleteTrigger", res);
	saveTriggders();
};
// deleteTrigger();

export const saveTriggders = () => {
	DbRequest(`SELECT RDB$TRIGGER_NAME AS trigger_name,
    RDB$RELATION_NAME AS table_name,
    RDB$TRIGGER_SOURCE AS trigger_body,
    CASE RDB$TRIGGER_TYPE
     WHEN 1 THEN 'BEFORE'
     WHEN 2 THEN 'AFTER'
     WHEN 3 THEN 'BEFORE'
     WHEN 4 THEN 'AFTER'
     WHEN 5 THEN 'BEFORE'
     WHEN 6 THEN 'AFTER'
    END AS trigger_type,
    CASE RDB$TRIGGER_TYPE
     WHEN 1 THEN 'INSERT'
     WHEN 2 THEN 'INSERT'
     WHEN 3 THEN 'UPDATE'
     WHEN 4 THEN 'UPDATE'
     WHEN 5 THEN 'DELETE'
     WHEN 6 THEN 'DELETE'
    END AS trigger_event,
    CASE RDB$TRIGGER_INACTIVE
     WHEN 1 THEN 0 ELSE 1
    END AS trigger_enabled,
    RDB$DESCRIPTION AS trigger_comment
    FROM RDB$TRIGGERS`).then((res) => {
		saveToFile("TRIGGERS", res);
		// console.log("res_trig", res);
	});
};
export const onOrdersChange = () => {
	console.log("onOrdersChange");
};

export const getAllCols = async () => {
	return new Promise((resolve, reject) => {
		Firebird.attach(options, function (err: any, db: any) {
			if (err) throw err;
			db.query(
				"SELECT a.RDB$RELATION_NAME FROM RDB$RELATIONS a WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0 AND RDB$RELATION_TYPE = 0",
				function (err: any, result: any) {
					if (err) {
						reject(err);
						console.log("err", err);
					}
					const res: any = [];
					result.forEach((item: any) => {
						res.push(item["RDB$RELATION_NAME"].replace(/ /g, ""));
					});
					resolve(res);
					db.detach();
				}
			);
		});
	});
};
export const saveAllCols = async () => {
	const cols = await getAllCols();
	// console.log(cols);
	//@ts-ignore
	cols.forEach(async (colName: any) => {
		const resCount = await DbRequest(`SELECT count(*) FROM ${colName}`);
		//@ts-ignore
		const count = resCount[0].COUNT;
		const skip = count > 10 ? count - 10 : 0;
		// const skip = 0;
		console.log(`count ${colName}`, count);
		// console.log(`count ${colName}`, resCount);
		Firebird.attach(options, function (err: any, db: any) {
			if (err) throw err;
			db.query(
				`SELECT skip ${skip} * FROM ${colName}`,
				function (err: any, result: any) {
					if (err) {
						console.log("err", err);
					}
					// console.log("result 123", result);
					fs.writeFile(
						`dbcol/${colName}.json`,
						JSON.stringify(result, null, 2),
						null,
						() => {}
					);
					db.detach();
				}
			);
		});
	});
};
