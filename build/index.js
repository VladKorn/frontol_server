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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersFromDate = exports.getOrder = exports.clearRemovedProducts = void 0;
var tools_1 = require("./tools");
global.fetch = require("node-fetch");
var debug = false;
var innerState = {
    eventListenerinProgress: false,
    checkOrdersUpdatesInProgress: false,
    isFirstStart: true,
};
var clearEmptyOrders = function (_orders) {
    return _orders.filter(function (x) { return x.SUMM > 0; });
};
var isOrderCancel = function (_products) {
    return _products.every(function (x) { return x.price < 0; });
};
var clearRemovedProducts = function (_products) {
    if (debug)
        (0, tools_1.saveToFile)("debug/clearRemovedProducts__products", _products);
    var productsByCode = {};
    _products.forEach(function (prod) {
        if (!productsByCode[prod.code])
            productsByCode[prod.code] = [];
        productsByCode[prod.code].push(prod);
    });
    var products = [];
    Object.keys(productsByCode).forEach(function (key) {
        var prods = productsByCode[parseInt(key)];
        var product = {
            code: prods[0].code,
            price: prods.reduce(function (accumulator, prod) { return accumulator + prod.price; }, 0),
            priceBase: prods.reduce(function (accumulator, prod) { return accumulator + prod.priceBase; }, 0),
            quantity: prods.reduce(function (accumulator, prod) { return accumulator + prod.quantity; }, 0),
        };
        if (product.price > 0) {
            products.push(product);
        }
    });
    if (debug)
        (0, tools_1.saveToFile)("debug/clearRemovedProducts_products", products);
    return products;
};
exports.clearRemovedProducts = clearRemovedProducts;
var prepareOrderData = function (_orders) { return __awaiter(void 0, void 0, void 0, function () {
    var data, cancelledOrders, _loop_1, index, _data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                data = [];
                cancelledOrders = [];
                _loop_1 = function (index) {
                    var _order, id, order, products, needRemove;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _order = _orders[index];
                                if (!isOrderCancel(_order.products)) return [3, 2];
                                id = _order.DOCUMENTID;
                                return [4, (0, exports.getOrder)(id)];
                            case 1:
                                order = _b.sent();
                                if (!order)
                                    return [2, "continue"];
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
                                return [2, "continue"];
                            case 2:
                                products = [];
                                needRemove = false;
                                _order.products.forEach(function (prod) {
                                    if (prod.price < 0) {
                                        needRemove = true;
                                    }
                                });
                                if (needRemove) {
                                    products = (0, exports.clearRemovedProducts)(_order.products);
                                }
                                else {
                                    products = _order.products;
                                }
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
                                return [2];
                        }
                    });
                };
                index = 0;
                _a.label = 1;
            case 1:
                if (!(index < _orders.length)) return [3, 4];
                return [5, _loop_1(index)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                index++;
                return [3, 1];
            case 4:
                _data = clearEmptyOrders(data);
                return [2, __spreadArray(__spreadArray([], _data, true), cancelledOrders, true)];
        }
    });
}); };
var getOrder = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var orders;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, tools_1.DbRequest)("SELECT * FROM DOCUMENT WHERE id = '".concat(id, "'"))];
            case 1:
                orders = (_a.sent());
                if (!orders.length) {
                    return [2, false];
                }
                console.log("getOrder id order", id, orders[0]);
                return [2, orders[0]];
        }
    });
}); };
exports.getOrder = getOrder;
var getOrdersFromDate = function (date) { return __awaiter(void 0, void 0, void 0, function () {
    var orders;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, tools_1.DbRequest)("SELECT first 10000 * FROM DOCUMENT WHERE STATE = 1 AND last_order_update > '".concat(date, "' ORDER BY last_order_update desc"))];
            case 1:
                orders = _a.sent();
                if (orders) {
                    console.log("getOrdersFromDate date orders.length", date, orders === null || orders === void 0 ? void 0 : orders.length);
                }
                return [2, orders];
        }
    });
}); };
exports.getOrdersFromDate = getOrdersFromDate;
var sendToSite = function (_data) { return __awaiter(void 0, void 0, void 0, function () {
    var data, config;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (debug)
                    (0, tools_1.saveToFile)("debug/data", _data);
                return [4, prepareOrderData(_data)];
            case 1:
                data = _a.sent();
                console.log("sendToSite", data.length);
                return [4, (0, tools_1.readFile)("config")];
            case 2:
                config = _a.sent();
                console.log("sendToSite test", data.filter(function (x) { return x.STATE === "cancelled"; }));
                return [2, fetch("https://admin.yatakem.ru/frontol/order.php", {
                        method: "post",
                        body: JSON.stringify({ orders: data, userId: config.userId }),
                    })];
        }
    });
}); };
var getState = function () { return __awaiter(void 0, void 0, void 0, function () {
    var state, stateBackup, date, dayNow, monthNow, day, month;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, tools_1.readFile)("state")];
            case 1:
                state = _a.sent();
                if (!(state.error || !state.lastTimeUpdate)) return [3, 5];
                return [4, (0, tools_1.readFile)("stateBackup")];
            case 2:
                stateBackup = _a.sent();
                if (!stateBackup.error) return [3, 3];
                return [3, 5];
            case 3: return [4, (0, tools_1.saveToFile)("state", stateBackup)];
            case 4:
                _a.sent();
                state = stateBackup;
                _a.label = 5;
            case 5:
                console.log("initial state", state);
                if (innerState.isFirstStart) {
                    date = new Date(state.lastTimeUpdate);
                    dayNow = date.getDate();
                    if (dayNow < 10) {
                        dayNow = "0" + dayNow;
                    }
                    monthNow = date.getMonth() + 1;
                    if (monthNow < 10) {
                        monthNow = "0" + monthNow;
                    }
                    date.setDate(date.getDate() - 1);
                    day = date.getDate();
                    if (day < 10) {
                        day = "0" + day;
                    }
                    month = date.getMonth() + 1;
                    if (month < 10) {
                        month = "0" + month;
                    }
                    state.lastTimeUpdate = state.lastTimeUpdate
                        .replace("-".concat(monthNow, "-"), "-".concat(month, "-"))
                        .replace("-".concat(dayNow, " "), "-".concat(day, " "));
                    console.log("initial state - isFirstStart", state);
                    innerState.isFirstStart = false;
                }
                return [2, state];
        }
    });
}); };
var checkOrdersUpdatesOnce = function () { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (innerState.checkOrdersUpdatesInProgress)
                    return [2, false];
                innerState.checkOrdersUpdatesInProgress = true;
                return [4, checkOrdersUpdates()];
            case 1:
                res = _a.sent();
                innerState.checkOrdersUpdatesInProgress = false;
                return [2, res];
        }
    });
}); };
var checkOrdersUpdates = function () { return __awaiter(void 0, void 0, void 0, function () {
    var state, lastTimeUpdate, orders, _lastTimeUpdate_1, i, _a, _b, _orders_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4, getState()];
            case 1:
                state = _c.sent();
                lastTimeUpdate = state.lastTimeUpdate;
                console.log("lastTimeUpdate", lastTimeUpdate);
                return [4, (0, exports.getOrdersFromDate)(lastTimeUpdate)];
            case 2:
                orders = (_c.sent());
                if (orders === false)
                    return [2];
                if (!(orders.length > 0)) return [3, 10];
                _lastTimeUpdate_1 = orders.sort(function (x, z) {
                    return (new Date(z.LAST_ORDER_UPDATE) - new Date(x.LAST_ORDER_UPDATE));
                })[0].LAST_ORDER_UPDATE;
                return [4, (0, tools_1.saveToFile)("state", { lastTimeUpdate: _lastTimeUpdate_1 })];
            case 3:
                _c.sent();
                setTimeout(function () {
                    (0, tools_1.saveToFile)("stateBackup", { lastTimeUpdate: _lastTimeUpdate_1 });
                }, 10000);
                i = 0;
                _c.label = 4;
            case 4:
                if (!(i < orders.length)) return [3, 8];
                console.log("eventListener order", orders[i].CHEQUENUMBER);
                _a = orders[i];
                return [4, getProductsByOrderId(orders[i].ID)];
            case 5:
                _a.products = _c.sent();
                _b = orders[i];
                return [4, (0, tools_1.isCardPayment)(orders[i].ID)];
            case 6:
                _b.isCardPayment = _c.sent();
                _c.label = 7;
            case 7:
                i++;
                return [3, 4];
            case 8:
                _orders_1 = [];
                orders.forEach(function (_order) {
                    if (_order.products.length > 0) {
                        _orders_1.push(_order);
                    }
                });
                return [4, (0, tools_1.saveToFile)("debug/orders", orders)];
            case 9:
                _c.sent();
                if (_orders_1.length > 0) {
                    return [2, _orders_1];
                }
                else {
                    return [2, false];
                }
                return [3, 11];
            case 10: return [2, false];
            case 11: return [2];
        }
    });
}); };
var eventListener = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
            var changed_orders, step, index, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (innerState.eventListenerinProgress)
                            return [2];
                        if (innerState.checkOrdersUpdatesInProgress)
                            return [2];
                        console.log("eventListener setInterval !eventListenerinProgress");
                        return [4, checkOrdersUpdatesOnce()];
                    case 1:
                        changed_orders = _a.sent();
                        if (!changed_orders)
                            return [2];
                        innerState.eventListenerinProgress = true;
                        step = 50;
                        index = 0;
                        _a.label = 2;
                    case 2:
                        if (!(index < changed_orders.length)) return [3, 5];
                        console.log("eventListener sendToSite ".concat(index, " of ").concat(changed_orders.length > index + step
                            ? index + step
                            : changed_orders.length, " / ").concat(changed_orders.length));
                        return [4, sendToSite(changed_orders.slice(index, index + step))];
                    case 3:
                        res = _a.sent();
                        _a.label = 4;
                    case 4:
                        index = index + step;
                        return [3, 2];
                    case 5:
                        innerState.eventListenerinProgress = false;
                        console.log("changed_orders", changed_orders);
                        return [2];
                }
            });
        }); }, 5000);
        return [2];
    });
}); };
var main = function () {
    console.log("version:1.8.23");
    eventListener();
};
main();
var getProductByCode = function (code) { return __awaiter(void 0, void 0, void 0, function () {
    var product;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, tools_1.DbRequest)("SELECT * FROM SPRT WHERE CODE = ".concat(code))];
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
    var tranzt, products, i, item, product;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, tools_1.DbRequest)("SELECT * FROM TRANZT WHERE DOCUMENTID = ".concat(orderId))];
            case 1:
                tranzt = _a.sent();
                products = [];
                if (!debug) return [3, 3];
                return [4, (0, tools_1.saveToFile)("debug/getProductsByOrderId_tranzt", tranzt)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                for (i = 0; i < tranzt.length; i++) {
                    item = tranzt[i];
                    if (item.WARECODE > 0 &&
                        item.SUMM &&
                        item.QUANTITY &&
                        item.TRANZTYPE !== 17 &&
                        item.TRANZTYPE !== 87 &&
                        item.TRANZTYPE !== 37) {
                        product = {
                            priceBase: item.SUMM,
                            price: item.SUMMWD,
                            code: item.WARECODE,
                            quantity: item.QUANTITY,
                        };
                        products.push(product);
                    }
                }
                if (!debug) return [3, 5];
                return [4, (0, tools_1.saveToFile)("debug/getProductsByOrderId_products", products)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [2, products];
        }
    });
}); };
//# sourceMappingURL=index.js.map