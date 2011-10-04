(function() {

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

  document.addEventListener( "DOMContentLoaded", function(){

    var timeBlocks = [],
        targ = document.getElementById( "targ" ),
        audio = document.getElementById( "audio" ),
        duration,
        moving = false,
        mouseOffset = 0,
        lastLeft = 0,
        elemRect;

    (function() {
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

    })();

    var Block = function() {

        var self = this,
            elem = document.createElement( "div" ),
            rect = targ.getClientRects()[ 0 ],
            left = 0,
            start = 0,
            end = 0,
            handles = {
              left: document.createElement( "div" ),
              right: document.createElement( "div" )
            },
            elemRect;

        elem.className = "time-block no-select";
        elem.id = "timeblock-" + timeBlocks.length;

        handles.left.className = handles.right.className = "handles no-select";
        elem.appendChild( handles.left );
        elem.appendChild( handles.right );
        handles.left.style.left = "0px";
        handles.right.style.right = "0px";

        var addHandleListeners = function() {

          //  Left
          handles.left.moving = false;
          handles.right.moving = false;

          var leftHandle_md = function( event ){
            elemRect = elem.getClientRects()[0];
            lastLeft = elemRect.left;
            handles.left.moving = true;
            window.addEventListener( "mousemove", leftHandle_mm, false );
            window.addEventListener( "mouseup", leftHandle_mu, false );
          };

          var leftHandle_mm = function( event ){
            if ( handles.left.moving ) {
              var newLeft = event.clientX;
              if ( newLeft >= 0 && newLeft < ( elemRect.left + elemRect.width ) ) {
                elem.style.width = ( elemRect.left - newLeft ) + elemRect.width;
                elem.style.left = newLeft + "px"
                left = newLeft;
              }
            }
          };

          var leftHandle_mu = function(){
            handles.left.moving = false;
            window.removeEventListener( "mousemove", leftHandle_mm, false );
            window.removeEventListener( "mouseup", leftHandle_mu, false );
            start = ( left / rect.width ) * duration;
          };

          handles.left.addEventListener( "mousedown", leftHandle_md, false );

          //  Right
          var rightHandle_md = function(){
            elemRect = elem.getClientRects()[0];
            handles.right.moving = true;
            window.addEventListener( "mousemove", rightHandle_mm, false );
            window.addEventListener( "mouseup", rightHandle_mu, false );
          };

          var rightHandle_mm = function( event ){
            if ( handles.right.moving ) {
              var newWidth = event.clientX - elemRect.left;

              if ( newWidth > 0 && (elemRect.left + newWidth) - 6 <= rect.width ) {
                elem.style.width = newWidth + "px";
              }
            }
          };

          var rightHandle_mu = function(){
            handles.right.moving = false;
            window.removeEventListener( "mousemove", rightHandle_mm, false );
            window.removeEventListener( "mouseup", rightHandle_mu, false );
            end = ( ( left + elem.getClientRects()[0].width ) / rect.width ) * duration;
          };
          handles.right.addEventListener( "mousedown", rightHandle_md, false );

        };
        var editorInput = document.createElement( "input" );
        editorInput.setAttribute( "type", "text" );
        document.getElementById( 'editor' ).appendChild( editorInput );

        Object.defineProperty( this, "element", {
          get: function() { return elem; }
        });

        var updateSize = function() {
          elem.style.width = ( ( rect.width / duration ) * ( audio.currentTime - start ) ) + "px";
          end = audio.currentTime;
        };

        this.setLeft = function( val ) {
          if ( !val || typeof val !== "number" ) {
            return;
          }

          elem.style.left = val + "px";
          lastLeft = left = val;
          start = audio.currentTime;
        };

        this.appendTo = function( element ) {
          if ( element ) {
            element.appendChild && element.appendChild( elem );
          }
          return self;
        };

        var clicked = function() {
          if ( lastLeft === left ) {
            var checkTime = function() {
              if ( audio.currentTime >= end ) {
                audio.pause();
                audio.removeEventListener( "timeupdate", checkTime, false );
                audio.currentTime = end;
              }
            };

            audio.addEventListener( "timeupdate", checkTime, false );

            audio.currentTime = start;
            audio.play();
          }
        };

        var timeUpdate = function() {
          updateSize();
        };

        var keyUp = function( key ) {
          if ( key.which === 90 ) {

            audio.pause();

            window.removeEventListener( "keyup", keyUp, false );
            audio.removeEventListener( "timeupdate", timeUpdate, false );
            updateSize();

          }
        };

        var mouseMove = function( event ) {
          if ( moving ) {
            var newLeft = ( event.clientX - mouseOffset );
            if ( newLeft >= 0 && newLeft + elemRect.width <= rect.width ) {
              elem.style.left = newLeft + "px";
              left = newLeft;
            }
          }
        };

        var getOffset = function( clientX ) {

          return clientX - elem.getClientRects()[0].left;
        };

        var mouseDown = function( event ) {

          if ( event.target === elem ) {
            moving = true;
            lastLeft = left;
            elemRect = elem.getClientRects()[0];
            mouseOffset = getOffset( event.clientX );
            window.addEventListener( "mousemove", mouseMove, false );
            window.addEventListener( "mouseup", mouseUp, false );
          }
        };

        var mouseUp = function( e ) {
          moving = false;
          window.removeEventListener( "mousemove", mouseMove, false );
          window.removeEventListener( "mouseup", mouseUp, false );
          start = ( left / rect.width ) * duration;
          end = ( ( left + elem.getClientRects()[0].width ) / rect.width ) * duration;
        };

        function addClass( element, name ) {
          var classes = element.className.split( " " ),
              idx = classes.indexOf( name );
          if ( idx === -1 ) {
            element.className += " " + name;
          }
        }
        function removeClass( element, name ) {
          var classes = element.className.split( " " ),
              idx = classes.indexOf( name );
          if ( idx > -1 ) {
            classes.splice( idx, 1 );
          }
          element.className = classes.join( " " );
        }

        var editMode = false;

        function toggleEditMode( state ) {
          if ( state ) {
            editorInput.style.display = "block";
            editorInput.focus();
          }
          else {
            editorInput.style.display = "none";
          }
          editMode = state;
        } //toggleEditMode

        function keyPress( e ) {
          if ( e.which === 13 ) {
            toggleEditMode( !editMode );
          }
        } //keyDown

        this.select = function() {
          addClass( elem, "time-block-highlight" );
          window.addEventListener( 'keypress', keyPress, false );
        };

        this.deselect = function() {
          removeClass( elem, "time-block-highlight" );
          window.removeEventListener( 'keypress', keyPress, false );
        };

        elem.addEventListener( "click", function( e ) {
          for ( var i=0; i<timeBlocks.length; ++i ) {
            timeBlocks[ i ].deselect();
          }
          self.select();
        }, false );
        elem.addEventListener( "dblclick", clicked, false );
        elem.addEventListener( "mousedown", mouseDown, false );

        self.setLeft( ( ( audio.currentTime / duration ) * rect.width ) );

        self.appendTo( targ );
        addHandleListeners();

        audio.addEventListener( "timeupdate", timeUpdate, false );
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
    };

    var Scrubber = function() {

      var elem = document.createElement( "div" ),
          rect = targ.getClientRects()[ 0 ],
          moving = false,
          elemRect;

      elem.id = "scrubber";
      elem.className = "scrubber no-select"
      elem.style.left = 0;

      targ.appendChild( elem );

      var updatePosition = function() {
        elem.style.left = ( ( audio.currentTime / duration ) * rect.width ) + "px";
      };

      var mouseDown = function() {
        moving = true;
        elemRect = elem.getClientRects()[ 0 ];
        window.addEventListener( "mousemove", mouseMove, false );
        window.addEventListener( "mouseup", mouseUp, false );
        audio.removeEventListener( "timeupdate", updatePosition, false );

      };

      var mouseMove = function( event ) {
        if ( moving ) {
          var newLeft = ( event.clientX - rect.left );
          if ( newLeft >= 0 && newLeft + elemRect.width <= rect.width ) {
            elem.style.left = ( event.clientX - rect.left ) + "px";
            audio.currentTime = ( elem.getClientRects()[0].left / ( rect.width - rect.left ) ) * duration;
          }
        }
      };

      var mouseUp = function() {
        moving = false;
        window.removeEventListener( "mouseup", mouseUp, false );
        window.removeEventListener( "mousemove", mouseMove, false );
        audio.addEventListener( "timeupdate", updatePosition, false );
        audio.pause();
        updatePosition();

      };

      elem.addEventListener( "mousedown", mouseDown, false );

      audio.addEventListener( "timeupdate", updatePosition, false);

      return this;
    };

    function audioLoaded() {

      var scrubber = new Scrubber();

      audio.currentTime = 0;
      audio.pause();

      audio.removeEventListener( "canplaythrough", audioLoaded, false );

      duration = audio.duration;

      var keyUp = function() {
        window.addEventListener( "keydown", keyDown, false );

            window.removeEventListener( "keyup", keyUp, false );
      };

      var keyDown = function( key ) {
        if ( key.which === 90 ) {

            timeBlocks.push ( new Block() );

            window.removeEventListener( "keydown", keyDown, false );

            window.addEventListener( "keyup", keyUp, false );

        };

      }

      window.addEventListener( "keydown", keyDown, false );

      //  end audioLoaded() block
    }

    (function() {
      var audio = document.getElementById( 'audio' ),
          canvas = document.getElementById( 'audio-canvas' ),
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

        function audioAvailable( event ) {
          var samples = event.frameBuffer;
              time = event.time;

          ctx.fillStyle = "#000000";
          ctx.beginPath();
          for (var i = 0; i < frameBufferLength; i++) {
            var s = samples[ i ]/2 * 50;
            ctx.rect( ci, -s, 1, s );
            ci += stepx;
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
            audioLoaded( e );
          }
          audio.addEventListener( 'ended', ended, false );
        }
        audio.addEventListener( 'canplaythrough', canplaythrough, false );
      }, false );
    })();

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
