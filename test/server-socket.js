var chai = require('chai');
var should = chai.should();
var io = require('socket.io-client');
var assert = require('assert');


describe("server socket", function () {

    var socket;
    var server;
    var options ={
        transports: ['websocket'],
        'force new connection': true
    };

    beforeEach(function (done) {
        console.log('BeforeEach: Starting server');
        server = require('../server');
        socket = io.connect('http://localhost:3000', {
            'reconnection delay' : 0
            , 'reopen delay' : 0
            , 'force new connection' : true
        });
        socket.on('connect', function() {
            console.log('worked...');
            done();
        });
        socket.on('disconnect', function() {
            console.log('disconnected...');
        });
    });

    afterEach(function(done) {
        // Cleanup
        if(socket.connected) {
            console.log('disconnecting...');
            socket.disconnect();
        } else {
            // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
            console.log('no connection to break...');
        }
        done();
    });

    describe('question message id length', function() {

      it("checks question message id length", function (done) {
        socket.once("question message", function (message) {
          //console.log("message._id.length: " + message._id.length);
          message._id.length.should.equal(24);
          done();
        });
        
        socket.emit("question message");
      });

    });

    describe('cantKeepUp test', function() {

      it("checks cantKeepUp message", function (done) {
        socket.once("cantKeepUp", function (message) {
          //console.log("typeof message: " + typeof message);
          var message_type = typeof message;
          message_type.should.equal("number");
          done();
        });
        
        socket.emit("cantKeepUp");
      });

    });

    describe('decreaseVolume test', function() {

      it("checks decreaseVolume message", function (done) {
        socket.once("decreaseVolume", function (message) {
          //console.log("typeof message: " + typeof message);
          var message_type = typeof message;
          message_type.should.equal("number");
          done();
        });
        
        socket.emit("decreaseVolume");
      });

    });
    
});