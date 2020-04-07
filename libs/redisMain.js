const redis = require("redis");
const Rsmq = require("rsmq");

class redisMain extends Rsmq {
    constructor() {
        super();
        this.client = {};
        this.onCompleteQName = "onComplete";
    }

    //Create Conn, Queue and Job
    connectRedis(parameters, type = "main") {
        this.options = { ...parameters, ns: "rsmq" };
        return new Promise((resolve, reject) => {
            this.client[type] = redis.createClient(parameters);
            this.client[type].on("error", (err) => {
                reject(err);
                return;
            });
            this.client[type].on("connect", () => {
                resolve(true);
            });
        });
    }

    createOnCompleteQueue() {
        return new Promise((resolve, reject) => {
            let queueName = this.onCompleteQName;
            this.checkQueueExistRSMQ(queueName)
                .then((result) => {
                    if (!result) {

                        return this.createQueueRSMQ(queueName);
                    }
                    return new Promise((resolve) => resolve(true));
                })
                .then((result) => resolve(result))
                .catch((e) => reject(e));
        });
    }

    createJobRSMQ(payload) {
        let { qname, message, vt } = payload;
        return new Promise((resolve, reject) => {
            this.sendMessage({ qname, message, vt }, (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id: resp, status: true });
            });
        });
    }

    checkQueueExistRSMQ(queueName) {
        return new Promise((resolve, reject) => {
            this.listQueues((err, queues) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (queues.includes(queueName)) {
                    resolve(true);
                    return;
                }
                resolve(false);
            });
        });
    }

    createQueueRSMQ(qname) {
        return new Promise((resolve, reject) => {
            this.createQueue({ qname, vt: 0, delay: 0, maxsize: -1 }, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(true);
            });
        });
    }

    //Run Redis Queue and Job
    onCreatedJob(qname, callback) {
        this.popMessage({ qname }, (err, resp) => {
            let errVal = undefined;
            if (err) {
                errVal = err;
            }

            let onCompleteJob = async (data = {}, err = false) => {
                let self = this;
                return new Promise(function (resolve, reject) {
                    self.createJobRSMQ({
                        qname: self.onCompleteQName,
                        message: JSON.stringify({
                            id: resp.id,
                            data,
                            err,
                            initialData: resp.message,
                        }),
                        vt: 0,
                    })
                        .then((result) => resolve(result))
                        .catch((e) => reject(e));
                });
            };

            if (resp && resp.id) {
                resp.message = JSON.parse(resp.message);
                callback(err, resp, onCompleteJob);
            }
        });
    }

    onCompletedJob(id) {
        let qname = this.onCompleteQName;
        return new Promise((resolve) => {
            this.receiveMessage({ qname }, (err, resp) => {
                resp.message = JSON.parse(resp.message);
                if (resp.message.id !== id) {
                    resolve({ status: false });
                    return;
                }
                this.deleteMessage({ qname, id }, () => {
                    resolve({ status: true, data: resp.message });
                });
            });
        });
    }
}

module.exports = redisMain;
