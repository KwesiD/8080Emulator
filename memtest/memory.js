const memory = {}

process.on('data',(data) => {
	console.log(data + "mem");
	memory[data.key] = data.val;
	process.send(memory);
});

