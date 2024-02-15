var isSign = false;
var leftMButtonDown = false;

function saveSignature() {
  if(isSign) {
	var imgData = document.getElementById('canvas').toDataURL();
	document.getElementById('signature').setAttribute('src', imgData);
  } else {
	alert('Please sign');
  }
}

function initialiseSignature() {
  isSign = false;
  leftMButtonDown = false;
  
  var sizedWindowWidth = window.innerWidth;
  
  if (sizedWindowWidth > 700) { // make canvas 
	sizedWindowWidth = window.innerWidth / 2;
  } else if (sizedWindowWidth > 400) {
	sizedWindowWidth = sizedWindowWidth - 100;
  } else {
	sizedWindowWidth = sizedWindowWidth - 50;
  }
  
  var canvas = document.getElementById('canvas');
  canvas.width = sizedWindowWidth;
  canvas.height = 200;
  
  var canvasContext = canvas.getContext('2d');
  
  if (canvasContext) {
	canvasContext.canvas.width  = sizedWindowWidth;
	canvasContext.canvas.height = 200;
	
	canvasContext.fillStyle = "#f8f8f8";
	canvasContext.fillRect(0, 0, sizedWindowWidth, 200);
	
	canvasContext.moveTo(50,150);
	canvasContext.lineTo(sizedWindowWidth - 50, 150);
	canvasContext.stroke();
  }
  
  canvas.onmousedown = function(e) {
	if (e.which === 1) {
	  leftMButtonDown = true;
	  
	  canvasContext.fillStyle = "#000";
	  
	  var x = e.pageX - e.target.offsetLeft;
	  var y = e.pageY - e.target.offsetTop;
	  
	  canvasContext.moveTo(x, y);
	}
	
	e.preventDefault();
	return false;
  };
  
  canvas.onmouseup = function(e) {
	if(leftMButtonDown && e.which === 1) {
	  leftMButtonDown = false;
	  isSign = true;
	}
	
	e.preventDefault();
	return false;
  };
  
  
  canvas.onmousemove = function(e) { // draw a line from the last point to this one
	if(leftMButtonDown == true) {
	  canvasContext.fillStyle = "#000";
	  
	  var x = e.pageX - e.target.offsetLeft;
	  var y = e.pageY - e.target.offsetTop;
	  
	  canvasContext.lineTo(x, y);
	  canvasContext.stroke();
	}
	
	e.preventDefault();
	return false;
  };
  
  canvas.ontouchstart = function(e) {
	leftMButtonDown = true;
	
	canvasContext.fillStyle = "#000";
	
	// var t = e.originalEvent.touches[0];
	var t = e.touches[0];
	var x = t.pageX - e.target.offsetLeft;
	var y = t.pageY - e.target.offsetTop;
	
	canvasContext.moveTo(x, y);
	
	e.preventDefault();
	return false;
  };
  
  canvas.ontouchmove = function(e) {
	canvasContext.fillStyle = "#000";
	
	// var t = e.originalEvent.touches[0];
	var t = e.touches[0];
	var x = t.pageX - e.target.offsetLeft;
	var y = t.pageY - e.target.offsetTop;
	
	canvasContext.lineTo(x, y);
	canvasContext.stroke();
	
	e.preventDefault();
	return false;
  };
  
  canvas.ontouchend = function(e) {
	if (leftMButtonDown) {
	  leftMButtonDown = false;
	  isSign = true;
	}
  };
}