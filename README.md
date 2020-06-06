# UJQ
Universal Job Queue or UJQ in short is a Redis based Simple Job management library build on top of RSMQ. This Library is light weight and build for working with microservices. Currently we have Node and Python implementation of Library. C# and Java are in pipeline. 
## Benifits
1. Jobs can be created and processed by different application or services
2. Auto trigger when job is created
3. Job Completion and error indications

# Node.JS
[CLICK HERE](https://github.com/Krishnaraj2003/PyUJQ) for Python Package

## Installing UJQ
You can use NPM to install

```
npm install --save ujq
```

## Connecting to Redis
UJQ uses native promises, hence ".then" will return a true once connection is established

```javascript
const UJQ = require("ujq");
const ujq = new UJQ({ port: "6379", host: "127.0.0.1" });

//Attempt connection
ujq.connect()
    .then((result) => { 
      //returns a true
    })
    .catch((e)=>console.log(e));
    
```
## Create a new Job
The following Code will create a new Job
```javascript
ujq.createJob("Job_name", { data: "Some Input Data" })
   .then((result) => {
          //Return value will be {id:'some id',status:true}
   }).catch((e)=>console.log(e));
    
```

## On creation of New Job
The Below Code will work on the job and returns a status
```javascript

ujq.onCreated("Job_name", (err, data, complete) => {
    console.log("Data", data);
    complete({ job: "done" }, false);
});

```

In case of error, the false tag can be set as true... Invoking the complete callback will complete the job and will be moved from queue...

## On completion of Job

```javascript
ujq.onCompleted(id_from_return_of_createdJob).then(
  (result) => console.log(result)
 ).catch((e)=>console.log(e));
```

The above code will complete the job.

# Express with UJQ
A simple implementation of Express with UJQ is as shown


Create a **Server.js** with the below code
```javascript
const express = require("express")
const UJQ = require("ujq")
const ujq = new UJQ({ port: "6379", host: "127.0.0.1" })
const app = express()
const port = 3000

  ujq.connect()
    .then(() => {
        app.get('/', (req, res) => {

            ujq.createJob("test_q2", { test: "sample Data" })

                //Set On Complete
                .then((result) => ujq.onCompleted(result.id))

                //Send Result
                .then((result) => res.send(result))
    })
    
}).catch((e) => console.log(e))

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
```

Now Create **Worker.js** with the below Code
```javascript
const UJQ = require("ujq");
const ujq = new UJQ({ port: "6379", host: "127.0.0.1" });

//Connect to UJQ
ujq.connect()
    .then(() => {
        ujq.onCreated("test_q2", (err, data, complete) => {
            console.log("Data", data);
            complete({ job: "done" }, false);
        });
    }).catch(e=>console.log(e))
```

Run both the files and **Enjoy** :B