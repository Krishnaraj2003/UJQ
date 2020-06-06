//Imports
const RedisMain = require("./libs/redisMain");

//Main Class
class UJQ extends RedisMain {
    //Constructor
    constructor(parameters) {
        super();
        this.parameters = parameters;
    }

    connect() {
        return new Promise((resolve, reject) => {
            let par = this.parameters;
            this.connectRedis(par, "main")
                .then(() => this.createOnCompleteQueue())
                .then((result) => resolve(result))
                .catch((e) => reject(e));
        });
    }

    createJob(qname, parameters = {}, vt = 0) {
        return new Promise((resolve, reject) => {
            let input = { qname, message: JSON.stringify(parameters), vt };
            this.createJobRSMQ(input)
                .then((result) => resolve(result))
                .catch(() => {
                    this.createQueueRSMQ(qname)
                        .then(() => this.createJobRSMQ(input))
                        .then((result) => resolve(result))
                        .catch((e) => reject(e));
                });
        });
    }

    onCreated(qname, callback) {
        this.onCreatedJob(qname, callback).then(() => {
            setTimeout(() => {
                this.onCreated(qname, callback);
            }, 10);
        });
    }

    onCompleted(id, timeout = 120 * 1000, counter = 0) {
        return new Promise((resolve, reject) => {
            let loopFn = () => {
                this.onCompletedJob(id).then((result) => {
                    if (result.status) {
                        resolve(result.data);
                        return;
                    }
                    setTimeout(() => {
                        counter++;
                        loopFn()
                    }, 10);
                    

                    if (counter >= timeout) {
                        reject(
                            `Error Unable to resolve the response in ${timeout} ms`
                        );
                        return;
                    }
                });
            };
            loopFn();
        });
    }
}

module.exports = UJQ;
