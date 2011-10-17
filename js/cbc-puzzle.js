(function() {
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
    if ( idx > -1 ) {
      classes.splice( idx, 1 );
    }
    element.className = classes.join( " " );
  }; //removeClass

  var addClass = function( element, name ) {

    var classes = element.className.split( " " ),
        idx = classes.indexOf( name );
    if ( idx === -1 ) {
      element.className += name + " ";
    }
  }; //addClass

  var CBCPuzzle = window.CBCPuzzle = function( options ) {

    var audioElement = document.createElement( "audio" ),
        targetContainer = document.getElementById( options.target ),
        sourceContainer = document.getElementById( options.source ),
        jsonBlob = options.json,
        sources = [],
        sourceMap = {},
        loops = [],
        that = this;

    var Loop = function( fn, stopCallback ) {
      var stopLoop = false;
      function update() {
        fn();
        if ( !stopLoop ) {
          requestAnimFrame( update );
        }
        else if ( stopCallback ) {
          stopCallback();
        } //if
      } //update
      this.stop = function() {
        stopLoop = true;
      }; //stop
      update();
    }; //Loop

    var Source = function( options ) {
      var start = options.start,
          end = options.end,
          text = options.text,
          thisSource = this;

      var sourceDiv = document.createElement( "div" );
      sourceDiv.id = "cbc-puzzle-source-" + sources.length;
      sourceDiv.innerHTML = options.text;
      sourceDiv.setAttribute( "data-f", text );
      addClass( sourceDiv, "cbc-puzzle-source" );
      sourceMap[ sourceDiv.id ] = this;

      var targetDiv = document.createElement( "div" );
      targetDiv.id = "cbc-puzzle-target-" + sources.length;
      addClass( targetDiv, "cbc-puzzle-target" );
      addClass( targetDiv, "cbc-puzzle-no-highlight" );
      targetDiv.setAttribute( "data-f", text );

      Object.defineProperty( this, "start", { get: function() { return start; } } );
      Object.defineProperty( this, "end", { get: function() { return end; } } );
      Object.defineProperty( this, "text", { get: function() { return text; } } );
      Object.defineProperty( this, "sourceElement", { get: function() { return sourceDiv; } } );
      Object.defineProperty( this, "targetElement", { get: function() { return targetDiv; } } );
      Object.defineProperty( this, "correct", {
        get: function() {
          return targetDiv.children.length > 0 && targetDiv.children[ 0 ] === sourceDiv;
        }
      });
      Object.defineProperty( this, "currentSource", {
        get: function() {
          if ( targetDiv.children.length > 0 ) {
            return sourceMap[ targetDiv.children[ 0 ].id ];
          } //if
        }
      });

      targetDiv.addEventListener( "dragover", function( e ) {
        addClass( targetDiv, "cbc-puzzle-highlight" );
        e.preventDefault();
        e.dataTransfer.dropeffect = "copy";
      }, false );

      targetDiv.addEventListener( "dragleave", function( e ) {
        removeClass( targetDiv, "cbc-puzzle-highlight" );
      }, false);

      targetDiv.addEventListener( "drop", function( e ) {
        e.preventDefault();
        removeClass( this, "cbc-puzzle-highlight" );
        e.stopPropagation();
        if ( targetDiv.children.length === 0 ) {
          var id = e.dataTransfer.getData( "Text" ),
              newItem = document.getElementById( id );
          targetDiv.style.width = newItem.style.width;
          targetDiv.appendChild( newItem );
        }
      }, false );

      sourceDiv.addEventListener( "click", function( e ) {
        that.stop();
        that.playSource( thisSource );
      }, false );

      function onDragStart( e ) {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData( "Text", sourceDiv.id );
      } //onDragStart

      sourceDiv.addEventListener( "dragstart", onDragStart, false );

      sourceDiv.draggable = true;

      this.freeze = function() {
        sourceDiv.draggable = false;
        sourceDiv.removeEventListener( "dragstart", onDragStart, false );
        addClass( targetDiv, "cbc-puzzle-correct" );
      }; //freeze

    }; //Source


    function gatherQuotes() {
      return targets;
    } //gatherQuotes

    this.playSource = function( source, callback, skipAdjust ) {

      callback = callback || function() {
        audioElement.pause();
      };

      function check( callback ) {
        var shouldStop =  audioElement.currentTime > source.end || 
                          audioElement.currentTime === audioElement.duration;
        if ( shouldStop ) {
          callback();
        }
        return shouldStop;
      } //check

      if ( !skipAdjust ) {
        audioElement.currentTime = source.start;
        audioElement.play();
      }
      clearLoops();
      var newLoop = new Loop( function() {
        if ( check( callback ) ) {
          newLoop.stop();
        } //if
      });
      loops.push( newLoop );
    }; //playSource

    function clearLoops() {
      while( loops.length > 0 ) {
        var loop = loops.pop();
        loop.stop();
      } //while
    } //clearLoops

    function checkNeighbour( last, next ) {
      return sources.indexOf( last ) + 1 === sources.indexOf( next );
    } //checkNeighbour

    this.play = function() {
      var playIndex = 0;
      function playNext( skipAdjust ) {
        if ( playIndex < sources.length ) {
          var nextSource = sources[ playIndex ],
              nextNextSource = sources[ playIndex + 1 ];
          if ( nextSource.currentSource ) {
            that.playSource( nextSource.currentSource, function() {
              if ( playIndex >= sources.length - 1 ) {
                audioElement.pause();
                clearLoops();
              }
              else if (  !nextNextSource || 
                    !checkNeighbour( nextSource.currentSource, nextNextSource.currentSource ) ) {
                audioElement.pause();
                ++playIndex;
                playNext();
              }
              else {
                ++playIndex;
                playNext( true );
              }
            }, skipAdjust );
          }
          else {
            ++playIndex;
            playNext();
          } //if
        } //if
      }
      playNext();
    }; //play

    this.submit = function() {
      var numCorrect = 0;
      for ( var i=0, l=sources.length; i<l; ++i ) {
        if ( sources[ i ].correct ) {
          ++numCorrect;
          sources[ i ].freeze();
        }
      } //for
      return numCorrect === sources.length;
    }; //submit

    this.stop = function( fn ) {
      stopLoop = true;
      stopFunc = fn
    }; //stop

    this.scramble = function() {
      for ( var i=0; i<10; ++i ) {
        var children = sourceContainer.children,
            numChildren = children.length,
            oldIdx = Math.floor( Math.random() * numChildren ),
            newIdx = Math.floor( Math.random() * numChildren );
        var oldChild = sourceContainer.replaceChild( children[ oldIdx ], children[ newIdx ] );
        sourceContainer.appendChild( oldChild );
      } //for
    }; //scramble

    this.addSource = function( source ) {
      sourceContainer.appendChild( source.sourceElement );
      sources.push( source );
    }; //addSource

    this.prepare = function() {
      sources = sources.sort( function( a, b ) {
        return a.start > b.start;
      });
      that.scramble();
      for ( var i=0, l=sources.length; i<l; ++i ) {
        targetContainer.appendChild( sources[ i ].targetElement );
      } //for
    }; //prepare

    if ( jsonBlob ) {
      jsonBlob = JSON.parse( jsonBlob ).data;
      var sourceElement = document.createElement( "source" );
      sourceElement.src = jsonBlob.audio;
      audioElement.appendChild( sourceElement );
      for ( var i=0, l=jsonBlob.length; i<l; ++i ) {
        this.addSource( new Source( jsonBlob[ i ] ) );
      } //for
      this.prepare();
    } //if

    sourceContainer.addEventListener( "drop", function( e ) {
      e.preventDefault();
      e.stopPropagation();
      var newItem = document.getElementById( e.dataTransfer.getData( "Text" ) );
      if ( newItem ) {
        sourceContainer.appendChild( newItem );
      } //if
    }, false );

    sourceContainer.addEventListener( "dragover", function( e ) {
      e.preventDefault();
      e.dataTransfer.dropeffect = "copy";
    }, false );

  }; //CBCPuzzle

})();
