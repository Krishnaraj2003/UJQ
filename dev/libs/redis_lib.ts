import redis from "ioredis";
import crypto from "crypto";

interface considerationType {
    [key: string]: Function;
}

interface initialData {
    id: string;
    created_on: number;
    defer: number;
    message: object;
}

interface considerationFinishedTypes {
    [key: string]: Object | string;
}

class RedisLib {
    queueNamePreString: string;
    finishedQueue: string;
    subscribeQueue: string;
    redisClient: any;
    subscriberClient: any;
    queuesUnderConsideration: considerationType;
    finishedQueuesUnderConsideration: considerationFinishedTypes;
    protected constructor(payload: any) {
        this.redisClient = new redis(payload);
        this.subscriberClient = new redis(payload);
        this.queueNamePreString = "$#ujq_queue";
        this.subscribeQueue = "$#ujq_subscribed_queue";
        this.finishedQueue = "$#ujq_finished_queue";
        this.queuesUnderConsideration = {};
        this.finishedQueuesUnderConsideration = {};
    }

    protected redisConnect(): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve, reject) => {
            try {
                await Promise.all([
                    this.redisClient.connect(),
                    this.subscriberClient.connect(),
                ]);
                this.eventEmitter();
                resolve(true);
            } catch (e) {
                if (e.message.includes("already connecting")) {
                    this.eventEmitter();
                    resolve(true);
                    return;
                }
                reject(e);
            }
        });
    }

    protected addToQueue(
        name: string,
        payload: object,
        timeout: number = 1000 * 10 * 60
    ): Promise<String> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                let md5Hash: string = this.encryptRandom();
                let data: initialData = {
                    id: md5Hash,
                    created_on: +new Date(),
                    defer: +new Date() + timeout,
                    message: payload,
                };
                await this.addToList(name, data);
                resolve(md5Hash);
            } catch (e) {
                reject(e);
            }
        });
    }

    private encryptRandom(): string {
        return crypto
            .createHash("md5")
            .update(
                `_$${(Math.random() * 100000000000).toString()}_${(
                    Math.random() * 100000000000
                ).toString()}`
            )
            .digest("hex");
    }

    private addToList(name: string, payload: object): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve, reject) => {
            try {
                let message: string = JSON.stringify(payload);
                this.redisClient
                    .pipeline()
                    .rpush(`${this.queueNamePreString}_${name}`, message)
                    .publish(this.subscribeQueue, name)
                    .exec((err: any) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(true);
                    });
            } catch (e) {
                reject(e);
            }
        });
    }

    private eventEmitter(): void {
        this.subscriberClient.subscribe(
            this.subscribeQueue,
            this.finishedQueue,
            (err: any, count: any) => {
                if (err) {
                    throw new Error(err);
                }
            }
        );
        this.subscriberClient.on(
            "message",
            (channel: string, message: string) => {
                this.newJob(channel, message);
            }
        );
    }

    private async newJob(queueName: string, jobname: string): Promise<void> {
        switch (queueName) {
            case this.subscribeQueue:
                if (this.queuesUnderConsideration[jobname]) {
                    let popMessage: null | any = await this.getMessages(
                        `${this.queueNamePreString}_${jobname}`
                    );

                    while (popMessage !== null) {
                        this.runCallback(jobname, null, popMessage);
                        popMessage = await this.getMessages(
                            `${this.queueNamePreString}_${jobname}`
                        );
                    }
                }
                break;
            case this.finishedQueue:
                if (this.finishedQueuesUnderConsideration[jobname]) {
                    let popMessage: null | any = await this.getMessages(
                        `${this.queueNamePreString}_${jobname}`,
                        true
                    );

                    this.finishedQueuesUnderConsideration[jobname] = popMessage;
                }
                break;
        }
    }

    protected onCreatedJob(jobname: string, callback: Function): void {
        try {
            if (Object.keys(this.queuesUnderConsideration).includes(jobname)) {
                throw new Error(`Job with Jobname: ${jobname} already exists`);
            }
            this.queuesUnderConsideration[jobname] = callback;
            this.newJob(this.subscribeQueue, jobname);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    private getMessages(
        queueName: string,
        del: boolean = false
    ): Promise<null | initialData | considerationFinishedTypes> {
        return new Promise<null | initialData | considerationFinishedTypes>(
            async (resolve, reject) => {
                try {
                    this.redisClient.lpop(
                        queueName,
                        (err: any, data: string | null) => {
                            if (err) {
                                reject(err);
                                if (del) {
                                    this.redisClient.del(
                                        queueName,
                                        (err: any) => {
                                            if (err) {
                                            }
                                        }
                                    );
                                }
                                return;
                            }
                            if (!data) {
                                resolve(null);
                                return;
                            }
                            resolve(JSON.parse(data));
                        }
                    );
                } catch (e) {
                    reject(e);
                }
            }
        );
    }

    private async runCallback(
        jobname: string,
        err: any,
        initialData: initialData
    ): Promise<void> {
        try {
            let complete: Function = (
                responseData: Object | string = {},
                error: Boolean = false
            ): Promise<string> => {
                let self: any = this;
                return new Promise<string>(async (resolve, reject) => {
                    try {
                        let newId = this.encryptRandom();
                        let finalData: object = {
                            id: newId,
                            initial_id: initialData.id,
                            initial_data: initialData.message,
                            completed_on: +new Date(),
                            created_on: initialData.created_on,
                            defer: initialData.defer,
                            data: responseData,
                            error,
                        };

                        self.redisClient
                            .pipeline()
                            .rpush(
                                `${this.queueNamePreString}_${initialData.id}`,
                                JSON.stringify(finalData)
                            )
                            .publish(this.finishedQueue, initialData.id)
                            .exec((err: any) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve(newId);
                            });
                    } catch (e) {
                        reject(e);
                    }
                });
            };
            await this.queuesUnderConsideration[jobname](
                err,
                initialData,
                complete
            );
        } catch (e) {
            throw new Error(e.message);
        }
    }

    protected onCompletedJob(jobId: string, timeout: number): Promise<Object> {
        return new Promise<Object>(async (resolve, reject) => {
            try {
                if (
                    Object.keys(this.finishedQueuesUnderConsideration).includes(
                        jobId
                    )
                ) {
                    reject("onCompleted can only be called once for a Job Id");
                    return;
                }
                this.finishedQueuesUnderConsideration[jobId] = "Pending";
                let count: number = 0;
                let Itvl: any = setInterval(() => {
                    if (count > timeout) {
                        reject(`Timedout Reached for Job ${jobId}`);
                        return;
                    }
                    if (
                        typeof this.finishedQueuesUnderConsideration[jobId] ===
                        "object"
                    ) {
                        clearInterval(Itvl);
                        let toSend: Object = this
                            .finishedQueuesUnderConsideration[jobId];
                        delete this.finishedQueuesUnderConsideration[jobId];
                        resolve(toSend);
                        return;
                    }

                    count += 5;
                }, 5);
            } catch (e) {
                reject(e);
            }
        });
    }
}

module.exports = RedisLib;
