"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var RedisLib = require("./libs/redis_lib");
var UJQ = /** @class */ (function (_super) {
    __extends(UJQ, _super);
    function UJQ(payload) {
        return _super.call(this, payload) || this;
    }
    UJQ.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redisConnect()];
                    case 1:
                        _a.sent();
                        resolve(true);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        reject(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    UJQ.prototype.runJob = function (jobName, payload, timeout) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var id, returnVal, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.createJob(jobName, payload, timeout)];
                    case 1:
                        id = _a.sent();
                        return [4 /*yield*/, this.onCompleted(id)];
                    case 2:
                        returnVal = _a.sent();
                        if (returnVal.error) {
                            reject(returnVal.data);
                            return [2 /*return*/];
                        }
                        resolve(returnVal.data);
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _a.sent();
                        reject(e_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    UJQ.prototype.createJob = function (jobName, payload, timeout) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var id, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (typeof jobName === "number")
                            jobName = jobName.toString();
                        return [4 /*yield*/, this.addToQueue(jobName, payload, timeout)];
                    case 1:
                        id = _a.sent();
                        resolve(id);
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _a.sent();
                        reject(e_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    UJQ.prototype.onCreated = function (jobName, callback) {
        try {
            if (!jobName || !callback) {
                throw new Error("Job Name and Callback cannot be empty");
            }
            if (typeof callback !== "function") {
                throw new Error("Callback Must be a function");
            }
            if (typeof jobName === "number") {
                jobName = jobName.toString();
            }
            this.onCreatedJob(jobName, callback);
        }
        catch (e) {
            throw new Error(e.message);
        }
    };
    UJQ.prototype.onCompleted = function (jobId, timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = 10 * 1000 * 60; }
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var result, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.onCompletedJob(jobId, timeout)];
                    case 1:
                        result = _a.sent();
                        resolve(result);
                        return [3 /*break*/, 3];
                    case 2:
                        e_4 = _a.sent();
                        reject(e_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    return UJQ;
}(RedisLib));
module.exports = UJQ;
