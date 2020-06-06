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
                    if (err.toString().includes("queueExists")) {
                        resolve(true);
                        return;
                    }
                    reject(err);
                    return;
                }
                resolve(true);
            });
        });
    }

    //Run Redis Queue and Job
    onCreatedJob(qname, callback) {
        return new Promise((resolve1) => {
            this.popMessage({ qname }, (err, resp) => {
                if (
                    !resp ||
                    !resp.message ||
                    (typeof resp.message === "object" &&
                        JSON.stringify(resp.message) == "{}")
                ) {
                    resolve1(false);
                    return;
                }
                let errVal = undefined;
                if (err) {
                    errVal = err;
                }
                resolve1(true);
                let onCompleteJob = async (data = {}, err = false) => {
                    let self = this;
                    let id = resp.id;
                    return new Promise(function (resolve, reject) {
                        let qitem = {
                            qname: self.onCompleteQName,
                            message: JSON.stringify({
                                id,
                                data,
                                err,
                                initialData: resp.message,
                                completed_on: +new Date(),
                            }),
                            vt: 0,
                        };
         
                        self.createJobRSMQ(qitem)
                            .then((result) => {
                       
                                resolve(result);
                            })
                            .catch((e) => reject(e));
                    });
                };

                if (resp && resp.id) {
                    resp.message = JSON.parse(resp.message);
                    callback(err, resp, onCompleteJob);
                }
            });
        });
    }

    onCompletedJob(id) {
        return new Promise((resolve) => {
            let qname = this.onCompleteQName;
            this.getQueueAttributes({ qname }, (err, resp) => {
                let total = resp.msgs;
                if (total === 0) {
                    resolve({ status: false });
                    return;
                }
                let count = 0;
                let msgLoop = () => {
                    this.receiveMessage({ qname }, (err, resp1) => {
                        if (
                            resp1.message &&
                            typeof resp1.message === "string"
                        ) {
                            resp1.message = JSON.parse(resp1.message);
                        }
                        if (
                            resp1 &&
                            resp1.message &&
                            resp1.message.id &&
                            resp1.message.id === id
                        ) {
                            this.deleteMessage({ qname, id: resp1.id }, () => {
                                resolve({ status: true, data: resp1.message });
                                return;
                            });
                        } else if (count === total - 1) {
                            resolve({ status: false });
                            return;
                        } else {
                            count++;
                            if (
                                resp1.message &&
                                resp1.message.created_on &&
                                resp1.message.created_on + 30 * 1000 * 60 <=
                                    +new Date()
                            ) {
                                setTimeout(() =>
                                    this.deleteMessage(
                                        { qname, id: resp1.id },
                                        () => {}
                                    )
                                );
                            }
                            setTimeout(() => msgLoop());
                        }
                    });
                };
                msgLoop();
            });
        });
    }
}

module.exports = redisMain;
