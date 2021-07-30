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
exports.saveAllCols = exports.getAllCols = exports.onOrdersChange = exports.saveTriggders = exports.deleteTrigger = exports.createTrigger = exports.addColl = exports.readFile = exports.saveToFile = exports.DbRequest = void 0;
var fs = require("fs");
var Firebird = require("node-firebird");
var options = {};
options.host = "localhost";
options.port = 3050;
options.database = "database.fdb";
options.database = "C:\\DB\\MAIN.GDB";
options.user = "SYSDBA";
options.password = "masterkey";
options.lowercase_keys = false;
options.role = null;
options.pageSize = 4096;
var DbRequest = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, new Promise(function (resolve, reject) {
                Firebird.attach(options, function (err, db) {
                    if (err) {
                        reject(err);
                    }
                    db.query(query, function (err, result) {
                        if (err) {
                            console.log("err", err);
                            reject(err);
                        }
                        resolve(result);
                        db.detach();
                    });
                });
            })];
    });
}); };
exports.DbRequest = DbRequest;
var saveToFile = function (name, obg) {
    fs.writeFile(name + ".json", JSON.stringify(obg, null, 2), null, function () { });
};
exports.saveToFile = saveToFile;
var readFile = function (name) {
    return new Promise(function (resolve, reject) {
        fs.readFile(name + ".json", "utf8", function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(JSON.parse(data));
        });
    });
};
exports.readFile = readFile;
var addColl = function () {
    exports.DbRequest("ALTER TABLE DOCUMENT ADD last_order_update VARCHAR(25)");
};
exports.addColl = addColl;
var createTrigger = function () { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, exports.DbRequest("create trigger on_orders_change for DOCUMENT\n    before insert or update\nas\n  begin\n    new.last_order_update = CURRENT_TIMESTAMP;\n  end").catch(function (err) {
                    console.log("createTriger_err", err);
                })];
            case 1:
                res = _a.sent();
                console.log("createTriger", res);
                exports.saveTriggders();
                return [2];
        }
    });
}); };
exports.createTrigger = createTrigger;
var deleteTrigger = function () { return __awaiter(void 0, void 0, void 0, function () {
    var res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, exports.DbRequest("DROP trigger on_orders_change").catch(function (err) {
                    console.log("createTriger_err", err);
                })];
            case 1:
                res = _a.sent();
                console.log("res deleteTrigger", res);
                exports.saveTriggders();
                return [2];
        }
    });
}); };
exports.deleteTrigger = deleteTrigger;
var saveTriggders = function () {
    exports.DbRequest("SELECT RDB$TRIGGER_NAME AS trigger_name,\n    RDB$RELATION_NAME AS table_name,\n    RDB$TRIGGER_SOURCE AS trigger_body,\n    CASE RDB$TRIGGER_TYPE\n     WHEN 1 THEN 'BEFORE'\n     WHEN 2 THEN 'AFTER'\n     WHEN 3 THEN 'BEFORE'\n     WHEN 4 THEN 'AFTER'\n     WHEN 5 THEN 'BEFORE'\n     WHEN 6 THEN 'AFTER'\n    END AS trigger_type,\n    CASE RDB$TRIGGER_TYPE\n     WHEN 1 THEN 'INSERT'\n     WHEN 2 THEN 'INSERT'\n     WHEN 3 THEN 'UPDATE'\n     WHEN 4 THEN 'UPDATE'\n     WHEN 5 THEN 'DELETE'\n     WHEN 6 THEN 'DELETE'\n    END AS trigger_event,\n    CASE RDB$TRIGGER_INACTIVE\n     WHEN 1 THEN 0 ELSE 1\n    END AS trigger_enabled,\n    RDB$DESCRIPTION AS trigger_comment\n    FROM RDB$TRIGGERS").then(function (res) {
        exports.saveToFile("TRIGGERS", res);
    });
};
exports.saveTriggders = saveTriggders;
var onOrdersChange = function () {
    console.log("onOrdersChange");
};
exports.onOrdersChange = onOrdersChange;
var getAllCols = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, new Promise(function (resolve, reject) {
                Firebird.attach(options, function (err, db) {
                    if (err)
                        throw err;
                    db.query("SELECT a.RDB$RELATION_NAME FROM RDB$RELATIONS a WHERE COALESCE(RDB$SYSTEM_FLAG, 0) = 0 AND RDB$RELATION_TYPE = 0", function (err, result) {
                        if (err) {
                            reject(err);
                            console.log("err", err);
                        }
                        var res = [];
                        result.forEach(function (item) {
                            res.push(item["RDB$RELATION_NAME"].replace(/ /g, ""));
                        });
                        resolve(res);
                        db.detach();
                    });
                });
            })];
    });
}); };
exports.getAllCols = getAllCols;
var saveAllCols = function () { return __awaiter(void 0, void 0, void 0, function () {
    var cols;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, exports.getAllCols()];
            case 1:
                cols = _a.sent();
                cols.forEach(function (colName) { return __awaiter(void 0, void 0, void 0, function () {
                    var resCount, count, skip;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, exports.DbRequest("SELECT count(*) FROM " + colName)];
                            case 1:
                                resCount = _a.sent();
                                count = resCount[0].COUNT;
                                skip = count > 10 ? count - 10 : 0;
                                console.log("count " + colName, count);
                                Firebird.attach(options, function (err, db) {
                                    if (err)
                                        throw err;
                                    db.query("SELECT skip " + skip + " * FROM " + colName, function (err, result) {
                                        if (err) {
                                            console.log("err", err);
                                        }
                                        fs.writeFile("dbcol/" + colName + ".json", JSON.stringify(result, null, 2), null, function () { });
                                        db.detach();
                                    });
                                });
                                return [2];
                        }
                    });
                }); });
                return [2];
        }
    });
}); };
exports.saveAllCols = saveAllCols;
//# sourceMappingURL=tools.js.map