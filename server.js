// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;


server.listen(port, function () {
  console.log('Go to localhost:3000 in your web browser', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// users which are currently connected to the chat
var users = {};
var numUsers = 0;

const fps = 17;
var lastTime = Date.now();

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    users[username] = {
      name: username,
      pos: {x: 400, y: 300, xDir: 0, yDir: 0}
    };
    ++numUsers;
    addedUser = true;
    socket.emit('login', users);
    io.emit('user joined', users);
  });

  socket.on('user moved', function(keyData) {
    updateUser(socket.username, keyData);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global users list
    if (addedUser) {
      delete users[socket.username];
      --numUsers;
    }
  });
});

setInterval(gameLoop, fps);

function gameLoop() {
  var currentTime = Date.now();
  var deltaTime = (currentTime - lastTime)/1000;
  for (name in users) {
    users[name].pos.x += users[name].pos.xDir*deltaTime;
    users[name].pos.y += users[name].pos.yDir*deltaTime;
  }

  // send users update to all sockets
  io.emit('users update', users);

  lastTime = currentTime;
}

var updateUser = function(username, keyData) {
  user = users[username];
  var moveSpeed = 100;
  if (keyData.action === 'press') {
    switch(keyData.key) {
      case 87: case 38: // W/up
        user.pos.yDir = -moveSpeed;
        break;
      case 65: case 37: // A/left
        user.pos.xDir = -moveSpeed;
        break;
      case 83: case 40: // S/down
        user.pos.yDir = moveSpeed;
        break;
      case 68: case 39: // D/right
        user.pos.xDir = moveSpeed;
        break;
    }
  }
  else if (keyData.action === 'release') {
    switch(keyData.key) {
      case 87: case 38: // W/up
        user.pos.yDir = 0;
        break;
      case 65: case 37: // A/left
        user.pos.xDir = 0;
        break;
      case 83: case 40: // S/down
        user.pos.yDir = 0;
        break;
      case 68: case 39: // D/right
        user.pos.xDir = 0;
        break;
    }
  }
  users[username] = user;
}