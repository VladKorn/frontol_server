// import { Order, Product, clearRemovedProducts } from "./index";
// import { readFile, saveToFile } from "./tools";

// export const debugOrder = async (orders: Order[]) => {
// 	orders.forEach((order) => {
// 		if (order.products.length === 0) {
// 			console.log(order);
// 		}

// 		let needRemove = false;
// 		order.products.forEach((prod) => {
// 			if (prod.price < 0) {
// 				needRemove = true;
// 			}
// 		});
// 		if (needRemove) {
// 			order.products = clearRemovedProducts(order.products);
// 		}
// 		// console.log("order.products", order.products);
// 	});
// 	saveToFile("clearedData", orders);
// };
// (async () => {
// 	// @ts-ignore
// 	const orders: Order[] = await readFile("newData");
// 	console.log("debug orders", orders.length);
// 	debugOrder(orders);
// })();

import { sendEmail } from "./tools";
sendEmail().catch(console.error);
