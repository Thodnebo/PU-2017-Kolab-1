var express = require('express');
var app = express();
var mongojs = require('mongojs');
//'mongodb://heroku_2hcp9k8k:19uocjcgsn6ce4pp7j66fe1ras@ds119020.mlab.com:19020/heroku_2hcp9k8k'
//var db = mongojs('mongodb://heroku_2hcp9k8k:19uocjcgsn6ce4pp7j66fe1ras@ds119020.mlab.com:19020/heroku_2hcp9k8k', ['roomsQuestionsCollection', 'roomsCollection' 'counter']);
var db = mongojs('mongodb://heroku_2hcp9k8k:19uocjcgsn6ce4pp7j66fe1ras@ds119020.mlab.com:19020/heroku_2hcp9k8k', ['roomsQuestionsCollection', 'roomsCollection', 'userCollection', 'counter']);
var bodyParser = require('body-parser');
var path = require('path');
var userCount = 0;

app.use(express.static(__dirname));
app.use(bodyParser.json());

/* SOCKET IO */
var http = require('http').Server(app);
var io = require('socket.io')(http);


// socket functions
io.on('connection', function (socket) {
    console.log('User ' + socket.id + ' connected.' + userCount);
    socket.on('storeClient', function (inc) {
        userCount += inc;
        console.log(userCount + " count");
        db.counter.update({"counter": "userCount"}, {"$inc": {"hits": inc}});
    });
    socket.on('disconnect', function () {
        socket.emit('storeClient', -1);
    });

    // Hvilket formål har dette??
    /*socket.on('new user message', function (userId) {
        var rString = randomString(24, '0123456789abcdef');

        db.userCollection.insert({_id: mongojs.ObjectID(rString), user: userId}, function (err, o) {
            if (err) {
                console.warn(err.message);
            }
            else {
                console.log("userId message inserted into the db: " + userId);
            }
        });
    });*/

    socket.on('join room', function (roomName){
        socket.join(roomName);
    });


    socket.on('new room message', function (msg, userId) {
        var rString = randomString(24, '0123456789abcdef');
        console.log("trying to save room: " + msg + " user: " + userId);
        db.roomsCollection.insert({_id: mongojs.ObjectID(rString), room: msg, creator: userId}, function (err, o) {
            if (err) {
                console.warn(err.message);
            }
            else {
                console.log("room inserted into the db: " + msg + "by user: " + userId);
            }
        });
    });

    socket.on('room delete', function (index, id, userId) {

        if (userId != undefined && db.roomsCollecction.findOne({_Rid: mongojs.ObjectID(id)}, function (err, doc) {
                res.creator = userId;
            })) {
            console.log("Server received 'room delete' broadcast for id: " + id + "userId: " + userId);
            //deletes the selected room from the database
            db.roomsCollection.remove({_id: mongojs.ObjectId(id)});
            io.emit('rooms delete', index, id);
        }

    });

    // server receives a new message and sends it to the python script
    socket.on('question message', function (msg, roomName) {
        console.log('roomname: ' + roomName);
        var rString = randomString(24, '0123456789abcdef');
        io.emit('pp message', {_id: mongojs.ObjectID(rString),room: roomName,  text: msg, tag: ""});
    });

    socket.on('processed message', function (obj) {
        console.log('message: ' + obj.text);

        //creates random string with the function outside the socket function

        //inserting new message into mlab database
        db.roomsQuestionsCollection.insert({
            _id: mongojs.ObjectID(obj._id),
            room: String(obj.room),
            text: obj.text,
            tag: obj.tag
        }, function (err, o) {
            if (err) {
                console.warn(err.message);
            }
            else {
                console.log("question message inserted into the db: " + obj.text);
            }
        });
        // broadcasts question message to all listening sockets with the same object we insert into the database
        console.log("QM: This is the room");
        io.to(obj.room).emit('question message', {
            _id: mongojs.ObjectID(obj._id),
            room: String(obj.room),
            text: obj.text
        });
        // Old emit to all message
        //io.emit('question message', {_id: mongojs.ObjectID(msg._id), text: msg.text, tag: msg.tag});
    });
    //menu buttons
    socket.on('cantKeepUp', function (inc) {
        db.counter.update({"counter": "cantKeepUp"}, {"$inc": {"hits": inc}});
        io.emit('cantKeepUp', inc, userCount);
    });
    socket.on('decreaseVolume', function (inc) {
        db.counter.update({"counter": "decreaseVolume"}, {"$inc": {"hits": inc}});
        io.emit('decreaseVolume', inc, userCount);
    });
    socket.on('increaseVolume', function (inc) {
        db.counter.update({"counter": "increaseVolume"}, {"$inc": {"hits": inc}});
        io.emit('increaseVolume', inc, userCount);
    });
    socket.on('decreaseSpeed', function (inc) {
        db.counter.update({"counter": "decreaseSpeed"}, {"$inc": {"hits": inc}});
        console.log("decerease speed");
        io.emit('decreaseSpeed', inc, userCount);
    });
    socket.on('increaseSpeed', function (inc) {
        db.counter.update({"counter": "increaseSpeed"}, {"$inc": {"hits": inc}});
        io.emit('increaseSpeed', inc, userCount);
    });
    socket.on('resetVotes', function () {
        db.counter.update({}, {"$set": {"hits": 0}}, {multi: true});
        io.emit('resetVotes');
    });

    //servers response to emitted message to delete question from lecturer controller
    socket.on('question delete', function (index, obj) {

        console.log("Server received 'question delete' broadcast for id: " + obj._id);

        //TODO clean upp after merge
        db.roomsQuestionsCollection.remove({_id: mongojs.ObjectId(obj._id)});
        io.emit('question delete', index, obj);
    });

    //servers response to emitted message to delete question from lecturer controller
    socket.on('question delete grouped', function (rowIndex, index, obj) {

        console.log("Server received 'question delete' broadcast for id: " + obj._id);
        //deletes the selected question from the database
        db.questionsCollection.remove({_id: mongojs.ObjectId(obj._id)});
        io.emit('question delete grouped', rowIndex, index, obj);

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

app.get('/front', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


/* DATABASE METHODS */
app.get('/roomsQuestionsCollection', function (req, res) {
    console.log("RQ: I received a GET request");
    var roomName = cookieParse(req.headers.cookie);
    console.log("current room: ", roomName);
    db.roomsQuestionsCollection.find({room: roomName}, function (err, docs) {
        if (err) {
            console.warn(err.message);
        }
        else {
            console.log(docs);
            res.json(docs);
        }
    });
});

//Which one are we using
app.get('/roomsCollection', function (req, res) {
    console.log("R: I received a GET request");
    var roomName = cookieParse(req.headers.cookie);
    console.log("current room: ", roomName);
    db.roomsCollection.find(function (err, docs) {
        if (err) {
            console.warn(err.message);
        }
        else {
            //console.log(docs);
            res.json(docs);
        }

    })

});

/*app.delete('/roomsQuestionsCollection/:id', function (req, res) {
 console.log("Server received a DELETE request for ID: " + req.params.id);
 var id = req.params.id;
 console.log(typeof id);
 db.roomQuestionsCollection.remove({_id: mongojs.ObjectId(id)});
 });*/

app.get('/roomsQuestionsCollection/:id', function (req, res) {
    var roomName = cookieParse(req.headers.cookie);
    console.log("Q: I received a GET request", roomName);
    var id = req.params.id;

    console.log("Current room: ", roomName );  //Current room?
    db.roomsQuestionsCollection.findOne({_id: mongojs.ObjectId(id), room: String(roomName)}, function (err, doc) {
        res.json(doc);
    });
});

//Old
/*app.get('/roomsCollection/:id', function (req, res) {
    console.log("I received a GET request", req.headers.cookie);
    var id = req.params.id;
    db.roomsCollection.findOne({_Rid: mongojs.ObjectID(id)}, function (err, doc) {
        res.json(doc);
    });
});*/

app.get('/counters', function (req, res) {
    db.counter.find(function (err, doc) {
        res.json(doc);

    })
});

function cookieParse (cookie) {
    var tempVar = cookie.slice(20);
    return( tempVar.substring(0, tempVar.indexOf(';')));
}

var server = http.listen(process.env.PORT || 3000);
console.log("Server running on port 3000");

module.exports = server;

