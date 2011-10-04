(function() {
//  Thanks to Paul Irish for this code
var requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout( callback, 1000 / 60);
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
    element.className += name + " ";
  }
};

var winner = function() {
  console.log( "we have won" );
}

var Cbc = window.Cbc = function( target, itemBox, timeline ) {

  var audioElement = this.audioElement = document.getElementById( target ),
      timelineElement = this.timelineElement = document.getElementById( timeline ),
      itemBoxElement = this.itemBoxlLement= document.getElementById( itemBox ),
      playBtn = document.getElementById( "play" ),
      events = this.events = [],
      sortedEvents = [],
      playingEvents = this.playingEvents = {},
      playingIndex = 0,
      stopSpinnin = false,
      lastEnd,
      self = this;

  this.loadFromJSON = function( blob ) {

    if ( !blob ) {
      return;
    }

    for ( var i = 0, len = blob.length; i < len; i++ ) {
      var track = blob[ i ];
      self.registerEvent( blob[ i ] );
    }

  };

  var ridinSpinnas = function( options, cb ) {

    if ( audioElement.currentTime >= options.end || audioElement.currentTime === audioElement.duration ) {
      cb && cb();
    } else if ( !stopSpinnin ) {
      requestAnimFrame( function(){
        ridinSpinnas( options, cb );
      });
    }
  };

  var getNextChild = function( children ) {
  
    var increment = function() {
      playingIndex++;
      if ( playingIndex  >= itemsLength ) { 
        audioElement.pause();
        playingIndex = 0;
      } else { 
        getNextChild( children );
      }
    },

    itemsLength = children.length,
    childsChildren = children[ playingIndex ].children,
    currentNode = children[ playingIndex ],
    options;

    if ( childsChildren.length > 0 ) { 

      options = playingEvents[ childsChildren.item( 0 ).id ];

      if ( options.start !== lastEnd ) {
        audioElement.currentTime = options.start;
      }

      lastEnd = options.end;
      audioElement.play();
      addClass( currentNode, "cbc-puzzle-playing" );
    }

    if ( options ) {

      requestAnimFrame( function() {
        ridinSpinnas( options, function() {   
          removeClass( currentNode, "cbc-puzzle-playing" );
          increment();
        });
      });
    } else {
      increment();
    }
  };

  playBtn.addEventListener( "click", function( event ) {
    
    var children = timelineElement.children,
        correctItems = 0, 
        stopSpinnin = false,
        childsChild;

    sortedEvents = sortedEvents.sort( function(a,b) {
      return a > b;
    });

    for ( var i = 0; i < events.length; i++ ) {

      childsChild = children[ i ].children.length && children[ i ].children.item( 0 ).id;

      if ( children[ i ].children.length && playingEvents[ childsChild ].start === sortedEvents[ i ] ) {
        correctItems++;
        var cbcEvent = document.getElementById( childsChild );
        addClass( cbcEvent, "cbc-puzzle-correctNode" );
        cbcEvent.draggable = false;
      }

      events[ i ].stop();
    }

    if ( correctItems === children.length ) {
      winner();
    } 

    playingIndex = 0;
    var children = timelineElement.children;
    getNextChild( children );
  }, false );

  itemBoxElement.addEventListener( "drop", function( event ) {

    event.preventDefault && event.preventDefault();
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
    sortedEvents.push( options.start );

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

      event.preventDefault && event.preventDefault();

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
