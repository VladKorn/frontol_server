import {
	saveToFile,
	readFile,
	DbRequest,
	saveAllCols,
	isCardPayment,
} from "./tools";
global.fetch = require("node-fetch");
// import Firebird from "node-firebird";
// import fs from "fs";

// addColl();
// DbRequest(`SELECT rdb$get_context('SYSTEM', 'ENGINE_VERSION')
// from rdb$database;`)
// 	.then((res) => {
// 		console.log("res", res);
// 	});

const debug = false;

export interface Product {
	price: number;
	code: number;
	quantity: number;
	priceBase: number;
}
export interface Order {
	STATE: number | "cancelled";
	ID: number;
	CHEQUENUMBER: number;
	SUMM: number;
	SUMMWD: number;
	products: any[];
	isCardPayment: boolean;
	lastOrderUpdate: string;
}
const innerState = {
	eventListenerinProgress: false,
	checkOrdersUpdatesInProgress: false,
	isFirstStart: true,
};

const clearEmptyOrders = (_orders: Order[]) => {
	return _orders.filter((x) => x.SUMM > 0);
};
const isOrderCancel = (_products: Product[]) => {
	return _products.every((x) => x.price < 0);
};
export const clearRemovedProducts = (_products: Product[]) => {
	// const removedProds = _products.filter((x) => x.price < 0);
	// let removerdProductsCount = removedProds.length;
	// console.log("order.products", order.products);
	// console.log("clearRemovedProducts removedProds", removedProds);
	// if (debug) saveToFile(`debug/removedProds`, removedProds);
	if (debug) saveToFile(`debug/clearRemovedProducts__products`, _products);

	// console.log("removedProds", -removedProds[0].price);
	const productsByCode: { [key: number]: Product[] } = {};
	_products.forEach((prod) => {
		if (!productsByCode[prod.code]) productsByCode[prod.code] = [];
		productsByCode[prod.code].push(prod);
	});

	const products: Product[] = [];

	Object.keys(productsByCode).forEach((key) => {
		const prods = productsByCode[parseInt(key)];

		const product = {
			code: prods[0].code,
			price: prods.reduce(
				(accumulator, prod) => accumulator + prod.price,
				0
			),
			priceBase: prods.reduce(
				(accumulator, prod) => accumulator + prod.priceBase,
				0
			),
			quantity: prods.reduce(
				(accumulator, prod) => accumulator + prod.quantity,
				0
			),
		};
		if (product.price > 0) {
			products.push(product);
		}
	});
	if (debug) saveToFile(`debug/clearRemovedProducts_products`, products);

	return products;
};

const prepareOrderData = async (_orders: Orders) => {
	const data: Order[] = [];
	const cancelledOrders: Order[] = [];
	for (let index = 0; index < _orders.length; index++) {
		const _order = _orders[index];
		if (isOrderCancel(_order.products)) {
			const id = _order.DOCUMENTID; //id of cancelled order
			// console.log("isOrderCancel", _order);
			const order = await getOrder(id);
			// console.log("cancelled order", order);
			if (!order) continue;
			cancelledOrders.push({
				STATE: "cancelled",
				ID: order.ID,
				SUMM: order.SUMM,
				SUMMWD: order.SUMMWD,
				products: order.products,
				isCardPayment: order.isCardPayment,
				CHEQUENUMBER: order.CHEQUENUMBER,
				lastOrderUpdate: order.LAST_ORDER_UPDATE,
			});
			continue;
		}

		let products: Product[] = [];

		let needRemove = false;
		_order.products.forEach((prod: Product) => {
			if (prod.price < 0) {
				needRemove = true;
			}
		});
		// if (_order.CHEQUENUMBER == 7528) {
		// 	console.log(
		// 		"prepareOrderData _order.CHEQUENUMBER == 7528 products before",
		// 		_order.products
		// 	);
		// }
		if (needRemove) {
			products = clearRemovedProducts(_order.products);
		} else {
			products = _order.products;
		}
		// if (_order.CHEQUENUMBER == 7528) {
		// 	console.log(
		// 		"prepareOrderData _order.CHEQUENUMBER == 7528 products after clearRemovedProducts",
		// 		products
		// 	);
		// }

		data.push({
			STATE: _order.STATE,
			ID: _order.ID,
			SUMM: _order.SUMM,
			SUMMWD: _order.SUMMWD,
			products: products,
			isCardPayment: _order.isCardPayment,
			CHEQUENUMBER: _order.CHEQUENUMBER,
			lastOrderUpdate: _order.LAST_ORDER_UPDATE,
		});
	} //end for

	// _item;
	const _data = clearEmptyOrders(data);
	return [..._data, ...cancelledOrders];
};

export const getOrder = async (id: number) => {
	const orders: tables.RootObject[] = (await DbRequest(
		`SELECT * FROM DOCUMENT WHERE id = '${id}'`
	)) as tables.RootObject[];
	if (!orders.length) {
		return false;
	}
	console.log("getOrder id order", id, orders[0]);
	// saveToFile("debug/orders_selected", orders);
	return orders[0];
};

export const getOrdersFromDate = async (date: string) => {
	const orders: any = await DbRequest(
		`SELECT first 10000 * FROM DOCUMENT WHERE STATE = 1 AND last_order_update > '${date}' ORDER BY last_order_update desc`
	);
	if (orders) {
		console.log(
			"getOrdersFromDate date orders.length",
			date,
			orders?.length
		);
	}
	// saveToFile("debug/orders_selected", orders);
	return orders;
};
// getOrdersFromDate(`2020-11-01T22:00:00.000Z`);

const sendToSite = async (_data: Orders) => {
	if (debug) saveToFile(`debug/data`, _data);
	const data = await prepareOrderData(_data);
	// if (debug) saveToFile(`debug/newData`, data);
	console.log("sendToSite", data.length);
	// console.log("sendToSite test", data);
	const config: any = await readFile("config");

	console.log(
		"sendToSite test",
		data.filter((x) => x.STATE === "cancelled")
	);

	return fetch(`https://admin.magday.ru/frontol/order.php`, {
		method: "post",
		body: JSON.stringify({ orders: data, userId: config.userId }),
	});
	// .then(res => res.text()).then((res)=>{console.log("res" , res)});
};
const getState = async () => {
	let state: any = await readFile("state");
	// console.log("state", state);
	if (state.error || !state.lastTimeUpdate) {
		const stateBackup: any = await readFile("stateBackup");
		if (stateBackup.error) {
			// console.log("stateBackup state.error", stateBackup.error);
		} else {
			// console.log("stateBackup", stateBackup, stateBackup.lastTimeUpdate);
			await saveToFile("state", stateBackup);
			state = stateBackup;
		}
	}
	console.log("initial state", state);
	if (innerState.isFirstStart) {
		const date = new Date(state.lastTimeUpdate);
		let dayNow: any = date.getDate();
		if (dayNow < 10) {
			dayNow = "0" + dayNow;
		}
		let monthNow: any = date.getMonth() + 1;
		if (monthNow < 10) {
			monthNow = "0" + monthNow;
		}
		date.setDate(date.getDate() - 1);
		let day: any = date.getDate();
		if (day < 10) {
			day = "0" + day;
		}
		let month: any = date.getMonth() + 1;
		if (month < 10) {
			month = "0" + month;
		}
		state.lastTimeUpdate = state.lastTimeUpdate
			.replace(`-${monthNow}-`, `-${month}-`)
			.replace(`-${dayNow} `, `-${day} `);
		console.log("initial state - isFirstStart", state);
		innerState.isFirstStart = false;
	}

	return state;
};

const checkOrdersUpdatesOnce = async () => {
	if (innerState.checkOrdersUpdatesInProgress) return false;
	innerState.checkOrdersUpdatesInProgress = true;
	const res = await checkOrdersUpdates();
	innerState.checkOrdersUpdatesInProgress = false;
	return res;
};
const checkOrdersUpdates = async () => {
	const state = await getState();
	let lastTimeUpdate = state.lastTimeUpdate;
	console.log("lastTimeUpdate", lastTimeUpdate);
	const orders = (await getOrdersFromDate(lastTimeUpdate)) as
		| Array<tables.RootObject>
		| false;
	if (orders === false) return;
	if (orders.length > 0) {
		// await saveToFile("debug/__orders", orders);
		// const _lastTimeUpdate = orders[orders.length - 1].LAST_ORDER_UPDATE;
		const _lastTimeUpdate = orders.sort((x, z) => {
			return (
				// @ts-ignore
				new Date(z.LAST_ORDER_UPDATE) - new Date(x.LAST_ORDER_UPDATE)
			);
		})[0].LAST_ORDER_UPDATE;
		await saveToFile("state", { lastTimeUpdate: _lastTimeUpdate });
		setTimeout(() => {
			saveToFile("stateBackup", { lastTimeUpdate: _lastTimeUpdate });
		}, 10000);
		// console.log("_lastTimeUpdate", lastTimeUpdate, _lastTimeUpdate);

		for (let i = 0; i < orders.length; i++) {
			console.log("eventListener order", orders[i].CHEQUENUMBER);
			orders[i].products = await getProductsByOrderId(orders[i].ID);
			orders[i].isCardPayment = await isCardPayment(orders[i].ID);
			// if (orders[i].CHEQUENUMBER == 7528) {
			// 	console.log("CHEQUENUMBER == 7528", orders[i]);
			// }
		}
		const _orders: Orders = [];
		orders.forEach((_order) => {
			if (_order.products.length > 0) {
				_orders.push(_order);
			}
		});
		await saveToFile("debug/orders", orders);
		if (_orders.length > 0) {
			return _orders;
		} else {
			return false;
		}
	} else {
		return false;
	}
};
const eventListener = async () => {
	// let lastTimeUpdate = `2020-11-11 20:30:09.7460`;
	// checkOrdersUpdates();
	setInterval(async () => {
		if (innerState.eventListenerinProgress) return;
		if (innerState.checkOrdersUpdatesInProgress) return;
		console.log("eventListener setInterval !eventListenerinProgress");
		const changed_orders = await checkOrdersUpdatesOnce();
		if (!changed_orders) return;
		// saveToFile(`changed_orders`, changed_orders);
		innerState.eventListenerinProgress = true;
		const step = 50;
		for (
			let index = 0;
			index < changed_orders.length;
			index = index + step
		) {
			console.log(
				`eventListener sendToSite ${index} of ${
					changed_orders.length > index + step
						? index + step
						: changed_orders.length
				} / ${changed_orders.length}`
			);
			const res = await sendToSite(
				changed_orders.slice(index, index + step)
			);
			// console.log(`sendToSite res.statusText`, res.statusText);
		}
		innerState.eventListenerinProgress = false;
		console.log("changed_orders", changed_orders);
	}, 5000);
};
const main = () => {
	console.log(`version:1.8.23`);
	eventListener();
};
main();
const getProductByCode = async (code: number) => {
	const product = await DbRequest(`SELECT * FROM SPRT WHERE CODE = ${code}`);
	if (Array.isArray(product)) {
		return product[0];
	} else {
		return [];
	}
};

const getProductsByOrderId = async (orderId: number) => {
	// console.log(`getProductsByOrderId orderId`, orderId);
	const tranzt = await DbRequest(
		`SELECT * FROM TRANZT WHERE DOCUMENTID = ${orderId}`
	);
	let products: any = [];
	//@ts-ignore
	// console.log("tranzt.length" , tranzt.length);
	if (debug) await saveToFile(`debug/getProductsByOrderId_tranzt`, tranzt);

	//@ts-ignore
	for (let i = 0; i < tranzt.length; i++) {
		//@ts-ignore
		let item = tranzt[i];
		// console.log("tranzt item" , item);
		if (
			item.WARECODE > 0 &&
			item.SUMM &&
			item.QUANTITY &&
			item.TRANZTYPE !== 17 &&
			item.TRANZTYPE !== 87 &&
			item.TRANZTYPE !== 37
		) {
			// let product = await getProductByCode(item.WARECODE);
			let product = {
				priceBase: item.SUMM,
				price: item.SUMMWD,
				code: item.WARECODE,
				quantity: item.QUANTITY,
				// test: item,
			};
			products.push(product);
		}
	}
	if (debug)
		await saveToFile(`debug/getProductsByOrderId_products`, products);

	return products;

	// const getProductCodeFromTranzt = (tranzt: any) => {
	// 	let code;
	// 	tranzt.forEach((element: any) => {
	// 		if (element.WARECODE > 0) {
	// 			code = element.WARECODE;
	// 		}
	// 	});
	// 	return code;
	// };
	// const getProductPriceFromTranzt = (tranzt: any) => {
	// 	let price;
	// 	tranzt.forEach((element: any) => {
	// 		if (element.WARECODE > 0 && element.SUMM) {
	// 			price = element.SUMM;
	// 		}
	// 	});
	// 	return price;
	// };
	// const productCode = getProductCodeFromTranzt(tranzt);
	// if (productCode) {
	// 	console.log("productCode", productCode);
	// 	const product = await getProductByCode(productCode);
	// 	if (product) {
	// 		const productPrice = await getProductPriceFromTranzt(tranzt);
	// 		product.price = 0;
	// 		if (productPrice) {
	// 			product.price = productPrice;
	// 		}
	// 		saveToFile("product", product);
	// 		return [product];
	// 	} else {
	// 		console.log("error - product not found");
	// 	}
	// } else {
	// 	console.log("error - productCode not found");
	// }
};

// saveAllCols();

// SPRT - products
// DOCUMENT - orders
