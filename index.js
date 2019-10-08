var express = require("express");
var helmet=require("helmet");
var cookieParser=require("cookie-parser");
var session=require("express-session")
var bodyParser = require("body-parser");
var couchbase = require("couchbase");
var uuid = require("uuid");
var bcrypt = require("bcryptjs");

var niqlquery = couchbase.niqlquery;
var app = express();

app.set("view engine", "ejs");
app.use("/public", express.static("public"));
app.use(cookieParser());
app.use(helmet());
app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'sdlfjljrowuroweu',
    cookie: { secure: false }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

var cluster = new couchbase.Cluster("couchbase://127.0.0.1")
var bucket = cluster.openBucket("ankara", "ankara")

app.post("/submit", (req, res) => {
    // console.log(req.body.uname);
    //console.log(req.body.psw);
    var id = uuid.v4();
    var account = {
        "type": "account",
        "pid": id,
        "username": req.body.uname,
        "password": bcrypt.hashSync(req.body.psw, 10)
    }
    let profile = req.body;
    profile.type = "profile";
    delete profile.uname;
    delete profile.psw
    //console.log (profile);
    //console.log(account);
    bucket.insert(id, profile, (error, result) => {
        if (error) {
            return response.status(500).send(error);
        }
        bucket.insert(account.username, account, (error, result) => {
            if (error) {
                bucket.remove(id);
                return response.status(500).send(error);
            }
            //response.send(result);
            console.log(result);
        })
    })
})


app.get("/tester",(req,res)=>{
if(req.session.uname){
    res.send("gotten")
}else{res.send("login")}

})

app.post("/login", (req, res) => {
    bucket.get(req.body.uname, (error, result) => {
        if (error) {
            return res.status(500).send(error)
        }
        if (!bcrypt.compareSync(req.body.psw, result.value.password)) {
            return res.status(500).send({ "message": "the password is invalid" });
        }
        var id = uuid.v4();
        var session = {
            "type": "session",
            "pid": req.session,
        }
        req.session.uname=req.body.uname;
        bucket.insert(id, session, { "expiry": 3600 }, (error, result) => {
            if (error) {
                return res.status(500).send(error)
            }
            res.sendFile(__dirname + "/loggedon.html")
        })
    })
});

app.post("/unamevalidate", (req, res) => {
    bucket.get(req.body.uname, (error, result) => {
        if (!result) {
            res.send("1")
        } else { res.send("0") }
    })
})

// app.post("/emailvalidate", (req, res) => {
//     bucket.get(req.body.email, (error, result) => {
//         if (!result) {
//             res.send("1")
//         } else { res.send("0") }
//     })
// })

app.get("/orders", (req, res) => {
console.log("order");
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html")
});

app.get("/login",function(req,res){
    res.sendFile(__dirname+"/login.html");
})

app.listen(3000);
console.log("listening to port 3000")