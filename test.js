//Import
const UJQ = require("./index.js");
const ujq = new UJQ({ port: "6379", host: "127.0.0.1" });

//Connect to UJQ
ujq.connect()
    .then(() => {
        //Create a Job
        console.log("Attempt_Create", +new Date());
        ujq.createJob("test_q2", { test: "hsefacsax" })

            //Set On Complete
            .then((result) => {
                console.log("Created_Job", +new Date());
                console.log("Job Id", result.id);
                return ujq.onCompleted(result.id);
            })
            .then((result) => {
                console.log("Job id", result.id);
                console.log("Completed", +new Date());
                console.log(result);
            });
    })
    .catch((e) => console.log(e));

//Trigger on Created
ujq.onCreated("test_q2", (err, data, complete) => {
    console.log("On Created", +new Date());
    console.log("id", data.id);
    console.log("Attempt Complete", +new Date());
    complete({ job: "done" }, false);
});
