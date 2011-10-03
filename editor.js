(function() {
  document.addEventListener( "DOMContentLoaded", function(){

    var timeBlocks = [],
        targ = document.getElementById( "targ" ),
        audio = document.getElementById( "audio" ),
        duration,
        moving = false,
        mouseOffset = 0,
        lastLeft = 0;

    var Block = function() {

        var self = this,
            elem = document.createElement( "div" ),
            rect = targ.getClientRects()[ 0 ],
            left = 0;

        this.start = 0
        this.end = 0;

        elem.className = "time-block";
        elem.id = "timeblock-" + timeBlocks.length;

        var updateSize = function() {
          elem.style.width = ( ( rect.width / duration ) * ( audio.currentTime - self.start ) ) + "px";
          self.end = audio.currentTime;
        };

        this.setLeft = function( val ) {
          if ( !val || typeof val !== "number" ) {
            return;
          }

          elem.style.left = val + "px";
          lastLeft = val;
          self.start = audio.currentTime;
        };

        this.appendTo = function( element ) {
          if ( element ) {
            element.appendChild && element.appendChild( elem );
          }
          return self;
        };

        var clicked = function() {
          if ( lastLeft === elem.style.left ) {
            var checkTime = function() {
              if ( audio.currentTime >= self.end ) {
                audio.pause();
                audio.removeEventListener( "timeupdate", checkTime, false );
                audio.currentTime = self.end;
              }
            };

            audio.addEventListener( "timeupdate", checkTime, false );

            audio.currentTime = self.start;
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

            elem.style.left = ( event.clientX - mouseOffset ) + "px"
          }
        };

        var getOffset = function( clientX ) {

          return clientX - elem.getClientRects()[0].left;
        };

        var mouseDown = function( event ) {
          moving = true;
          lastLeft = elem.style.left;
          mouseOffset = getOffset( event.clientX );
          elem.addEventListener( "mousemove", mouseMove, false );
          window.addEventListener( "mouseup", mouseUp, false );
        };

        var mouseUp = function( e ) {
          moving = false;
          elem.removeEventListener( "mousemove", mouseMove, false );
          window.removeEventListener( "mouseup", mouseUp, false );
        };

        elem.addEventListener( "click", clicked, false );
        elem.addEventListener( "mousedown", mouseDown, false );

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

    audio.addEventListener( "canplaythrough", audioLoaded, false );

  //  end DOMContentLoaded Block
  }, false );


})();