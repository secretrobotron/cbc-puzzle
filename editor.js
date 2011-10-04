(function() {

  var timeBlocks = [];

  // Thanks Paul Irish :)
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

  function loadWaveform( audio, callback ) {
    var canvas = document.getElementById( 'audio-canvas' ),
        ctx = canvas.getContext( '2d' ),
        cw = canvas.width, ch = canvas.height, ci = 0;

    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect( 0, 0, cw, ch );
    ctx.translate( 0, ch/2 );

    audio.addEventListener( 'loadedmetadata', function( e ) {
      var channels = audio.mozChannels,
          rate = audio.mozSampleRate,
          frameBufferLength = audio.mozFrameBufferLength,
          stepx = cw / Math.ceil( audio.duration * rate / frameBufferLength * channels ) / ( frameBufferLength );

      var drawStep = 20;
      function audioAvailable( event ) {
        var samples = event.frameBuffer;
            time = event.time;

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        for (var i = 0; i < frameBufferLength; i+=drawStep ) {
          var s = samples[ i ]/2 * 50;
          ctx.rect( ci, -s, 1, s );
          ci += stepx*drawStep;
        } //for
        ctx.fill();
      } //audioAvailable

      function canplaythrough( e ) {
        audio.removeEventListener( 'canplaythrough', canplaythrough, false );
        audio.addEventListener( 'MozAudioAvailable', audioAvailable, false );
        audio.play();
        function ended( e ) {
          audio.removeEventListener( 'ended', ended, false );
          document.getElementById( 'play-canvas' ).style.display = "block";
          document.getElementById( 'prepare-div' ).style.display = "none";
          callback( e );
        }
        audio.addEventListener( 'ended', ended, false );
      }
      audio.addEventListener( 'canplaythrough', canplaythrough, false );
    }, false );

  } //WaveformCanvas

  function createControlButtons( audio ) {
    var playCanvas = document.getElementById( 'play-canvas' ),
        pauseCanvas = document.getElementById( 'pause-canvas' ),
        playCtx = playCanvas.getContext( '2d' ),
        pauseCtx = pauseCanvas.getContext( '2d' ),
        ctx, w, h;

    w = playCanvas.width;
    h = playCanvas.height;
    ctx = playCtx;
    ctx.clearRect( 0, 0, w, h );
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.moveTo( 0, 0 );
    ctx.lineTo( 0, h );
    ctx.lineTo( w, h/2 );
    ctx.lineTo( 0, 0 );
    ctx.fill();

    w = playCanvas.width;
    h = playCanvas.height;
    ctx = pauseCtx;
    ctx.clearRect( 0, 0, w, h );
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.moveTo( w/4, 0 );
    ctx.lineTo( w/4, h );
    ctx.lineTo( 2*w/4, h );
    ctx.lineTo( 2*w/4, 0 );
    ctx.lineTo( w/4, 0 );

    ctx.moveTo( 3*w/4, 0 );
    ctx.lineTo( 3*w/4, h );
    ctx.lineTo( w, h );
    ctx.lineTo( w, 0 );
    ctx.lineTo( w, 0 );
    ctx.fill();

    playCanvas.addEventListener( 'click', function( e ) {
      audio.play();
      playCanvas.style.display = "none";
      pauseCanvas.style.display = "block";
    }, false );
    pauseCanvas.addEventListener( 'click', function( e ) {
      audio.pause();
      playCanvas.style.display = "block";
      pauseCanvas.style.display = "none";
    }, false );
  } //ControlButtons

  var Block = function( container, audio ) {

    var that = this,
        blockElement = document.createElement( "div" ),
        blockRect,
        containerRect = container.getBoundingClientRect(),
        lastLeft = 0,
        left = 0,
        start = 0,
        end = 0,
        handles = {
          left: document.createElement( "div" ),
          right: document.createElement( "div" )
        },
        mouseOffset,
        duration = audio.duration;

    blockElement.className = "time-block no-select";
    blockElement.id = "timeblock-" + timeBlocks.length;

    handles.left.style.left = "0px";
    handles.right.style.right = "0px";

    function getRelativeXPosition( x ) {
      return x - containerRect.left;
    } //getRelativeXPosition

    function setupHandle( handle, options ) {
      handle.className = "handles no-select";
      blockElement.appendChild( handle );
      var moving = false, mouseOffset;
      var mouseDown = function( event ) {
        moving = true;
        blockRect = blockElement.getBoundingClientRect();
        mouseOffset = [
          getRelativeXPosition( event.clientX ) - blockElement.offsetLeft,
          blockElement.offsetLeft + blockElement.offsetWidth - getRelativeXPosition( event.clientX ) 
        ];
        options.mouseDown( event, blockRect );
        window.addEventListener( "mousemove", mouseMove, false );
        window.addEventListener( "mouseup", mouseUp, false );
      }; //mouseDown
      var mouseUp = function( event ) {
        moving = false;
        window.removeEventListener( "mousemove", mouseMove, false );
        window.removeEventListener( "mouseup", mouseUp, false );
        options.mouseUp( event, mouseOffset );
      }; //mouseUp
      var mouseMove = function( event ) {
        options.mouseMove( event, moving, blockRect, mouseOffset );
      }; //mouseMove
      handle.addEventListener( "mousedown", mouseDown, false );
    } //setupHandle

    var addHandleListeners = function() {

      function adjustBlockSize( newLeft, newRight ) {
        if ( newLeft >= 0 && newLeft < containerRect.width ) {
          blockElement.style.left = newLeft + "px"
          left = newLeft;
        } //if
        if ( newRight >= 0 && newRight < containerRect.width ) {
          blockElement.style.width = ( newRight - newLeft ) + "px"
        } //if
      } //adjustBlockSize

      setupHandle( handles.left, {
        mouseDown: function( event, blockRect ) {
          lastLeft = blockRect.left;
        },
        mouseUp: function( event, moving, mouseOffset ) {
          start = ( left / containerRect.width ) * duration;
        },
        mouseMove: function( event, moving, blockRect, mouseOffset ) {
          if ( moving ) {
            adjustBlockSize(  getRelativeXPosition( event.clientX ) - mouseOffset[ 0 ],
                              blockElement.offsetLeft + blockElement.clientWidth );
          }
        }
      });

      setupHandle( handles.right, {
        mouseDown: function( event ) {
        },
        mouseUp: function( event, moving, blockRect ) {
          end = ( ( left + containerRect.width ) / containerRect.width ) * duration;
        },
        mouseMove: function( event, moving, blockRect, mouseOffset ) {
          if ( moving ) {
            adjustBlockSize(  blockElement.offsetLeft, 
                              getRelativeXPosition( event.clientX ) + mouseOffset[ 1 ] );
          }
        }
      });

    }; //addHandleListeners

    var editorInput = document.createElement( "input" );
    editorInput.setAttribute( "type", "text" );
    document.getElementById( 'editor' ).appendChild( editorInput );

    Object.defineProperty( this, "element", {
      get: function() { return blockElement; }
    });

    var updateSize = function() {
      blockElement.style.width = ( ( containerRect.width / duration ) * ( audio.currentTime - start ) ) + "px";
      end = audio.currentTime;
    };

    this.setLeft = function( val ) {
      if ( !val || typeof val !== "number" ) {
        return;
      }

      blockElement.style.left = val + "px";
      lastLeft = left = val;
      start = audio.currentTime;
    };

    this.appendTo = function( element ) {
      if ( element ) {
        element.appendChild && element.appendChild( blockElement );
      }
      return that;
    };

    var doubleClicked = function() {
      if ( lastLeft === left ) {
        var stopChecking = false;
        var checkTime = function() {
          if ( audio.currentTime >= end || stopChecking ) {
            audio.pause();
            audio.currentTime = end;
          }
          else {
            requestAnimFrame( checkTime );
          }
        }; //checkTime

        audio.currentTime = start;
        audio.play();
        stopChecking = false;
        checkTime();
      }
    };

    var stop = false;
    var timeUpdate = function() {
      updateSize();
      if ( !stop ) {
        requestAnimFrame( timeUpdate );
      }
    }; //timeUpdate

    var keyUp = function( key ) {
      if ( key.which === 90 ) {
        audio.pause();
        window.removeEventListener( "keyup", keyUp, false );
        stop = true;
        updateSize();
      }
    }; //keyUp

    var mouseMove = function( event ) {
      if ( moving ) {
        var newLeft = ( event.clientX - mouseOffset - containerRect.left );
        if ( newLeft >= 0 && newLeft + blockRect.width <= containerRect.width ) {
          blockElement.style.left = newLeft + "px";
          left = newLeft;
        }
      }
    }; //mouseMove

    var mouseDown = function( event ) {
      if ( event.target === blockElement ) {
        moving = true;
        lastLeft = left;
        blockRect = blockElement.getClientRects()[0];
        mouseOffset = event.clientX - blockElement.getClientRects()[0].left;
        window.addEventListener( "mousemove", mouseMove, false );
        window.addEventListener( "mouseup", mouseUp, false );
      } //if
    }; //mouseDown

    var mouseUp = function( e ) {
      moving = false;
      window.removeEventListener( "mousemove", mouseMove, false );
      window.removeEventListener( "mouseup", mouseUp, false );
      start = ( left / containerRect.width ) * duration;
      end = ( ( left + blockElement.getClientRects()[0].width ) / containerRect.width ) * duration;
    }; //mouseUp

    function addClass( element, name ) {
      var classes = element.className.split( " " ),
          idx = classes.indexOf( name );
      if ( idx === -1 ) {
        element.className += " " + name;
      }
    } //addClass

    function removeClass( element, name ) {
      var classes = element.className.split( " " ),
          idx = classes.indexOf( name );
      if ( idx > -1 ) {
        classes.splice( idx, 1 );
      }
      element.className = classes.join( " " );
    } //removeClass

    var editMode = false;

    function deleteKeyPress( e ) {
      if ( e.which === 46 || e.which === 8 ) {
        var idx = timeBlocks.indexOf( that );
        if ( idx > -1 ) {
          timeBlocks.splice( idx, 1 );
          blockElement.parentNode.removeChild( blockElement );
          stop = true;
          that.deselect();
          toggleEditMode( false );
        } //if
      } //if
    } //deleteKeyDown

    function toggleEditMode( state ) {
      if ( state ) {
        editorInput.style.display = "block";
        editorInput.focus();
      }
      else {
        editorInput.style.display = "none";
        window.removeEventListener( 'keypress', deleteKeyPress, false );
      }
      editMode = state;
    } //toggleEditMode

    function keyPress( e ) {
      if ( e.which === 13 ) {
        toggleEditMode( !editMode );
      }
    } //keyDown

    this.select = function() {
      addClass( blockElement, "time-block-highlight" );
      window.addEventListener( 'keypress', keyPress, false );
      window.addEventListener( 'keypress', deleteKeyPress, false );
    };

    this.deselect = function() {
      removeClass( blockElement, "time-block-highlight" );
      window.removeEventListener( 'keypress', keyPress, false );
      window.removeEventListener( 'keypress', deleteKeyPress, false );
    };

    blockElement.addEventListener( "click", function( e ) {
      for ( var i=0; i<timeBlocks.length; ++i ) {
        timeBlocks[ i ].deselect();
      }
      that.select();
    }, false );
    blockElement.addEventListener( "dblclick", doubleClicked, false );
    blockElement.addEventListener( "mousedown", mouseDown, false );

    that.setLeft( ( ( audio.currentTime / duration ) * containerRect.width ) );

    container.appendChild( blockElement );
    addHandleListeners();
    timeUpdate();
    window.addEventListener( "keyup", keyUp, false );
    audio.play();

    Object.defineProperty( this, "output", {
      get: function() {
        return {
          text: editorInput.value,
          start: start,
          end: end
        };
      }
    });

    return this;
  }; //Block

  var Scrubber = function( container, audio ) {

    var scrubberElement = document.createElement( "div" ),
        rect = container.getClientRects()[ 0 ],
        moving = false,
        scrubberRect,
        stopLoop = false;

    scrubberElement.id = "scrubber";
    scrubberElement.className = "scrubber no-select"
    scrubberElement.style.left = 0;

    container.appendChild( scrubberElement );

    var updatePosition = function() {
      scrubberElement.style.left = ( ( audio.currentTime / audio.duration ) * rect.width ) + "px";
    };

    var mouseDown = function() {
      moving = true;
      scrubberRect = scrubberElement.getClientRects()[ 0 ];
      window.addEventListener( "mousemove", mouseMove, false );
      window.addEventListener( "mouseup", mouseUp, false );
    };

    var mouseMove = function( event ) {
      if ( moving ) {
        stopLoop = true;
        var newLeft = ( event.clientX - rect.left );
        if ( newLeft >= 0 && newLeft + scrubberRect.width <= rect.width ) {
          scrubberElement.style.left = ( event.clientX - rect.left ) + "px";
        }
      }
    };

    var mouseUp = function() {
      moving = false;
      window.removeEventListener( "mouseup", mouseUp, false );
      window.removeEventListener( "mousemove", mouseMove, false );
      audio.pause();
      audio.currentTime = ( scrubberElement.offsetLeft / container.offsetWidth ) * audio.duration;
      stopLoop = false;
      update();
    };

    scrubberElement.addEventListener( "mousedown", mouseDown, false );

    function update() {
      if ( !stopLoop ) {
        updatePosition();
        requestAnimFrame( update );
      }
    }
    update();

    return this;
  }; //Scrubber

  document.addEventListener( "DOMContentLoaded", function(){

    var container = document.getElementById( "container" ),
        audio = document.getElementById( "audio" );

    createControlButtons( audio );

    function audioLoaded() {

      var scrubber = new Scrubber( container, audio );

      audio.currentTime = 0;
      audio.pause();
      audio.removeEventListener( "canplaythrough", audioLoaded, false );

      var keyUp = function() {
        window.addEventListener( "keydown", keyDown, false );
        window.removeEventListener( "keyup", keyUp, false );
      }; //keyUp

      var keyDown = function( key ) {
        if ( key.which === 90 ) {
          timeBlocks.push ( new Block( container, audio ) );
          window.removeEventListener( "keydown", keyDown, false );
          window.addEventListener( "keyup", keyUp, false );
        };
      }; //keyDown

      window.addEventListener( "keydown", keyDown, false );

      //  end audioLoaded() block
    } //audioLoaded

    loadWaveform( audio, audioLoaded );

    document.getElementById( 'output-render' ).addEventListener( 'click', function( e ) {
      var textArea = document.getElementById( 'output-textarea' ),
          outputObj = [];
      for ( var i=0; i<timeBlocks.length; ++i ) {
        outputObj.push( timeBlocks[ i ].output );
      }
      textArea.value = JSON.stringify( outputObj );
    }, false );

  //  end DOMContentLoaded Block
  }, false );


})();
