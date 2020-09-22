const RedisLib = require("./libs/redis_lib");

class UJQ extends RedisLib {
    public constructor(payload: any) {
        super(payload);
    }
    public connect(): Promise<Boolean> {
        return new Promise<Boolean>(async (resolve, reject) => {
            try {
                await this.redisConnect();
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    public runJob(
        jobName: string,
        payload: object,
        timeout?: number
    ): Promise<Object> {
        return new Promise<Object>(async (resolve, reject) => {
            try {
                let id:String = await this.createJob(jobName, payload, timeout);
                let returnVal:any = await this.onCompleted(id);
                if (returnVal.error) {
                    reject(returnVal.data);
                    return;
                }
                resolve(returnVal.data);
            } catch (e) {
                reject(e);
            }
        });
    }

    public createJob(
        jobName: String | Number,
        payload: Object,
        timeout?: Number
    ): Promise<String> {
        return new Promise<String>(async (resolve, reject) => {
            try {
                if (typeof jobName === "number") jobName = jobName.toString();
                let id: String = await this.addToQueue(
                    jobName,
                    payload,
                    timeout
                );
                resolve(id);
            } catch (e) {
                reject(e);
            }
        });
    }

    public onCreated(jobName: String | Number, callback: Function): void {
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
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public onCompleted(
        jobId: String,
        timeout: number = 10 * 1000 * 60
    ): Promise<Object> {
        return new Promise<Object>(async (resolve, reject) => {
            try {
                let result = await this.onCompletedJob(jobId, timeout);
                resolve(result);
            } catch (e) {
                reject(e);
            }
        });
    }
}

module.exports = UJQ;
