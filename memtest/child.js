const { fork } = require('child_process');
const emulator = fork('memory.js');


let memory =  {};

memoryFile.on('data',(data) => {
	memory = data;
	process.send(memory);
});
