var express = require('express');
var app = express();
var mongojs = require('mongojs');

var db = mongojs('mongodb://heroku_2hcp9k8k:19uocjcgsn6ce4pp7j66fe1ras@ds119020.mlab.com:19020/heroku_2hcp9k8k', ['questionsCollection', 'counter']);
var bodyParser = require('body-parser');
var path = require('path');
var cookie = require('cookie');
var cookies = cookie.parse('ckuCount = -1; dvCount = -1; ivCount = -1;dsCount = -1; isCount = -1')

console.log(cookies.ckuCount);
console.log("hai")


app.use(express.static(__dirname));
app.use(bodyParser.json());


/* SOCKET IO */
var http = require('http').Server(app);
var io = require('socket.io')(http);
var userCounter = 1;

// socket functions
io.on('connection', function (socket) {
    console.log('User ' + userCounter + ' connected.');
    userCounter += 1;
    socket.on('disconnect', function () {
        console.log('a user disconnected');
        userCounter -= 1;
    });

    // servers response to emitted message from controllers
    socket.on('question message', function (msg) {
        console.log('message: ' + msg);

        //creates random string with the function outside the socket function
        var rString = randomString(24, '0123456789abcdef');

        //inserting new message into mlab database
        db.questionsCollection.insert({_id: mongojs.ObjectID(rString), text: msg}, function (err, o) {
            if (err) {
                console.warn(err.message);
            }
            else {
                console.log("question message inserted into the db: " + msg);
            }
        });
        // broadcasts question message to all listening sockets with the same object we insert into the database
        io.emit('question message', {_id: mongojs.ObjectID(rString), text: msg});
    });

    //servers response to emitted message to delete question from lecturer controller
    socket.on('question delete', function (index, id) {

        console.log("Server received 'question delete' broadcast for id: "+id);
        //deletes the selected question from the database
        db.questionsCollection.remove({_id: mongojs.ObjectId(id)});
        io.emit('question delete', index, id);

    });
});

/* ID Generator */
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}


/* SERVER SIDE ROUTING */
app.get('/lecturer', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/student', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/questions', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/counter', function(req, res){
    if (req.query.id == "cku"){
        cookies.ckuCount=parseInt(cookies.ckuCount)+1
        console.log("1");
        var count = cookies.ckuCount
    } else if (req.query.id=="dv"){
        cookies.dvCount=parseInt(cookies.dvCount)+1;
        var count = cookies.dvCount;
        console.log("dv")
    }else if (req.query.id=="iv"){
        cookies.ivCount=parseInt(cookies.ivCount)+1;
        var count = cookies.ivCount;
    }else if (req.query.id=="ds"){
        cookies.dsCount=parseInt(cookies.dsCount)+1;
        var count = cookies.dsCount;
    }else if (req.query.id=="is"){
        cookies.isCount = parseInt(cookies.isCount)+1;
        var count = cookies.isCount;
    }
    if (count % 2 == 0){
        console.log(req.query.id);
        db.counter.update({"counter" : req.query.id}, {"$inc":{"hits": 1}});

        console.log("mod 0 ")
    }
    else if (count % 2 == 1) {
        db.counter.update({"counter" : req.query.id}, {"$inc":{"hits": -1}});

        console.log("mod 1")
    }
    res.json("test yo");

});

/* DATABASE METHODS */
app.get('/questionsCollection', function (req, res, socket) {
    console.log("I received a GET request");
    db.questionsCollection.find(function (err, docs) {
        if (err) {
            console.warn(err.message);
        }
        else {
            console.log(docs);
            res.json(docs);
        }
    });
});

/*app.post('/questionsCollection', function (req, res) {
    console.log("I received a POST request");
    console.log(req.body);
    db.questionsCollection.insert(req.body, function (err, doc) {
        res.json(doc);
    });
});

app.delete('/questionsCollection/:id', function (req, res) {
    console.log("Server received a DELETE request for ID: " + req.params.id);
    var id = req.params.id;
    console.log(typeof id);
    db.questionsCollection.remove({_id: mongojs.ObjectId(id)});
});*/

app.get('/questionsCollection/:id', function (req, res) {
    console.log("I received a GET request");
    var id = req.params.id;
    console.log(id);
    db.questionsCollection.findOne({_id: mongojs.ObjectId(id)}, function (err, doc) {
        res.json(doc);
    });
});

http.listen(process.env.PORT || 3000);
console.log("Server running on port 3000");