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
            this.checkQueueExistRSMQ(qname)
                .then((result) => {
                    if (result) return this.createJobRSMQ(input);

                    return this.createQueueRSMQ(qname)
                        .then(() => this.createJobRSMQ(input))
                        .catch((e) => reject(e));
                })
                .then((result) => resolve(result))
                .catch((e) => reject(e));
        });
    }

    onCreated(qname, callback) {
        setInterval(() => {
            this.onCreatedJob(qname, callback);
        }, 10);
    }

    onCompleted(id, timeout = 120 * 1000) {
        return new Promise((resolve, reject) => {
            let counter = 0;
            let intvl = setInterval(() => {
                this.onCompletedJob(id).then((result) => {
                    if (result.status) {
                        clearInterval(intvl);
                        resolve(result);
                        return;
                    }
                    counter++;
                    if (counter * 10 >= timeout) {
                        reject(
                            `Error Unable to resolve the response in ${timeout} ms`
                        );
                        clearInterval(intvl);
                        return;
                    }
                }, 10);
            });
        });
    }
}

module.exports = UJQ;
