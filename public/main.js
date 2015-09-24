$(function() {
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];



  // Initialize varibles
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $gamebox = $('.gameFrame'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $canvasPage = $('.canvas.page'); // canvas page

  // Prompt for setting a username
  var username;
  var connected = false;
  var $currentInput = $usernameInput.focus();

  // Game variables
  var canvas, ctx; // canvas for drawing on
  const frameWidth = 800;
  const frameHeight = 600;
  const fps = 17;
  var lastTime = 0;
  var users = {};
  var userWidth = 20;

  // Socket
  var socket = io();

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $canvasPage.show();
      $loginPage.off('click');
      canvas = document.getElementById("game");
      canvas.width = frameWidth;
      canvas.height = frameHeight;

      canvas.tabIndex = 1000; // need to do for keylistener for some reason?
      canvas.addEventListener("keydown", keyPressed.bind(this), false);
      canvas.addEventListener("keyup", keyReleased.bind(this), false);

      canvas.style.outline = "none";

      ctx = canvas.getContext("2d");

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (!username)
        setUsername();
    }
  });

  function keyPressed(e){
    var code = e.keyCode ? e.keyCode : e.which; // ASCII key code

    if(connected) {
      // send input to server if online
      // Send the packet of information to the server.
      // The input packets are labelled with an 'i' in front.
      var keyData = {
        action: 'press',
        key: code
      };
      socket.emit('user moved', keyData);
    }
  }

  function keyReleased(e) {
    var code = e.keyCode ? e.keyCode : e.which; // ASCII key code

    if(connected) {
      var keyData = {
        action: 'release',
        key: code
      };
      socket.emit('user moved', keyData);
    }
  }

  function startGameLoop() {
    setInterval(drawGame, fps);
  }

  function drawGame() {
    ctx.clearRect(0, 0, frameWidth, frameHeight);
    for (user in users) {
      var userToDraw = users[user];
      var x = userToDraw.pos.x;
      var y = userToDraw.pos.y;
      ctx.save();
      ctx.fillStyle = getUsernameColor(user);
      ctx.fillRect(x - userWidth/2, y - userWidth/2, 
        userWidth, userWidth);
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.font = "11px Oswald";
      ctx.fillText(userToDraw.name, x - userWidth/2, y - userWidth/1.5);
      ctx.restore();
    }
  }

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    users = data;
    startGameLoop();
  });

  socket.on('users update', function(data) {
    users = data;
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    users = data;
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    users = data;
  });
});