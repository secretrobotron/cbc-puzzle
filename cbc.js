//  Thanks to Paul Irish for this code
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element){
              window.setTimeout(callback, 1000 / 60);
            };
})();

var Cbc = function( target, timeline, itemBox ) {

  var audioElement = this.audioElement = document.getElementById( target ),
      timelineElement = this.timelineElement = document.getElementById( timeline ),
      itemBoxElement = this.itemBoxlLement= document.getElementById( itemBox ),
      events = this.events = [];

  timelineElement.addEventListener( "drop", function( event ) {

   event.stopPropagation && event.stopPropagation();
   var newItem = document.getElementById( event.dataTransfer.getData( "Text" ) );
   newItem.style.left = "20px";
   this.appendChild( newItem );
  }, false );

  itemBoxElement.addEventListener( "dragover", function( event ) {

    event.preventDefault && event.preventDefault();
    event.dataTransfer.dropeffect = "copy";
  }, false );

  this.counter = 0;

  this.registerEvent = function( options ) {

    var animloop = function() {

      if ( options.pauseMe && audioElement.currentTime >= options.end ) {
        options.pauseMe = false;
        audioElement.pause();
      } else if ( options.pauseMe ) {
        requestAnimFrame( animloop );
      }
    };

    var target = document.getElementById( options.target ),
        eventDiv = document.createElement( "div" ),
        innerDiv = document.createElement( "span" );

    options.eventDiv = eventDiv;

    this.events.push( options );

    eventDiv.id = "cbc-event-" + this.counter++;
    eventDiv.innerHTML = options.text;

    innerDiv.style.width = "65.5px";
    innerDiv.style.height = "44px";


    innerDiv.addEventListener( "dragover", function( event ) {

      event.preventDefault && event.preventDefault();
      event.dataTransfer.dropeffect = "copy";
    }, false );


  innerDiv.addEventListener( "drop", function( event ) {

   event.stopPropagation && event.stopPropagation();

   var newItem = document.getElementById( event.dataTransfer.getData( "Text" ) );
   newItem.style.left = "20px";
   this.appendChild( newItem );
  }, false );

    itemBoxElement.appendChild( innerDiv ); 

    eventDiv.addEventListener( "click", function( event ) {

      audioElement.currentTime = options.start;

      for ( var i = 0; i < events.length; i++ ) {
        events[ i ].pauseMe = false;
      }

      options.pauseMe = true;
      animloop();
      audioElement.play();
    }, false );

    eventDiv.draggable = true;

    eventDiv.addEventListener( "dragstart", function( event ) {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData( "Text", this.id );
    }, false );

    target.appendChild( eventDiv );

  }
}
