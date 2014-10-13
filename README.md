# CARB COUNTER

Simple web app using nodejs to keep track of daily carb intake.  I use this as a starting point for nodejs/MySQL/socket.io applications.  Use latest node, the 0.6.x version that comes with Ubuntu 12.04 ain't gonna cut it. Make sure you have build-essentials installed. 

	git clone https://github.com/joyent/node.git

## Structure

- _web-server.js_ Nodejs server, saves carbs in MySQL database, customize by changing: IP, port, MySQL username, and MySQL password
- _app.js_ Client-side app; REMEMBER to change the IP and port to match the server!

## Database
App was designed for a MySQL database, and uses the mysql module.

### Schema:
Extremely simple schema.  App demonstrates INSERT and UPDATE functions.

	+-------+-------------+------+-----+---------+-------+
	| Field | Type        | Null | Key | Default | Extra |
	+-------+-------------+------+-----+---------+-------+
	| day   | varchar(10) | YES  |     | NULL    |       |
	| carbs | int(11)     | YES  |     | NULL    |       |
	+-------+-------------+------+-----+---------+-------+


