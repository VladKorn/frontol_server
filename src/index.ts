import { saveToFile, readFile, DbRequest, saveAllCols } from "./tools";
global.fetch = require("node-fetch");
// import Firebird from "node-firebird";
// import fs from "fs";

// addColl();
// DbRequest(`SELECT rdb$get_context('SYSTEM', 'ENGINE_VERSION')
// from rdb$database;`)
// 	.then((res) => {
// 		console.log("res", res);
// 	});

export interface Product {
	price: number;
	code: number;
	quantity: number;
}
export interface Order {
	STATE: number;
	ID: number;
	SUMM: number;
	products: any[];
}
const clearEmptyOrders = (_orders: Order[]) => {
	return _orders.filter((x) => x.SUMM > 0);
};
export const clearRemovedProducts = (_products: Product[]) => {
	const removedProds = _products.filter((x) => x.price < 0);
	// console.log("order.products", order.products);
	// console.log("removedProds", removedProds);

	// console.log("removedProds", -removedProds[0].price);
	const prods = _products.filter((prod) => {
		if (prod.price < 0) return false;
		let isRemovedProd = false;
		removedProds.forEach((x) => {
			if (
				prod.price === -x.price &&
				prod.code === x.code &&
				prod.quantity === -x.quantity
			)
				isRemovedProd = true;
		});
		if (isRemovedProd) return false;

		return true;
	});
	return prods;
};

const prepareOrderData = (_orders: Orders) => {
	const data: Order[] = [];
	_orders.forEach((_order) => {
		let products: Product[] = [];

		let needRemove = false;
		_order.products.forEach((prod: Product) => {
			if (prod.price < 0) {
				needRemove = true;
			}
		});

		if (needRemove) {
			products = clearRemovedProducts(_order.products);
		} else {
			products = _order.products;
		}

		data.push({
			STATE: _order.STATE,
			ID: _order.ID,
			SUMM: _order.SUMM,
			products: products,
		});
		// _item;
	});
	const _data = clearEmptyOrders(data);
	return _data;
};

const getOrdersFromDate = async (date: string) => {
	const orders = await DbRequest(
		`SELECT first 50* FROM DOCUMENT WHERE STATE = 1 AND last_order_update > '${date}' ORDER BY last_order_update desc`
	);
	return orders;
};
// getOrdersFromDate(`2020-11-01T22:00:00.000Z`);

const sendToSite = async (_data: Orders) => {
	saveToFile(`data`, _data);
	const data = prepareOrderData(_data);
	saveToFile(`newData`, data);
	console.log("sendToSite", data.length);
	const config: any = await readFile("config");

	fetch(`https://admin.magday.ru/frontol/order.php`, {
		method: "post",
		body: JSON.stringify({ orders: data, userId: config.userId }),
	});
	// .then(res => res.text()).then((res)=>{console.log("res" , res)});
};

const eventListener = async () => {
	let state: any = await readFile("state");
	console.log("state", state);
	if (state.error || !state.lastTimeUpdate) {
		const stateBackup: any = await readFile("stateBackup");
		if (stateBackup.error) {
			console.log("stateBackup state.error", stateBackup.error);
		} else {
			console.log("stateBackup", stateBackup, stateBackup.lastTimeUpdate);
			await saveToFile("state", stateBackup);
			state = stateBackup;
		}
	}
	console.log("initial state", state);
	let lastTimeUpdate = state.lastTimeUpdate;
	// let lastTimeUpdate = `2020-11-11 20:30:09.7460`;
	const checkOrdersUpdates = async () => {
		const orders = (await getOrdersFromDate(
			lastTimeUpdate
		)) as Array<tables.RootObject>;
		if (orders.length > 0) {
			lastTimeUpdate = orders[orders.length - 1].LAST_ORDER_UPDATE;
			await saveToFile("state", { lastTimeUpdate: lastTimeUpdate });
			setTimeout(() => {
				saveToFile("stateBackup", { lastTimeUpdate: lastTimeUpdate });
			}, 10000);

			for (let i = 0; i < orders.length; i++) {
				orders[i].products = await getProductsByOrderId(orders[i].ID);
			}
			const _orders: Orders = [];
			orders.forEach((_order) => {
				if (_order.products.length > 0) {
					_orders.push(_order);
				}
			});
			await saveToFile("orders", orders);
			if (_orders.length > 0) {
				return _orders;
			} else {
				return false;
			}
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
	// console.log(`getProductsByOrderId orderId`, orderId);
	const tranzt = await DbRequest(
		`SELECT * FROM TRANZT WHERE DOCUMENTID = ${orderId}`
	);
	let products: any = [];
	//@ts-ignore
	// console.log("tranzt.length" , tranzt.length);

	//@ts-ignore
	for (let i = 0; i < tranzt.length; i++) {
		//@ts-ignore
		let item = tranzt[i];
		// console.log("tranzt item" , item);
		if (item.WARECODE > 0 && item.SUMM && item.QUANTITY) {
			// let product = await getProductByCode(item.WARECODE);
			let product = {
				price: item.SUMM,
				code: item.WARECODE,
				quantity: item.QUANTITY,
			};
			products.push(product);
		}
	}
	// saveToFile("tranzt", tranzt);
	// console.log(`getProductsByOrderId res`, products.length);

	return products;

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

// saveAllCols();

// SPRT - products
// DOCUMENT - orders
