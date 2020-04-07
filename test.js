//Import
const UJQ = require("./index.js");
const ujq = new UJQ({ port: "6379", host: "127.0.0.1" });

//Connect to UJQ
ujq.connect()
    .then(() => {
        //Create a Job
        ujq.createJob("test_q2", { test: "hsefacsax" })

            //Set On Complete
            .then((result) => ujq.onCompleted(result.id))

            //Log Result
            .then((result) => console.log(result));
    })
    .catch((e) => console.log(e));

//Trigger on Created
ujq.onCreated("test_q2", (err, data, complete) => {
    console.log("Data", data);
    complete({ job: "done" }, false);
});
