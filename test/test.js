const UJQ = require("../build/index");

//Attempt connection
let ujq = new UJQ({ host: "localhost", port: 6379 });
(async () => {
    try {
        let status = await ujq.connect();
        console.log("Connected : ", status);
        let jobId = await ujq.createJob("test", { data: "hi" });
        console.log("jobId", jobId);
        ujq.onCreated("test", (err, data, complete) => {
            console.log("err", err);
            console.log("data", data);
            complete({ foo: "bar" }, false);
        });
        let result = await ujq.onCompleted(jobId);
        console.log("Result", result);
        result = await ujq.runJob("test", { data: "hi" });
        console.log("Result Again", result);
    } catch (e) {
        console.log(e);
    }
})();
