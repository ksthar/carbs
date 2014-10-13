/** 
 * @file web-server.js
 * @brief Creates the webserver for the carb tool.
 * 				This file contains the server definition, database calls, and 
 * 				all helper functions.
 * @author Harlan Shoop
 * @version 0.1
 * @date 2014-09-12
 */
// --------------------------------------------------------------------------------------------
// Server module requires
// --------------------------------------------------------------------------------------------

var sys=require('util');
var app=require('http').createServer( httpHandler );
var io=require('socket.io').listen(app);
io.set( 'log level', 1 );
var url=require('url');
var path=require('path');
var fs=require('fs');
var mysql=require('mysql');

// Server location
var serverPort = 8081;					/**< Port to run the server on	*/
var serverUrl	= "23.253.151.132";		/**< Local URL for the server		*/

// setup credentials for mysql
var mysql_username = 'username';
var mysql_password = 'password';

// --------------------------------------------------------------------------------------------
// Helper Functions and Logging
// --------------------------------------------------------------------------------------------

// setup console colors...
var red = '\033[31m',
	  blue = '\033[34m',
	  green = '\033[32m',
	  yellow = '\033[33m',
	  magenta = '\033[35m',
	  cyan = '\033[36m',
	  white = '\033[37m',
	  reset = '\033[0m';

/** 
 * @brief This creates a MySQL formatted time stamp
 * 
 * @return MySQL datetime stamp
 */
function getMySQLdate(){ 
	// You may want to do this on the client instead so that you have offline capability.
	// generate a MySQL datetime stamp...
	var date = new Date();
	var day = date.getUTCFullYear() + "-" + ( '00' + (date.getUTCMonth()+1)).slice(-2) + '-' + date.getUTCDate();
	return day;
}

/** 
 * @brief Create a date + time stamp
 * 
 * @return timeString (date/time stamp)
 */
function getTime() {
		var dateTime = new Date();
		var hrs = dateTime.getHours().toString();
		var min = dateTime.getMinutes().toString();
		var sec = dateTime.getSeconds().toString();
		var month	= dateTime.getMonth() + 1;
		var mo = month.toString();
		var dy 	= dateTime.getDate().toString();
		var yr 	= dateTime.getFullYear().toString();
		if (hrs.length < 2) hrs = "0" + hrs;
		if (min.length < 2) min = "0" + min;
		if (sec.length < 2) sec = "0" + sec;

		if (mo.length < 2) mo = "0" + mo;
		if (dy.length < 2) dy = "0" + dy;
		if (yr.length < 2) yr = "0" + yr;
		var timeString = mo + "/" + dy + "/" + yr + " " + hrs + ":" + min + ":" + sec;
		return timeString;
}

/** 
 * @brief This is a logging function, printing a colorized log to console
 * 
 * @param module The "module" calling the logging function
 * @param message The "message" to display in the log
 * 
 * @return 
 */
function msgOut( module, message ) {
	var msg = "";
	msg += white + getTime() + reset;

	switch( module ){
		case 'MySQL':
			msg += magenta;
			break;

		case 'HTTP':
			msg += blue;
			break;

		case 'Error':
			msg += red;
			break;
		
		case 'socket.io':
			msg += green;
			break;

		case 'internal':
			msg += yellow;
			break;

		default:
			break;
	}

	// create a fixed-width field for module name in which the module
	// name is right-aligned in the field
	
	var fixed = 10; 				/**< Character width of module name field		*/
	var modLength;					/**< Holder for length of module name				*/
	var modName = "";				/**< Holder for fixed-width module name			*/

	modLength = module.length;

	// if we're too long, truncate
	if( modLength > fixed ){
		modName = module.substr( 0, fixed );

	// if we're too short, pad with spaces
	} else if( modLength < fixed ){
		var diff = fixed - modLength;
		modName = module;
		for( i = 0; i <= diff; i++ ){
			modName = (" " + modName);
		} // for

	// if we're just right, just copy
	} else {
		modName = module;
	}
	msg += " " + modName + " - " + cyan + message + reset;
	console.log( msg );
}

// --------------------------------------------------------------------------------------------
// MySQL Stuff
// --------------------------------------------------------------------------------------------

/** 
 * @brief Open a database connection
 * 
 * @return Database connection handle
 */
function opendb(){
	try{
		client = mysql.createConnection({
			user: mysql_username,
			password: mysql_password
		});
		msgOut('MySQL','Instantiated client ' );

		// put a listener here to handle timeouts
		handleDisconnect( client );

		// make a connection with the client
		client.connect( function( err ){
			if( err ){
				msgOut( 'MySQL',"*** ERROR *** can't connect to mysql" );
				throw err;
			} 
			else msgOut( 'MySQL','connection made' );
		});


		// Select the database to use
		client.query( 'use carbs', function( err, result, fields ) {
			if( err ) {
				msgOut( 'MySQL', err );
				throw err;
			} else msgOut( 'MySQL', 'selected database' );
		});
		return client;
	} 
	catch (e) {
		msgOut('MySQL','Error: ' + e);
	}
}

// instantiate the client
var client = opendb();

// MySQL will idle and lose connection...
// got to handle this or it will take the 
// Node server down

/** 
 * @brief Callback for database disconnect event
 * 
 * @param connection The connection handle
 * 
 * @return None
 */
function handleDisconnect( connection ){
	connection.on( 'error', function( err ){
		if( !err.fatal ){
			return;
		}
		if( err.code !== 'PROTOCOL_CONNECTION_LOST' ) {
			msgOut( 'MySQL', 'Fatal MySQL error: ' + err );
			throw err;
		}
		msgOut( 'MySQL', 'Node lost connection with MySQL, re-connecting...' );
		client = opendb();
		
	});
}

/** 
 * @brief Grabs carbs for today from the database or, if there isn't a 
 * 				record for today, creates one with '0'.
 * 
 * @param day The MySQL datetime stamp for today
 * @param socket The socket handle for client connection
 * 
 * @return None
 */
function grabCarbs( day, socket ){
	// build the query to grab all the tasks 
	var existsQuery  = "SELECT EXISTS( SELECT ";
	existsQuery += "carbs ";
	existsQuery += "FROM log WHERE ";
	existsQuery += "day='" + day + "' ) AS 'exists'";

	msgOut( 'MySQL', existsQuery );

	
	// we don't know yet if a record for today exists...
	client.query( existsQuery, function( err, result, fields ){
		if( err ){
			msgOut( 'MySQL', err );
			throw err;
		} else {
			for( var i in result ){
				var exists =  result[i];
				// if exists == 0, then we need to add the record and initialize the carbs field,
				// otherwise, we can go ahead and grab the carbs from the record...

				msgOut( 'MySQL', 'I see ' + exists.exists );

				if( exists.exists == '0' ) {
					msgOut( 'MySQL', 'There is not a record for today; I need to make one...' );
					// instantiate a record and return zero
					var createQuery = "INSERT INTO log VALUES( '" + day + "', '0' )";
					msgOut( 'MySQL', createQuery );
					client.query( createQuery, function( err, result, fields ){
						if( err ){
							msgOut( 'MySQL', err );
							throw err;
						} else {
							msgOut( 'MySQL', 'Ok, we should have a record for today.' );
							socket.emit( 'carbs', '0' );
						}
					});

				} else {
					msgOut( 'MySQL', 'I see we have a record for today; I will pull up your carb count...' );
					// run the carbQuery
					var carbQuery = "SELECT carbs FROM log WHERE day='" + day + "'";
					msgOut( 'MySQL', carbQuery );
					client.query( carbQuery, function( err, result, fields ){
						if( err ){
							msgOut( 'MySQL', err );
							throw err;
						} else {
							for( var i in result ){
								var carbs = result[i].carbs;
								msgOut( 'MySQL', 'I see you have had ' + carbs + ' carbs today.' );
								socket.emit( 'carbs', carbs );
							}
							
						}
					});

				} 
			}
		}
	}); // existsQuery
	
}

/** 
 * @brief Update the carbs for today in database
 * 
 * @param day			datetime stamp for today
 * @param carbs		Number of carbs to save
 * @param socket	socket for client connection (not used)
 * 
 * @return 	None
 */
function setCarbs( day, carbs, socket ){
	var setQuery = 'UPDATE log SET carbs="' + carbs + '" WHERE day="' + day + '"'; 
	msgOut( 'MySQL', setQuery );
	client.query( setQuery, function( err, result, fields ){
		if( err ){
			msgOut( 'MySQL', err );
			throw err;
		} else {
			msgOut( 'MySQL', 'Ok, I have updated your carb count.' );
		}
	});
}

// --------------------------------------------------------------------------------------------
// HTTP Server Stuff
// --------------------------------------------------------------------------------------------

/** 
 * @brief Handle HTTP requests and craft/send a response
 * 
 * @param req	Requested url
 * @param res	Response
 * 
 * @return None
 */
function httpHandler (req, res){
  var theFile = url.parse(req.url).pathname;
  switch(theFile){
    case '/':
      theFile = '/index.html';
	  break;

    case '/phone.css':
      theFile = '/phone.css';
	  break;

    default:
      // figure out the MIME type
      var fileType = theFile.substr(-4);
      var mimeType = "text/";
      if (fileType == "html") { mimeType += "html"; }
      else if (fileType == ".css") { mimeType += "css"; }
      else { mimeType += "plain"; }


      // send the file
      // >> put this in a try-catch block to trap any fs errors and 404...
      try{
        msgOut( 'HTTP','sending file: ' + __dirname + theFile);
        // send the header
        res.writeHead(200, {'content-type': mimeType });
        res.write(fs.readFileSync(__dirname + theFile));
      } 
      catch (e) {
        msgOut( 'Error','Error: ' + e);
        // send the header
        res.writeHead(404, {'content-type': 'text/html' });
        res.write(fs.readFileSync(__dirname + '/error.html'));
        res.write('<p>The file "'+ theFile +'" was not found.</p>');
        res.write('</body></html>');
      }

      break;
  }
  res.end();

};

// --------------------------------------------------------------------------------------------
// socket.io communication handlers
// --------------------------------------------------------------------------------------------

/** 
 * @brief Handle all socket calls from the client
 * 
 * @param 'connection' Specify connection event
 * @param The embedded function to handle specific messages
 */
io.sockets.on( 'connection', function( socket ){
	// 
	msgOut( 'socket.io','Received connection on the socket...');
	// grab today's carb count from the database
	grabCarbs( getMySQLdate(), socket );
	

	socket.on( 'status', function( data ){
		msgOut( 'socket.io','Status from client: ' + data );
	});

	socket.on( 'updateCarbs', function( data ){
		msgOut( 'socket.io', 'New carb count: ' + data );
		setCarbs( getMySQLdate(), data, socket );
	});

	socket.on( 'disconnect', function(){
		msgOut( 'socket.io', 'Client disconnected.' );
	});

});


// --------------------------------------------------------------------------------------------
// Server Instantiation
// --------------------------------------------------------------------------------------------
app.listen( serverPort, serverUrl );
msgOut( 'internal', 'Node server running on ' + serverUrl + ':' + serverPort );
