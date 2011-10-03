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

          var leftHandle_md = function(){
            elemRect = elem.getClientRects()[0];
            lastLeft = elemRect.left;
            handles.left.moving = true;
            window.addEventListener( "mousemove", leftHandle_mm, false );
            window.addEventListener( "mouseup", leftHandle_mu, false );
          };
          var leftHandle_mm = function( event ){
            if ( handles.left.moving ) {
              var newLeft = ( event.clientX - mouseOffset );
              if ( newLeft >= 0 && newLeft < ( elemRect.left + elemRect.width ) ) {
                elem.left = newLeft + "px"
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

          };
          var rightHandle_mm = function(){

          };
          var rightHandle_mu = function(){

          };
        };

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

          moving = true;
          lastLeft = left;
          elemRect = elem.getClientRects()[0];
          mouseOffset = getOffset( event.clientX );
          window.addEventListener( "mousemove", mouseMove, false );
          window.addEventListener( "mouseup", mouseUp, false );
        };

        var mouseUp = function( e ) {
          moving = false;
          window.removeEventListener( "mousemove", mouseMove, false );
          window.removeEventListener( "mouseup", mouseUp, false );
          start = ( left / rect.width ) * duration;
          end = ( ( left + elem.getClientRects()[0].width ) / rect.width ) * duration;
        };

        elem.addEventListener( "click", clicked, false );
        elem.addEventListener( "mousedown", mouseDown, false );

        self.setLeft( ( ( audio.currentTime / duration ) * rect.width ) );

        self.appendTo( targ );
        addHandleListeners();

        audio.addEventListener( "timeupdate", timeUpdate, false );
        window.addEventListener( "keyup", keyUp, false );
        audio.play();

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
            document.getElementById( 'prepare-div' ).style.display = "none";
            audioLoaded( e );
          }
          audio.addEventListener( 'ended', ended, false );
        }
        audio.addEventListener( 'canplaythrough', canplaythrough, false );
      }, false );
    })();

  //  end DOMContentLoaded Block
  }, false );


})();
