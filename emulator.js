const core = require('./emulator_core');
const disassembler = require('./disassembler');
const helpers = require('./parseHelpers');
const state = new core.EmulatorState();
const gameData = disassembler.startDisassembly();

const readline = require('readline'); //for debugging

state.loadGame(gameData); //loads game into memoory

while(Number("0x" + state.PC) < state.memory.length){
/*	console.log(Number("0x" + state.PC));
	console.log(gameData.length);
	console.log(state.memory[Number("0x" + state.PC)]);*/
	let temppc = Number('0x' + state.PC);
	[opcode,bytes] = helpers.parseInstructions(state.memory[Number("0x" + state.PC)]);
	try{
		core.executeOpcode(opcode,bytes,state);
	}
	catch(e){
		console.log(e);
		console.log('\n\nERROR: ' + opcode,bytes,'\t',state.memory[Number("0x" + state.PC)]);
		process.exit();
	}
	console.log(opcode,bytes,'\t',state.memory[temppc],state.toString(),'\n');




}

