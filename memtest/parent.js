const { fork } = require('child_process');
const child = fork('child.js');

let memory;
child.on('data',(data) => {
	memory = data;
});


