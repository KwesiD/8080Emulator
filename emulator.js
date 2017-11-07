const core = require('./emulator_core');
const disassembler = require('./disassembler');
const helpers = require('./parseHelpers');
const state = new core.EmulatorState();
const gameData = disassembler.startDisassembly();
const readlineSync = require('readline-sync');
const child = require('child_process');

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
		let val = child.execSync('a.exe') + "";
		if(val){
			console.log(val);
		}
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


function getKeys(state){


		/*switch(event.keychar){
			console.log()
		}
		state.inputPorts[0] |= 32; //00100000*/

}

