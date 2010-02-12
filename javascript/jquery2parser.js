if ( typeof $ != 'undefined' ) {
  $(document).ready(function(){
    $("script[type='text/jquery']").each(function(){
      if ( this.src )
        $.get( this.src, function(src) {
          eval( parse( src ) );
        });
      else
        eval( parse( this.firstChild.nodeValue )[1] );
    });
  });
}

function parse(string) {
  string = string.replace(/^\s*\n/, '');
  string = string.replace(/\n\s*\n*$/, '');
  string = string.replace(/\n\s*\n|\r\n\s*\r\n/g, "\n");

  var t = string.split(/\n|\r\n/);
  var curLevel = 0;
  var str = "";
  var jq = "";
  var ls = [];

  var bl = getLevel( t[0] );

  for ( var i = 0; i < t.length; i++ ) {
    var level = getLevel( t[i] ) - bl;
    var tokens = parseLine( t[i] );

    //str += ( i < 9 ? " " : "" ) + (i+1).toString() + " ";
    //str += " ";

    jq += close( ls, level );

    for ( var j = 0; j < level; j++ ) {
      str += " ";
      jq += " ";
    }

    if ( tokens.expr && tokens.length > 1 ) {
      var n = [];
      for ( var j = 1; j < tokens.length; j++ ) {
        n.push( tokens[j].text );
        tokens[j] = '';
      }
      tokens.length = 1;

      for ( var j = t.length - 1; j > i; j-- )
        t[j+1] = t[j];

      t[i+1] = /^\s*/.exec( t[i] )[0] + n.join(' ');

      for ( var j = i + 1; j < t.length; j++ )
        if ( j != i + 1 && getLevel( t[j] ) - bl <= level )
          j = t.length;
        else
          t[j] = "  " + t[j];
    }

    for ( var j = 0; j < tokens.length; j++ ) {
      //if ( tokensngth > 0 ) {
        //var type = getType(tokens,j);
        var tmp = tokens[j].text;
        var type = tokens[j].type;

        //str += close( ls, level );

        if ( type == "expr" || (type == "cmd" && getLevel(t[i+1]) - bl > level) )
          ls.unshift( level );

        var b = ( type == 'expr' ? 
          ( level == 0 ? "$('" : "$(this).find('" ) :
          ( type == "cmd" ? '$(this).' :
            j == 1 ? '' : ', ' ));

        var a = ( type == 'expr' ? 
          "').each(function(){" :
          ( type == "cmd" ? 
            (tokens.length != 1 ? '(' :
              getLevel(t[i+1]) - bl > level ? '(function(){': '();') :
            j == tokens.length - 1 ? 
              ( getLevel(t[i+1]) - bl > level ? ', function(){' : ');')
               : '' ));

        str += " <span class='" + type + "'>"+ tmp.replace(/</g, "&lt;") + "</span>";
        jq += b + tmp + a;
      //}
    }

    str += "\n";
    jq += "\n";
  }

  jq += close(ls, 0);

  return [ str, jq ];
}

function close(ls,level) {
  var str = "";
  while ( ls.length > 0 && ls[0] >= level ) {
    str += $s(ls[0]) + "});\n";
    ls.shift();
  }
  return str;
}

function $s(level) {
  var str = ""
  for ( var j = 0; j < level; j++ )
    str += " ";
  return str;
}

function getLevel(i) {
  return /^\s*/.exec(i)[0].length;
}

function getType(tokens,i) {
  var e = tokens.expr;
  return ( e && i == 0 && "expr" ) ||
    (( (e && i == 1) || i == 0 ) && "cmd") ||
    "arg";
}

function parseLine(string) {
  var t = string.split(/ /);
  var tokens = [];

  var fi = -1;
  var cmd = false;
  var inString = false;
  var exprNum = -1;

  for ( var i = 0; i < t.length; i++ ) {

    var type = "arg";

    if ( t[i].length ) {
      if ( fi == -1 ) fi = i;

      var f = t[i].charAt(0);
      var l = t[i].charAt(t[i].length - 1);

      if ( f == '!' && i == fi ) {
        t[i] = t[i].substr( 1, t[i].length );
        cmd = true;
      }

      if ( !cmd ) { 
        if ( f == ':' && !inString ) {
          t[i] = t[i].substr( 1, t[i].length );
          type = "key";
        }

        if ( l == ':' ) {
          t[i] = t[i].substr( 0, t[i].length - 1 );
          exprNum = true;
        }
 
        // If this block begins with a quote 
        if ( !inString && f == "'" || f == '"' ) {
          inString = f;
          //type = "string";
        }

        // If the block has quotes around it
        if ( inString && f == l && (f == '"' || f == "'") ) {
          inString = false;
        }
      }

      if ( (inString && f != inString) || ( cmd && i != fi ) ) {
        if ( l == inString ) {
          inString = false;
        }

        tokens[ tokens.length - 1 ].text += " " + t[i];
      } else {
        tokens[ tokens.length ] = { text: t[i], type: '', toString: function(){ return this.type + ": " + this.text; } };
      }

      var curToken = tokens[ tokens.length - 1 ];

      if ( cmd )
        curToken.type = "js";
      else if ( tokens.length > 1 && tokens[ tokens.length - 2 ].type == "key" )
        curToken.type = "value";
      else if ( type )
        curToken.type = type;

      if ( exprNum === true )
        exprNum = tokens.length - 1;
    }

  }

  if ( exprNum > -1 ) {
    var nt = [];

    for ( var i = 0; i < tokens.length; i++ ) {
      if ( i <= exprNum && i > 0 )
        nt[0].text +=  " " + tokens[i].text;
      else
        nt[ nt.length ] = tokens[i];
    }

    nt[0].type = "expr";

    if ( nt.length > 1 )
      nt[1].type = "cmd";

    tokens = nt;
    tokens.expr = true;
  } else if ( tokens[0].type == "arg" )
    tokens[0].type = "cmd";

  return tokens;
};

