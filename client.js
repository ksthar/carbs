/** 
 * @file app.js
 * @brief This is the client-side "app" for the Carb Counter
 * 				This file is loaded by index.html which also sets up
 * 				the basic UI elements.
 * @author Harlan Shoop
 * @version 0.1
 * @date 2014-09-12
 */

// --------------------------------------------------------------------------------------------
// Variables
// --------------------------------------------------------------------------------------------
//
var maxCarbs = 20;											/**< Daily maximum carbs		*/
var serverUrl = "http://23.253.151.132";					/**< URL of server					*/
var serverPort = "8081";									/**< Port to connect to			*/

// --------------------------------------------------------------------------------------------
/** 
 * @brief Creates a time stamp
 * 
 * @return timeString containing the time stamp
 */
// --------------------------------------------------------------------------------------------
function getTime() {
		var dateTime = new Date();
		var hrs = dateTime.getHours().toString();
		var min = dateTime.getMinutes().toString();
		var sec = dateTime.getSeconds().toString();
		if (hrs.length < 2) hrs = "0" + hrs;
		if (min.length < 2) min = "0" + min;
		if (sec.length < 2) sec = "0" + sec;
		var timeString = hrs + ":" + min + ":" + sec;
		return timeString;
}

// --------------------------------------------------------------------------------------------
/** 
 * @brief Create a date stamp including the weekday
 * 
 * @return dateString containing date stamp
 */
// --------------------------------------------------------------------------------------------
function getDate() {
	var weekDays = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
	var dateTime = new Date();
	var day 	= dateTime.getDate().toString();
	var mo = dateTime.getMonth() + 1;
	var month = mo.toString();
	var year	= dateTime.getFullYear().toString();
	var dow 	= weekDays[ dateTime.getDay() ];
	var dateString = dow + ", " + month + "/" + day + "/" + year;
	return dateString;
}

// --------------------------------------------------------------------------------------------
/** 
 * @brief Change color to alert user if carbs are above some level (maxCarbs)
 * 
 * @param carbs Current daily carb intake
 * 
 * @return None
 */
// --------------------------------------------------------------------------------------------
function checkCarbs( carbs ){
	if( carbs > maxCarbs ) {
		$( 'body' ).css( { 'background-color' : 'red' } );
	} else {
		$( 'body' ).css( { 'background-color' : 'white' } );
	}
}

// --------------------------------------------------------------------------------------------
/** 
 * @brief Document ready function to setup page and socket handlers
 * 
 */
// --------------------------------------------------------------------------------------------
$( document ).ready( function(){
	var socket = io.connect( serverUrl + ":" + serverPort );

	var today = getDate();
	$( '#header' ).append( '<div>' + today + '</div>' );
	$( '#spinner' ).val( '0' );

	socket.on( 'connect', function( data ){
		socket.emit( 'status', 'Ok, I am connected' );
	});

	socket.on( 'carbs', function( data ){
		socket.emit( 'status', 'I see I have ' + data + ' carbs' );
		$( '#spinner' ).val( data );
		checkCarbs( data );
	});


	$( '#spinner' ).on( 'spinchange', function(){
		var carbs = $( '#spinner' ).spinner( 'value' );
		socket.emit( 'updateCarbs', carbs );
		checkCarbs( carbs );
	});

});

