"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var tools_1 = require("./tools");
global.fetch = require("node-fetch");
var prepareOrderData = function (_data) {
    var data = [];
    _data.forEach(function (_item) {
        data.push({
            STATE: _item.STATE,
            ID: _item.ID,
            SUMM: _item.SUMM,
            products: _item.products,
        });
    });
    return data;
};
var getOrdersFromDate = function (date) { return __awaiter(void 0, void 0, void 0, function () {
    var orders;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, tools_1.DbRequest("SELECT first 500* FROM DOCUMENT WHERE STATE = 1 AND last_order_update > '" + date + "' ORDER BY last_order_update desc")];
            case 1:
                orders = _a.sent();
                return [2, orders];
        }
    });
}); };
var sendToSite = function (_data) {
    tools_1.saveToFile("data", _data);
    var data = prepareOrderData(_data);
    tools_1.saveToFile("newData", data);
    console.log("sendToSite", data.length);
};
var eventListener = function () { return __awaiter(void 0, void 0, void 0, function () {
    var state, lastTimeUpdate, checkOrdersUpdates;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, tools_1.readFile("state")];
            case 1:
                state = _a.sent();
                console.log("initial state", state);
                lastTimeUpdate = state.lastTimeUpdate;
                checkOrdersUpdates = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var orders, i, _a, _orders_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4, getOrdersFromDate(lastTimeUpdate)];
                            case 1:
                                orders = (_b.sent());
                                if (!(orders.length > 0)) return [3, 6];
                                lastTimeUpdate = orders[orders.length - 1].LAST_ORDER_UPDATE;
                                i = 0;
                                _b.label = 2;
                            case 2:
                                if (!(i < orders.length)) return [3, 5];
                                _a = orders[i];
                                return [4, getProductsByOrderId(orders[i].ID)];
                            case 3:
                                _a.products = _b.sent();
                                _b.label = 4;
                            case 4:
                                i++;
                                return [3, 2];
                            case 5:
                                _orders_1 = [];
                                orders.forEach(function (_order) {
                                    if (_order.products.length > 0) {
                                        _orders_1.push(_order);
                                    }
                                });
                                tools_1.saveToFile("orders", orders);
                                tools_1.saveToFile("_orders", _orders_1);
                                if (_orders_1.length > 0) {
                                    return [2, _orders_1];
                                }
                                else {
                                    return [2, false];
                                }
                                return [3, 7];
                            case 6: return [2, false];
                            case 7: return [2];
                        }
                    });
                }); };
                checkOrdersUpdates();
                setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var changed_orders;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                console.log("lastTimeUpdate", lastTimeUpdate);
                                return [4, checkOrdersUpdates()];
                            case 1:
                                changed_orders = _a.sent();
                                if (changed_orders) {
                                    sendToSite(changed_orders);
                                }
                                return [2];
                        }
                    });
                }); }, 5000);
                return [2];
        }
    });
}); };
eventListener();
var getProductByCode = function (code) { return __awaiter(void 0, void 0, void 0, function () {
    var product;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, tools_1.DbRequest("SELECT * FROM SPRT WHERE CODE = " + code)];
            case 1:
                product = _a.sent();
                if (Array.isArray(product)) {
                    return [2, product[0]];
                }
                else {
                    return [2, []];
                }
                return [2];
        }
    });
}); };
var getProductsByOrderId = function (orderId) { return __awaiter(void 0, void 0, void 0, function () {
    var tranzt, products, i, item, product, getProductCodeFromTranzt, getProductPriceFromTranzt, productCode, product, productPrice;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, tools_1.DbRequest("SELECT * FROM TRANZT WHERE DOCUMENTID = " + orderId)];
            case 1:
                tranzt = _a.sent();
                products = [];
                for (i = 0; i < tranzt.length; i++) {
                    item = tranzt[i];
                    if (item.WARECODE > 0 && item.SUMM && item.QUANTITY) {
                        product = {
                            price: item.SUMM,
                            code: item.WARECODE,
                            quantity: item.QUANTITY,
                        };
                        products.push(product);
                    }
                }
                return [2, products];
            case 2:
                product = _a.sent();
                if (!product) return [3, 4];
                return [4, getProductPriceFromTranzt(tranzt)];
            case 3:
                productPrice = _a.sent();
                product.price = 0;
                if (productPrice) {
                    product.price = productPrice;
                }
                tools_1.saveToFile("product", product);
                return [2, [product]];
            case 4:
                console.log("error - product not found");
                _a.label = 5;
            case 5: return [3, 7];
            case 6:
                console.log("error - productCode not found");
                _a.label = 7;
            case 7: return [2];
        }
    });
}); };
//# sourceMappingURL=index.js.map