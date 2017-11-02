const core = require('./emulator_core');
const disassembler = require('./disassembler');
const helpers = require('./parseHelpers');
const state = new core.EmulatorState();
const gameData = disassembler.startDisassembly();

const readline = require('readline'); //for debugging

state.loadGame(gameData); //loads game into memoory

let count = 0;
while(Number("0x" + state.PC) < state.memory.length){
/*	console.log(Number("0x" + state.PC));
	console.log(gameData.length);
	console.log(state.memory[Number("0x" + state.PC)]);*/
	let temppc = Number('0x' + state.PC);
	let opcode;
	let bytes;
	try{
		[opcode,bytes] = helpers.parseInstructions(state.gameFile[Number("0x" + state.PC)]);
	}
	catch(e){
		console.log(e);
		console.log('\n\nERROR: ' + state.gameFile[Number("0x" + state.PC)],state.PC);
		process.exit();
	}
	try{
		core.executeOpcode(opcode,bytes,state);
	}
	catch(e){
		console.log(e);
		console.log('\n\nERROR: ' + opcode,bytes,'\t',state.gameFile[Number("0x" + state.PC)]);
		process.exit();
	}
	console.log(opcode,bytes,'\t',state.gameFile[temppc],state.toString(),'\n');
	if(opcode === 'c9'){
		//process.exit();
	}
		/*if(count >= 22){
		process.exit();
	}
	count++;*/
	//console.log(state.memory[0x1b01] + ">>");
	/*count++;
	console.log(count);
*/

}

