(function() {
//  Thanks to Paul Irish for this code
var requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
            function(/* function */ callback, /* DOMElement */ element){
              window.setTimeout(callback, 1000 / 60);
            };
})();

var removeClass = function( element, name ) {
  var classes = element.className.split( " " ),
      idx = classes.indexOf( name );
  if ( idx ) {
    classes.splice( idx, 1 );
  }
  element.className = classes.join( " " );
};

var addClass = function( element, name ) {

  var classes = element.className.split( " " ),
      idx = classes.indexOf( name );
  if ( idx === -1 ) {
    element.className += " " + name;
  }
};

var Cbc = window.Cbc = function( target, itemBox, timeline ) {

  var audioElement = this.audioElement = document.getElementById( target ),
      timelineElement = this.timelineElement = document.getElementById( timeline ),
      itemBoxElement = this.itemBoxlLement= document.getElementById( itemBox ),
      playBtn = document.getElementById( "play" ),
      events = this.events = [],
      playingEvents = this.playingEvents = {},
      playingIndex = 0,
      stopSpinnin = false;

  var ridinSpinnas = function( options, cb ) {

    if ( audioElement.currentTime >= options.end ) {
      cb && cb();
    } else if ( !stopSpinnin ){
      requestAnimFrame( function(){
        ridinSpinnas( options, cb );
      });
    }
  };

  var getNextChild = function( children ) {
  
    var itemsLength = children.length;
    var options;
    if ( children( playingIndex ).children.length > 0 ) {
      options = playingEvents[ children.item( playingIndex ).children.item( 0 ).id ];
      audioElement.currentTime = options.start;
      audioElement.play();
    }
    
    if ( options ) {
      requestAnimFrame( function() {
        ridinSpinnas( options, function() {
          playingIndex++;
          if ( playingIndex >= itemsLength ) {
            playingIndex = 0;
            audioElement.pause();
          } else { 
            getNextChild( children );
          }
        });
      });
    } else {
      playingIndex++;
      if ( playingIndex === itemsLength ) {
        audioElement.pause();
        playingIndex = 0;
      } else { 
        getNextChild( children );
      }
    }
  };

  playBtn.addEventListener( "click", function( event ) {
    stopSpinnin = false;
    for ( var i = 0; i < events.length; i++ ) {
      events[ i ].stop();
    }
    playingIndex = 0;
    var children = timelineElement.children; 
    getNextChild( children );
  }, false );

  itemBoxElement.addEventListener( "drop", function( event ) {

   event.stopPropagation && event.stopPropagation();
   var newItem = document.getElementById( event.dataTransfer.getData( "Text" ) );
   this.appendChild( newItem );
  }, false );

  itemBoxElement.addEventListener( "dragover", function( event ) {

    event.preventDefault && event.preventDefault();
    event.dataTransfer.dropeffect = "copy";
  }, false );

  this.counter = 0;

  this.registerEvent = function( options ) {

    options.stop = function() {
      options.pauseMe = false;
      audioElement.pause();
    };
  
    var animloop = function() {
      
      if ( options.pauseMe && audioElement.currentTime >= options.end ) {
        options.stop();
      } else if ( options.pauseMe ) {
        requestAnimFrame( animloop );
      }
    };

    var target = itemBoxElement,
        eventDiv = document.createElement( "div" ),
        innerDiv = document.createElement( "div" );

    options.eventDiv = eventDiv;

    this.events.push( options );

    eventDiv.id = "cbc-event-" + this.counter++;
    eventDiv.innerHTML = options.text;

    playingEvents[ eventDiv.id ] = options;

    innerDiv.style.float = "left";
    addClass( innerDiv, "cbc-puzzle-event" );
    addClass( innerDiv, "cbc-puzzle-unhighlight" );


    innerDiv.addEventListener( "dragover", function( event ) {

      addClass( this, "cbc-puzzle-highlight" ); 
      event.preventDefault && event.preventDefault();
      event.dataTransfer.dropeffect = "copy";
    }, false );

    innerDiv.addEventListener( "dragleave", function( event ) {
  
      removeClass( this, "cbc-puzzle-highlight" );
    }, false);


    innerDiv.addEventListener( "drop", function( event ) {

      removeClass( this, "cbc-puzzle-highlight" );
      event.stopPropagation && event.stopPropagation();
      if ( this.innerHTML === "" ) {

        var newItem = document.getElementById( event.dataTransfer.getData( "Text" ) );
        this.style.width = newItem.style.width;
        this.appendChild( newItem );
      }
    }, false );

    timelineElement.appendChild( innerDiv ); 

    eventDiv.addEventListener( "click", function( event ) {

      audioElement.currentTime = options.start;

      for ( var i = 0; i < events.length; i++ ) {
        events[ i ].pauseMe = false;
      }

      stopSpinnin = true;
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
})();
