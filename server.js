/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require("fs");
eval(fs.readFileSync('./lib/box2d.js') + '');


//eval(fs.readFileSync('./lib/embox2d-noclosure.min.js') + '');
//eval(fs.readFileSync("./lib/embox2d-helpers.js") + '');


'use strict';
// [START appengine_websockets_app]
const express = require('express');
const app = express();



const server = require('http').Server(app);
const io = require('socket.io')(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname));





if (module === require.main) {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
        //console.log(`App listening on port ${PORT}`);
        //console.log('Press Ctrl+C to quit.');
    });
}

const maxPlayer = 2;

var roomCollection = new function () {
    this.roomCount = 0;
    this.roomList = [];
}
function roomInfo() {

    this.id = 0;
    this.name = "";
    this.totalPlayer = 0;
    this.players = [];
}
var totalUser = 0;
var lobby = "lobby";

var lobbyRoom = io.sockets.in(lobby);
lobbyRoom.on('join', function (socket) {
    log("lobbyLog: ");
});
lobbyRoom.on('leave', function (socket) {
    log("lobbyLogLeave: ");
});
var box2d;
box2d = require('./box2dserver.js');


io.on('connection', (socket) => {
    var addedUser = false;
    var tryJoin = 0;

    function GetByteArrayFromStringArray(parameter) {
        for (var key in parameter) { // loop through properties

            var mainbytesArray = [];
            for (var i = 0; i < parameter[key].length; i++)
                mainbytesArray.push(parameter[key][i]);
        }
        //var mainbytesArray = JSON.stringify(parameter);
        return mainbytesArray;

    }
    socket.on('requestCanvas', function (data) {  
              
        box2d.init(socket,60, false, data.width, data.height, 30);        
        var p = {};
        p.id = 0;
        p.name = "player";
        box2d.createPlayer(p);
        setTimeout(function () {
            
        }, 6000);
        
    });

    socket.on('chat message', (msg) => {
        if (!addedUser) return;
        if (socket.room == undefined) {
            socket.emit("chat message", { mess: "you: " + msg });
            socket.to(lobby).emit("chat message", { mess: socket.username + ": " + msg });
        }
        else {
            socket.emit("chat message", { mess: "you: " + msg });
            socket.to(socket.room.name).emit("chat message", { mess: socket.username + ": " + msg });
        }
    });   
    
    socket.on('add user', function (data) {
        if (addedUser) return;
        var username;
        totalUser++;
        if (data.username != null) {
            username = data.username;
        }
        socket.username = username;
        addedUser = true;
        socket.join(lobby);
        socket.emit('logined', { numUser: totalUser });
        socket.to(lobby).emit('user joined', { username: socket.username, numUser: totalUser });
        console.log(" user " + username + " connected");

    });

    socket.on('joinAgame', function () {
        var username = socket.username;
        log("username: " + username + " want to join a game");
        if (socket.room != undefined) {
            socket.emit("joinedRoom", { data: "you have connected to " + room.name, id: socket.inRoomId });
            return;
        }
        if (!addedUser) return;

        var room;

        var avaiableRoom = searchForAvaiableRoom();

        if (avaiableRoom.length == 0) {
            room = createRoom();
        }
        else {
            var randomValue = Math.floor(Math.random() * avaiableRoom.length);
            room = avaiableRoom[randomValue];
        }


        room.totalPlayer++;

        for (var i = 0; i < maxPlayer; i++) {
            if (room.players[i] == undefined) {
                room.players[i] = socket;
                socket.inRoomId = i;
                break;
            }
        }
        socket.room = room;

        socket.leave(lobby);
        io.sockets.in(lobby).emit("leave");
        socket.join(room.name);
        socket.emit("joinedRoom", { roomName: room.name, id: socket.inRoomId });
        socket.broadcast.to(room.name).emit("userJoinedRoom", { username: username });
        checkRoomFull();
        logRoomList();
    });

    socket.on("spawn", function (data) {
        console.log("user " + socket.username + " request spawn");

    });

    socket.on("updateInRoom", function (data) {
        socket.emit("RoomUpdate", { username: data.username, id: socket.inRoomId, scale: socket.scale, position: socket.position });
        socket.broadcast.to(socket.room.name).emit("RoomUpdate", { username: data.username, id: socket.inRoomId, scale: socket.scale, position: socket.position });
        //socket.emit("RoomUpdate",{username:data.username,id:socket.inRoomId,position:data.position});
    });
    socket.on("updatePosition", function (data) {
        console.log("user " + socket.username + " update force " + JSON.stringify(data.force));
        socket.position = data.position;
        socket.scale = data.scale;
        socket.force = data.force;
        var data = {};
        data.username = socket.username;
        data.id = socket.inRoomId;
        data.position = socket.position;
        data.scale = socket.scale;
        data.force = socket.force;
        //{username:socket.username,id:socket.inRoomId,position:socket.position,scale:socket.scale,force:socket.force}
        socket.broadcast.to(socket.room.name).emit("broadcastPosition", data);
        socket.emit("broadcastPosition", data);

    });
    socket.on("disconnect", function () {
        log("user " + socket.username + " disconnected");
        leaveRoom(socket);
    });
    function checkRoomFull() {
        var room = socket.room;
        if (room.totalPlayer == maxPlayer) {
            socket.emit("roomFull");
            socket.broadcast.to(room.name).emit("roomFull");

            //            initBox2d();
        }
    }

    function searchForAvaiableRoom() {
        var aRooms = [];
        for (var i = 0; i < roomCollection.roomCount; i++) {
            if (roomCollection.roomList[i].totalPlayer < maxPlayer) {
                aRooms.push(roomCollection.roomList[i]);
            }
        }
        return aRooms;
    }
    function createRoom() {
        log("userName: " + socket.username + " created a game");
        var rInfo = new roomInfo();
        rInfo.id = roomCollection.roomCount;
        rInfo.totalPlayer = 0;
        rInfo.name = "room " + rInfo.id;
        rInfo.players = [];

        roomCollection.roomList.push(rInfo);
        roomCollection.roomCount++;

        return rInfo;
    };
    function leaveRoom(socket) {

        if (socket.room != null && socket.room != undefined) {
            var room = socket.room;
            socket.broadcast.to(room.name).emit("leftRoom", { username: socket.username, id: socket.inRoomId });
            socket.leave(room.name);
            room.totalPlayer--;
            delete room.players[socket.inRoomId];
            socket.room = undefined;

        }
    }

    function logRoomList() {
        log("totalRoom: " + roomCollection.roomCount);
        log("-----------------------------------------------ROOM INFO--------------------------------------");
        for (var i = 0; i < roomCollection.roomList.length; i++) {
            var rInfo = roomCollection.roomList[i];
            log("****************ROOM " + rInfo.id + "********************");
            log("RoomName: " + rInfo.name);
            log("totalPlayer: " + rInfo.totalPlayer);
            for (var j = 0; j < rInfo.totalPlayer; j++) {
                log(" ");
                log("Player " + j + " name: " + rInfo.players[j].username);
            }
            log("");
        }
        log("-------------------------------------------ROOM INFO------------------------------------------");
    }
    function log(mess) {
        console.log(mess);
    }
});


// [END appengine_websockets_app]