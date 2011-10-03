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
        duration;

    var Block = function() {

        var self = this,
            elem = document.createElement( "div" ),
            rect = targ.getClientRects()[ 0 ],
            left = 0,
            start = 0
            end = 0;

        elem.className = "time-block";
        elem.id = "timeblock-" + timeBlocks.length;

        var updateSize = function() {
          elem.style.width = ( ( rect.width / duration ) * ( audio.currentTime - start ) ) + "px";
          end = audio.currentTime;
        };

        this.setLeft = function( val ) {
          if ( !val || typeof val !== "number" ) {
            return;
          }

          elem.style.left = val + "px";

          left = val;
          start = audio.currentTime;

          return self;
        };

        this.appendTo = function( element ) {
          if ( element ) {
            element.appendChild && element.appendChild( elem );
          }
          return self;
        };

        var clicked = function() {

          var checkTime = function() {
            if ( audio.currentTime >= end ) {
              audio.pause();
              audio.removeEventListener( "timeupdate", checkTime, false );
            }
          };

          audio.addEventListener( "timeupdate", checkTime, false );

          audio.currentTime = start;
          audio.play();
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

        elem.addEventListener( "click", clicked, false );

        self.setLeft( ( ( audio.currentTime / duration ) * rect.width ) );

        self.appendTo( targ );
        audio.addEventListener( "timeupdate", timeUpdate, false );
        window.addEventListener( "keyup", keyUp, false );
        audio.play();

      return this;
    };

    var Scrubber = function() {

      var elem = document.createElement( "div" ),
          rect = targ.getClientRects()[ 0 ];

      elem.id = "scrubber";
      elem.className = "scrubber"
      elem.style.left = 0;

      targ.appendChild( elem );

      var updatePosition = function() {
        elem.style.left = ( ( audio.currentTime / duration ) * rect.width ) + "px";
      };

      audio.addEventListener( "timeupdate", function() {
        updatePosition();
      }, false);

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
