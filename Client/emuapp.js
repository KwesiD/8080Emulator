 
const fs = require('fs')
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require("path");
const bodyParser = require('body-parser');
const app = express();
const publicPath = path.resolve(__dirname, "public");

const server = http.createServer(app);
const socketServer = new WebSocket.Server({server});

app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(publicPath));



/*
app.get('/',function(req,res){
	res.sendFile(path.join(__dirname, '/public','site.html'));
});
*/

socketServer.on('connection',function connection(socket,req) {
	console.log('connected');
	socket.on('message',function incoming(message){
		console.log(message);
		socket.send('something');

	});

	socket.send("Yo");

	

});


server.listen(3000);