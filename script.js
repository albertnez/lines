var bgMusic = document.createElement('audio');
bgMusic.setAttribute('src', 'final.ogg');
bgMusic.loop = true;
var muted = false;

var canvas = document.getElementById("canvas");
canvas.width = $("#canvas").width();
canvas.height = $("#canvas").height();
var ctx = canvas.getContext("2d");
ctx.font = "bold 12px sans-serif";

var H = 150; //ground height
ctx.lineCap = "round";
ctx.strokeStyle = "white";
var gaps = [];
var spacebar = false;
var actualColor = "white";
var colors = [ "pink" ,"white", "yellow", "green", "blue", "purple", "orange", "red"];
var colorIndex = 0;
var keys = {};
var gameOver = false;
var dist = 400;
var extra = 0;
var maxJumpTime = 0.3;

var timer;
var delta;
var timePassed;
var initTime;
var totalTime;
var bestTime = 0;

function drawLine(sx, sy, dx, dy, w, c) {
  if (c) ctx.strokeStyle = c;
  else ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.lineWidth = w;
  ctx.moveTo(sx, sy);
  ctx.lineTo(dx, dy);
  ctx.stroke();
}

function Player() {
  this.a = 45;
  this.x = 50;
  this.y = H;
  this.lifes = 1;
  this.c = "white";
  this.r = 10;
  this.w = 2;
  this.jumping = false;
  this.power = 200; // jump power;
  this.g = 1000;
  this.vy = 0;
  this.jumpTime = 0;
  this.dead = false;
  this.draw = function () {
    ctx.save();
    ctx.translate(this.x- this.r/2, this.y-this.r/2-this.w);
    ctx.rotate(this.a);
    ctx.strokeStyle = this.c;
    ctx.beginPath();
    ctx.lineWidth = this.w;
    ctx.rect(-this.r/2, -this.r/2, this.r, this.r);
    ctx.stroke();
    ctx.restore();

  }
  this.jump = function() {
    if (!this.jumping && !this.dead) {
      this.jumping = true;
      this.vy = -this.power;
    }
  }
  this.update = function(dt) {

    if (this.y + this.vy*dt >= H && !this.dead) {
      for (var i = 0; i < gaps.length; ++i) {
        if (gaps[i].x < this.x-this.w && gaps[i].x+gaps[i].w > this.x + this.r) {
          if (!this.jumping) this.jumping = true;
          
          this.dead = true;
        }
      }
    } 
    if (this.jumping) {
      this.y += this.vy*dt;
      this.jumpTime += dt;
      if (!keys[32]) this.jumpTime = maxJumpTime;
      if (this.jumpTime >= maxJumpTime) this.vy += this.g*dt;
      this.a = (this.a + Math.PI/180*dt*this.power);
      if (this.y >= H && !this.dead) {
        //restore the position, jumping and velocity values!
        this.vy = 0;
        this.jumping = false;
        this.y = H;
      }
    }
    if (!this.jumping) {
      if (keys[32]) {
        this.jumping = true;
        this.jumpTime = 0;
        this.vy = -this.power;
      }
      else {
        this.a = 0;
      }
    }
  }
};

var player = new Player();

function Gap(w, s, c) {
  if (w) this.w = w;
  else this.w = 20;
  if (s) this.s = s;
  else this.s = 200 ;
  if (c) this.c = c;
  else this.c = "black";
  this.w = w;
  this.x = canvas.width;
  this.y = H;
}
Gap.prototype.draw = function() { drawLine(this.x, this.y, this.x+this.w, this.y, 2, this.c); }
Gap.prototype.update = function(dt) { this.x -= this.s*dt; }



function Game() {
  this.canvas = document.getElementById("canvas");
  this.ctx = canvas.getContext("2d");
  this.player = new Player();
}

function render(){
  //ctx.clearRect ( player.x-player.w , 0, player.x + player.r, canvas.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect( player.x - 2*player.r, 0, player.x + 2*player.r, canvas.height);

  drawLine(0, H, canvas.width, H, 2, actualColor);
  for (var i = 0; i < gaps.length; ++i){
    gaps[i].draw();
  }
  player.draw();

  ctx.clearRect( canvas.width - 100, 0, 100, 20);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.fillText("Score: " + Math.ceil(totalTime/1000),  canvas.width - 100, 10);
  ctx.fillText("Best: " + bestTime, canvas.width - 100, 20);
  if (player.dead) ctx.fillText ("Game Over", 27, 100);
  
}
function restart() {
  clearInterval(timer);
  gaps = [];
  player = new Player;
  initTime = new Date().getTime();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  actualColor = "white";
  bgMusic.pause();
  bgMusic.currentTime = 0;
  colorIndex = 1;
  extra = 0;
  keys = {};
  init();
}

function update(dt){
  if (player.dead && player.y > canvas.height && keys[32]) {
    restart();
  }

  if (Math.ceil(totalTime/1000) > bestTime) bestTime = Math.ceil(totalTime/1000);
  player.update(dt);
  for (var i = gaps.length-1; i >= 0; --i) {
    if (gaps[i].x + gaps[i].w <= 0) gaps.splice(i, 1);
    else gaps[i].update(dt);
  }


  if (totalTime/1000 > 8*colorIndex*(1/180)*60) { 
    colorIndex++;
    actualColor = colors[colorIndex%colors.length];
  }

  //generate gaps

  var l = gaps.length;
  if (l == 0 || (l > 0 && gaps[l-1].x + gaps[l-1].w < canvas.width - dist))  {
    gaps.push(new Gap(Math.random()*50));
    dist = Math.max( 10, 100 + Math.random()*350 - 10*colorIndex);
  }
  
  if (colorIndex > extra) {
    gaps.push(new Gap(Math.random()*20 + 40, 100 + Math.random()*100));
    extra++;
  }

}



function loop() {
    delta = new Date().getTime() - timePassed;
    delta/=1000;
    timePassed = new Date().getTime();
    if (!player.dead)totalTime = new Date().getTime() - initTime;

    update(delta);
    render();

}
function init() {
  initTime = new Date().getTime();
  if (!muted) bgMusic.play();
  timer = setInterval("loop();", 1000/60);
}


document.onkeydown=function(e) {
  keys[e.which] = true;
};
document.onkeyup=function(e) {
  keys[e.which] = false;
};
/*
$(document.body).on('click', function(e) {
  if (player.dead && player.y > canvas.height) restart();
  else player.jump();
});
*/
$(document.body).on('touchstart mousedown', function(e) {
  e.preventDefault();
  if (player.dead && player.y > canvas.height) restart();
  else player.jump();
});

$("#mute").click(function() {
  if (bgMusic.currentTime > 0) {
    bgMusic.currentTime = 0;
    bgMusic.pause();
    muted = true;
  }
  else {
    bgMusic.play();
    muted = false;
  }
});

bgMusic.onload = init();

