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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ioredis_1 = __importDefault(require("ioredis"));
var crypto_1 = __importDefault(require("crypto"));
var RedisLib = /** @class */ (function () {
    function RedisLib(payload) {
        this.redisClient = new ioredis_1.default(payload);
        this.subscriberClient = new ioredis_1.default(payload);
        this.queueNamePreString = "$#ujq_queue";
        this.subscribeQueue = "$#ujq_subscribed_queue";
        this.finishedQueue = "$#ujq_finished_queue";
        this.queuesUnderConsideration = {};
        this.finishedQueuesUnderConsideration = {};
    }
    RedisLib.prototype.redisConnect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                this.redisClient.connect(),
                                this.subscriberClient.connect(),
                            ])];
                    case 1:
                        _a.sent();
                        this.eventEmitter();
                        resolve(true);
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        if (e_1.message.includes("already connecting")) {
                            this.eventEmitter();
                            resolve(true);
                            return [2 /*return*/];
                        }
                        reject(e_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    RedisLib.prototype.addToQueue = function (name, payload, timeout) {
        var _this = this;
        if (timeout === void 0) { timeout = 1000 * 10 * 60; }
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var md5Hash, data, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        md5Hash = this.encryptRandom();
                        data = {
                            id: md5Hash,
                            created_on: +new Date(),
                            defer: +new Date() + timeout,
                            message: payload,
                        };
                        return [4 /*yield*/, this.addToList(name, data)];
                    case 1:
                        _a.sent();
                        resolve(md5Hash);
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        reject(e_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    RedisLib.prototype.encryptRandom = function () {
        return crypto_1.default
            .createHash("md5")
            .update("_$" + (Math.random() * 100000000000).toString() + "_" + (Math.random() * 100000000000).toString())
            .digest("hex");
    };
    RedisLib.prototype.addToList = function (name, payload) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                try {
                    message = JSON.stringify(payload);
                    this.redisClient
                        .pipeline()
                        .rpush(this.queueNamePreString + "_" + name, message)
                        .publish(this.subscribeQueue, name)
                        .exec(function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(true);
                    });
                }
                catch (e) {
                    reject(e);
                }
                return [2 /*return*/];
            });
        }); });
    };
    RedisLib.prototype.eventEmitter = function () {
        var _this = this;
        this.subscriberClient.subscribe(this.subscribeQueue, this.finishedQueue, function (err, count) {
            if (err) {
                throw new Error(err);
            }
        });
        this.subscriberClient.on("message", function (channel, message) {
            _this.newJob(channel, message);
        });
    };
    RedisLib.prototype.newJob = function (queueName, jobname) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, popMessage, popMessage;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = queueName;
                        switch (_a) {
                            case this.subscribeQueue: return [3 /*break*/, 1];
                            case this.finishedQueue: return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 9];
                    case 1:
                        if (!this.queuesUnderConsideration[jobname]) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.getMessages(this.queueNamePreString + "_" + jobname)];
                    case 2:
                        popMessage = _b.sent();
                        _b.label = 3;
                    case 3:
                        if (!(popMessage !== null)) return [3 /*break*/, 5];
                        this.runCallback(jobname, null, popMessage);
                        return [4 /*yield*/, this.getMessages(this.queueNamePreString + "_" + jobname)];
                    case 4:
                        popMessage = _b.sent();
                        return [3 /*break*/, 3];
                    case 5: return [3 /*break*/, 9];
                    case 6:
                        if (!this.finishedQueuesUnderConsideration[jobname]) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getMessages(this.queueNamePreString + "_" + jobname, true)];
                    case 7:
                        popMessage = _b.sent();
                        this.finishedQueuesUnderConsideration[jobname] = popMessage;
                        _b.label = 8;
                    case 8: return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    RedisLib.prototype.onCreatedJob = function (jobname, callback) {
        try {
            if (Object.keys(this.queuesUnderConsideration).includes(jobname)) {
                throw new Error("Job with Jobname: " + jobname + " already exists");
            }
            this.queuesUnderConsideration[jobname] = callback;
            this.newJob(this.subscribeQueue, jobname);
        }
        catch (e) {
            throw new Error(e.message);
        }
    };
    RedisLib.prototype.getMessages = function (queueName, del) {
        var _this = this;
        if (del === void 0) { del = false; }
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    this.redisClient.lpop(queueName, function (err, data) {
                        if (err) {
                            reject(err);
                            if (del) {
                                _this.redisClient.del(queueName, function (err) {
                                    if (err) {
                                    }
                                });
                            }
                            return;
                        }
                        if (!data) {
                            resolve(null);
                            return;
                        }
                        resolve(JSON.parse(data));
                    });
                }
                catch (e) {
                    reject(e);
                }
                return [2 /*return*/];
            });
        }); });
    };
    RedisLib.prototype.runCallback = function (jobname, err, initialData) {
        return __awaiter(this, void 0, void 0, function () {
            var complete, e_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        complete = function (responseData, error) {
                            if (responseData === void 0) { responseData = {}; }
                            if (error === void 0) { error = false; }
                            var self = _this;
                            return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                                var newId_1, finalData;
                                return __generator(this, function (_a) {
                                    try {
                                        newId_1 = this.encryptRandom();
                                        finalData = {
                                            id: newId_1,
                                            initial_id: initialData.id,
                                            initial_data: initialData.message,
                                            completed_on: +new Date(),
                                            created_on: initialData.created_on,
                                            defer: initialData.defer,
                                            data: responseData,
                                            error: error,
                                        };
                                        self.redisClient
                                            .pipeline()
                                            .rpush(this.queueNamePreString + "_" + initialData.id, JSON.stringify(finalData))
                                            .publish(this.finishedQueue, initialData.id)
                                            .exec(function (err) {
                                            if (err) {
                                                reject(err);
                                                return;
                                            }
                                            resolve(newId_1);
                                        });
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                    return [2 /*return*/];
                                });
                            }); });
                        };
                        return [4 /*yield*/, this.queuesUnderConsideration[jobname](err, initialData, complete)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_3 = _a.sent();
                        throw new Error(e_3.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisLib.prototype.onCompletedJob = function (jobId, timeout) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var count_1, Itvl_1;
            var _this = this;
            return __generator(this, function (_a) {
                try {
                    if (Object.keys(this.finishedQueuesUnderConsideration).includes(jobId)) {
                        reject("onCompleted can only be called once for a Job Id");
                        return [2 /*return*/];
                    }
                    this.finishedQueuesUnderConsideration[jobId] = "Pending";
                    count_1 = 0;
                    Itvl_1 = setInterval(function () {
                        if (count_1 > timeout) {
                            reject("Timedout Reached for Job " + jobId);
                            return;
                        }
                        if (typeof _this.finishedQueuesUnderConsideration[jobId] ===
                            "object") {
                            clearInterval(Itvl_1);
                            var toSend = _this
                                .finishedQueuesUnderConsideration[jobId];
                            delete _this.finishedQueuesUnderConsideration[jobId];
                            resolve(toSend);
                            return;
                        }
                        count_1 += 5;
                    }, 5);
                }
                catch (e) {
                    reject(e);
                }
                return [2 /*return*/];
            });
        }); });
    };
    return RedisLib;
}());
module.exports = RedisLib;
