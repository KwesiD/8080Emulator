//const { fork } = require('child_process');
const cluster = require('cluster');

if(cluster.isMaster){
	cluster.fork(); //express app
	cluster.fork();	//emulator
}
else if(cluster.worker.id === 1){
	////////

	const fs = require('fs')
	const express = require('express');
	const http = require('http');
	const path = require("path");
	const bodyParser = require('body-parser');
	const app = express();
	const publicPath = path.resolve(__dirname, "public");
	const server = http.createServer(app);
	const io = require('socket.io')(server);
	////////

	app.set('view engine', 'hbs');
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(express.static(publicPath));




	app.get('/',function(req,res){
		res.sendFile(path.join(__dirname, '/public','site.html'));
	});


	io.on('connection',function connection(socket) {
		console.log('connected');
		socket.emit('private','You\'re connected!');
		socket.on('private',(data) => {
			//console.log(data);
			if(!data.msg){
				console.log("Server: " + data);
				sharedMem.store('keypress',data);
			}
		});

	});

	server.listen(3000);

}
else{

	///////
	const core = require('./emulator_core');
	const disassembler = require('./disassembler');
	const helpers = require('./parseHelpers');
	const state = new core.EmulatorState();
	const gameData = disassembler.startDisassembly();
	const readlineSync = require('readline-sync');
	///////

	state.loadGame(gameData); //loads game into memory

	let count = 0;
	let prevcount = 0;
	let steps = 0;

	while(Number("0x" + state.PC) < state.memory.length){

		//(d)ebug mode
		if(process.argv.indexOf('-d') !== -1){
			if(count-prevcount === steps){
				while(true){
					steps = readlineSync.question("How many steps?: ");
					if(Number(steps) !== NaN){
						steps = Number(steps);
						prevcount = count;
						break;
					}

				}
			}
		}

		let temppc = Number('0x' + state.PC);
		let opcode;
		let bytes;
	
		try{
			[opcode,bytes] = helpers.parseInstructions(state.gameFile[Number("0x" + state.PC)]);
		}
		catch(e){
			console.log(e);
			console.log('\n\nERROR: ' + state.gameFile[Number("0x" + state.PC)],state.toString());
			process.exit();
		}
		try{
			//keypress(state);
			core.executeOpcode(opcode,bytes,state);
		}
		catch(e){
			console.log(e);
			console.log('\n\nERROR: ' + opcode,bytes,'\t',state.gameFile[Number("0x" + state.PC)]);
			
			//(c)ontinue even if unimplemented
			if(process.argv.indexOf('-c') === -1){
				process.exit();
			}
		}

		count++;
		//(l)og out info
		if(process.argv.indexOf('-l') !== -1){
			console.log(opcode,bytes,'\t',state.gameFile[temppc],state.toString(),'\n');
			console.log(count);
		}


	}
}