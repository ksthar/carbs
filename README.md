# CARB COUNTER

Simple web app using node.js to keep track of daily carb intake.  Use latest node, the 0.6.x version that comes with Ubuntu 12.04 ain't gonna cut it. Make sure you have build-essentials installed. 
    git clone https://github.com/joyent/node.git

## Structure

- _web-server.js_ Node.js server, saves carbs in MySQL database, customize by changing: IP, port, MySQL username, and MySQL password
- _app.js_ Client-side app; REMEMBER to change the IP and port to match the server!

## Database
- MySQL database
- Schema:

    +-------+-------------+------+-----+---------+-------+
    | Field | Type        | Null | Key | Default | Extra |
    +-------+-------------+------+-----+---------+-------+
    | day   | varchar(10) | YES  |     | NULL    |       |
    | carbs | int(11)     | YES  |     | NULL    |       |
    +-------+-------------+------+-----+---------+-------+

