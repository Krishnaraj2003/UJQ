declare const RedisLib: any;
declare class UJQ extends RedisLib {
    constructor(payload: any);
    connect(): Promise<Boolean>;
    runJob(jobName: string, payload: object, timeout?: number): Promise<Object>;
    createJob(jobName: String | Number, payload: Object, timeout?: Number): Promise<String>;
    onCreated(jobName: String | Number, callback: Function): void;
    onCompleted(jobId: String, timeout?: number): Promise<Object>;
}
