
const fs = require('fs')
const express = require('express');
const http = require('http');
const path = require("path");
const bodyParser = require('body-parser');
const app = express();
const publicPath = path.resolve(__dirname, "public");
const server = http.createServer(app);
const io = require('socket.io')(server);


app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(publicPath));




app.get('/',function(req,res){
	res.sendFile(path.join(__dirname, '/public','site.html'));
});


io.on('connection',function connection(socket) {
	console.log('connected');
	socket.emit('private',{msg: 'You\'re connected!'});
	socket.on('private',(data) => {
		console.log(data);
	});

});

let count = 0;
while(true){
	count++;
}
server.listen(3000);