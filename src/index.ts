const Firebird = require("node-firebird");
const fs = require("fs");
global.fetch = require("node-fetch");
// import Firebird from "node-firebird";
// import fs from "fs";

var options: any = {};

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

const DbRequest = async (query: string) => {
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

const addColl = () => {
	DbRequest(`ALTER TABLE DOCUMENT ADD last_order_update VARCHAR(25)`);
	// DbRequest(`ALTER TABLE DOCUMENT DROP LAST_UP`)
};

// addColl();
// DbRequest(`SELECT rdb$get_context('SYSTEM', 'ENGINE_VERSION')
// from rdb$database;`)
// 	.then((res) => {
// 		console.log("res", res);
// 	});

const getOrdersFromDate = async (date: string) => {
	const orders = await DbRequest(
		`SELECT first 5* FROM DOCUMENT WHERE last_order_update > '${date}' ORDER BY last_order_update desc`
	);
	return orders;
	// fs.writeFile(
	// 	`orders.json`,
	// 	JSON.stringify(orders, null, 2),
	// 	null,
	// 	() => {}
	// );
};
// getOrdersFromDate(`2020-11-01T22:00:00.000Z`);

const createTrigger = async () => {
	const res = await DbRequest(`create trigger on_orders_change for DOCUMENT
    before insert or update
as
  begin
    new.last_order_update = CURRENT_TIMESTAMP;
  end`).catch((err) => {
		console.log("createTriger_err", err);
	});
	console.log("createTriger", res);
	saveTrigders();
};
// createTrigger();

const deleteTrigger = async () => {
	const res = await DbRequest(`DROP trigger on_orders_change`).catch(
		(err) => {
			console.log("createTriger_err", err);
		}
	);
	console.log("res deleteTrigger", res);
	saveTrigders();
};
// deleteTrigger();

const saveTrigders = () => {
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
const saveToFile = (name: string, obg: any) => {
	fs.writeFile(`${name}.json`, JSON.stringify(obg, null, 2), null, () => {});
};
const readFile = (name: string) => {
	return new Promise((resolve, reject) => {
		fs.readFile(`${name}.json`, "utf8", function (err: any, data: any) {
			if (err) {
				reject(err);
			}
			resolve(JSON.parse(data));
		});
	});
};

const sendToSite = (data: any) => {
	// saveToFile(`data`, data);
	console.log("sendToSite");
	fetch(`http://magday.ru/frontol/order.php`, {
		method: "post",
		body: JSON.stringify({ orders: data }),
	});
};

const eventListener = async () => {
	const state: any = await readFile("state");
	let lastTimeUpdate = state.lastTimeUpdate;
	// let lastTimeUpdate = `2020-11-11 20:30:09.7460`;
	const checkOrdersUpdates = async () => {
		const orders = (await getOrdersFromDate(lastTimeUpdate)) as Array<
			tables.RootObject
		>;
		if (orders.length > 0) {
			lastTimeUpdate = orders[orders.length - 1].LAST_ORDER_UPDATE;
			saveToFile("state", { lastTimeUpdate: lastTimeUpdate });
			for (let i = 0; i < orders.length; i++) {
				orders[i].products = await getProductsByOrderId(orders[i].ID);
			}

			return orders;
		} else {
			return false;
		}
	};
	checkOrdersUpdates();
	setInterval(async () => {
		console.log("lastTimeUpdate", lastTimeUpdate);
		const changed_orders = await checkOrdersUpdates();
		// saveToFile(`changed_orders`, changed_orders);
		if (changed_orders) {
			sendToSite(changed_orders);
		}
		// console.log(changed_orders);
	}, 5000);
};

eventListener();
const getProductByCode = async (code: number) => {
	const product = await DbRequest(`SELECT * FROM SPRT WHERE CODE = ${code}`);
	if (Array.isArray(product)) {
		return product[0];
	} else {
		return [];
	}
};

const getProductsByOrderId = async (orderId: number) => {
	console.log(`getProductsByOrderId orderId`, orderId);
	const tranzt = await DbRequest(
		`SELECT first 50 * FROM TRANZT WHERE DOCUMENTID = ${orderId}`
	);
	let products: any = [];
	//@ts-ignore
	for (let i = 0; i < tranzt.length; i++) {
		//@ts-ignore
		let item = tranzt[i];
		if (item.WARECODE > 0 && item.SUMM && item.WAREMARK && item.QUANTITY) {
			// let product = await getProductByCode(item.WARECODE);
			let product = {
				price: item.SUMM,
                code: item.WARECODE,
                quantity: item.QUANTITY,
                
			};
			products.push(product);
		}
	}
	return products;

	saveToFile("tranzt", tranzt);
	const getProductCodeFromTranzt = (tranzt: any) => {
		let code;
		tranzt.forEach((element: any) => {
			if (element.WARECODE > 0) {
				code = element.WARECODE;
			}
		});
		return code;
	};
	const getProductPriceFromTranzt = (tranzt: any) => {
		let price;
		tranzt.forEach((element: any) => {
			if (element.WARECODE > 0 && element.SUMM) {
				price = element.SUMM;
			}
		});
		return price;
	};
	const productCode = getProductCodeFromTranzt(tranzt);
	if (productCode) {
		console.log("productCode", productCode);
		const product = await getProductByCode(productCode);
		if (product) {
			const productPrice = await getProductPriceFromTranzt(tranzt);
			product.price = 0;
			if (productPrice) {
				product.price = productPrice;
			}
			saveToFile("product", product);
			return [product];
		} else {
			console.log("error - product not found");
		}
	} else {
		console.log("error - productCode not found");
	}
};

const onOrdersChange = () => {
	console.log("onOrdersChange");
};

const getAllCols = async () => {
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
const saveAllCols = async () => {
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
			db.query(`SELECT skip ${skip} * FROM ${colName}`, function (
				err: any,
				result: any
			) {
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
			});
		});
	});
};

// saveAllCols();

// SPRT - products
// DOCUMENT - orders

