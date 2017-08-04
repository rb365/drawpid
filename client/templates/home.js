const streamer = new Meteor.Streamer('draw');

sendMessage = function(message) {
  streamer.emit('line', message);
};

var canvas;
var context;
var lastMouse;
var oWidth;
var oHeight;
var lines;
var userId = new Date().getUTCMilliseconds() + "";

Template.home.events({
  'click button': function (event, template) {
    var id = event.currentTarget.id;
    console.log(id);
    if (id && id.startsWith("color_")) {
      setColor(id.split('_')[1]);
    } else if(id && id.startsWith("thi")) {
      setSize(id == "thin" ? 1 : (id == "thick" ? 3 : 6));
    } else if(id == "erase") {
      setColor("FFFFFF")
    }
  }
});

Template.home.onCreated(function () {
  var instance = this;

  instance.subscribe('lines', 0);

  /*instance.autorun(function () {

    console.log("rerun");
    var colorMap = {
      'g': "#449d44"
    };
    const cursor = Lines.find({});
    const handle = cursor.observeChanges({
      added(id, line) {
        //console.log(`new line`, line);
        if (line.id == userId) {
          return;
        }
        draw(parseFloat(line.frX), parseFloat(line.toX), parseFloat(line.frY), parseFloat(line.toY), colorMap[line.co] ? colorMap[line.co] : ("#" + line.co), parseFloat(line.wi), true);
      },
      changed: function(id, line) {
        //console.log("changed", line);
        if (line.id == userId) {
          return;
        }
        // draw(parseFloat(line.frX), parseFloat(line.toX), parseFloat(line.frY), parseFloat(line.toY), colorMap[line.co] ? colorMap[line.co] : ("#" + line.co), parseFloat(line.wi), true);
      },
      removed() {
        //console.log(`Removed line`);
      }
    });
  });*/

  var colorMap = {
    'g': "#449d44"
  };

  streamer.on('line', function(line) {
    draw(parseFloat(line.frX), parseFloat(line.toX), parseFloat(line.frY), parseFloat(line.toY), colorMap[line.co] ? colorMap[line.co] : ("#" + line.co), parseFloat(line.wi), true);
  });
});


Template.home.onRendered(function () {
  // get the canvas element and its context
  canvas = document.getElementById('sketch');
  context = canvas.getContext('2d');

// the aspect ratio is always based on 1140x400, height is calculated from width:
  canvas.width = $('#sketchContainer').width();
  canvas.height = (canvas.width/1440)*900;
  $('#sketchContainer').outerHeight(String(canvas.height)+"px", true);
// scale function needs to know the width/height pre-resizing:
  oWidth = canvas.width;
  oHeight = canvas.height;
  lines = [];

  lastMouse = {
    x: 0,
    y: 0
  };

// brush settings
  context.lineWidth = 2;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.strokeStyle = '#000';

// attach the mousedown, mouseout, mousemove, mouseup event listeners.
  canvas.addEventListener('mousedown', function (e) {
    lastMouse = {
      x: e.pageX - this.offsetLeft,
      y: e.pageY - this.offsetTop
    };
    canvas.addEventListener('mousemove', move, false);
  }, false);

  canvas.addEventListener('mouseout', function () {
    canvas.removeEventListener('mousemove', move, false);
  }, false);

  canvas.addEventListener('mouseup', function () {
    canvas.removeEventListener('mousemove', move, false);
  }, false);


  // Set up touch events for mobile, etc
  canvas.addEventListener("touchstart", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, false);
  canvas.addEventListener("touchend", function (e) {
    var mouseEvent = new MouseEvent("mouseup", {});
    canvas.dispatchEvent(mouseEvent);
  }, false);
  canvas.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, false);

  // changeMouse creates a temporary invisible canvas that shows the cursor, which is then set as the cursor through css:
  function changeMouse() {
    // Makes sure the cursorSize is scaled:
    var cursorSize = context.lineWidth*(canvas.width/1440);
    if (cursorSize < 10){
      cursorSize = 10;
    }
    var cursorColor = context.strokeStyle;
    var cursorGenerator = document.createElement('canvas');
    cursorGenerator.width = cursorSize;
    cursorGenerator.height = cursorSize;
    var ctx = cursorGenerator.getContext('2d');

    var centerX = cursorGenerator.width/2;
    var centerY = cursorGenerator.height/2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, (cursorSize/2)-4, 0, 2 * Math.PI, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = cursorColor;
    ctx.stroke();
    $('#sketch').css('cursor', 'url(' + cursorGenerator.toDataURL('image/png') + ') ' + cursorSize/2 + ' ' + cursorSize/2 + ',crosshair');
  }
  // Init mouse
  changeMouse();

  // Redraws the lines whenever the canvas is resized:
  $(window).resize(function() {
    if ($('#sketchContainer').width() != oWidth) {
      canvas.width = $('#sketchContainer').width();
      canvas.height = (canvas.width/1440)*900;
      $('#sketchContainer').outerHeight(String(canvas.height)+"px", true);
      var ratio = canvas.width/oWidth;
      oWidth = canvas.width;
      oHeight = canvas.height;
      reDraw(lines);
      changeMouse();
      $('#draggable').css({
        position: 'absolute',
        top: String((canvas.height - 350) / 2) + "px",
        left: "10px"
      });
    }
  });

  $( '#draggable' ).draggable();

  $('#draggable').css({
    position: 'absolute',
    top: String((canvas.height - 350) / 2) + "px",
    left: "10px"
  });
});

// Sets the brush size:
function setSize(size) {
  context.lineWidth = size;
}

// Sets the brush color:
function setColor(color) {
  context.globalCompositeOperation = 'source-over';
  context.strokeStyle = "#" + color;
  console.log(color);
}

// Redraws the lines from the lines-array:
function reDraw(lines){
  lines.forEach(line => {
    draw(line[0], line[1], line[2], line[3], line[4], line[5], false);
  });
}

function draw(startX, endX, startY, endY, color, size, save) {
  //console.log("draw:", parseFloat(startX), parseFloat(startY), parseFloat(endX), parseFloat(endY), color);
  context.save();
  context.lineJoin = 'round';
  context.lineCap = 'round';
  // Since the coordinates have been translated to an 1140x400 canvas, the context needs to be scaled before it can be drawn on:
  context.scale(canvas.width/1440,canvas.height/900);
  context.strokeStyle = color;
  context.globalCompositeOperation = "source-over";
  context.lineWidth = size;
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.closePath();
  context.stroke();
  context.restore();
  if (save) {
    // Won't save if draw() is called from reDraw().
    lines.push([startX, endX, startY, endY, color, size]);
  }
}

// Called whenever the mousemove event is fired, calls the draw function:
function move(e) {
  var mouse = {
    x: e.pageX - this.offsetLeft,
    y: e.pageY - this.offsetTop
  };
  // Translates the coordinates from the local canvas size to 1140x400:
  sendMouse = {
    x: (1440/canvas.width)*mouse.x,
    y: (900/canvas.height)*mouse.y
  };
  sendLastMouse = {
    x: (1440/canvas.width)*lastMouse.x,
    y: (900/canvas.height)*lastMouse.y
  };
  draw(sendLastMouse.x, sendMouse.x, sendLastMouse.y, sendMouse.y, context.strokeStyle, context.lineWidth, true);

  /* Old way of doing it not as efficient as pure pub/sub
    Meteor.call("addLine", {
      id: userId,
      frX: sendLastMouse.x,
      frY: sendLastMouse.y,
      toX: sendMouse.x,
      toY: sendMouse.y,
      co: context.strokeStyle.substr(1),
      wi: context.lineWidth
    });
  */

  sendMessage({
    id: userId,
    frX: sendLastMouse.x,
    frY: sendLastMouse.y,
    toX: sendMouse.x,
    toY: sendMouse.y,
    co: context.strokeStyle.substr(1),
    wi: context.lineWidth
  });

  lastMouse = mouse;
}
