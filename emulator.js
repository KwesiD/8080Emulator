

const opcodeTable = JSON.parse(fs.readFileSync('./opcodes.json', 'utf8')); //loads opcode table

//a table containing conversions from single letter register names to registerpairs
const registerPairTable = {"B":'B C','D':'D E','H':'H L','SP':'SP', 'PC':'PC'};

//State object constructor
function EmulatorState(){
	//registers
	//let a,b,c,d,e,h,l;
	this.A = null;
	this.B = null;
	this.C = null;
	this.D = null;
	this.E = null;
	this.H = null;
	this.L = null;
	//register pairs
	// this.bc = null;
	// this.de = null;
	// this.hl = null;

	//program counter
	this.PC = null;
	//stack pointer
	this.SP = null;
	//memory location
	this.memLoc = null;
	//flags
	this.Z = null;
	this.S = null;
	this.P = null;
	this.AC = null;
	this.CY = null;

	//Updates register pairs or stack pointer/program counter
	//pair is a single string that is mapped in the registerPairTable.
	//Bytes is an array of 0,1,or 2 bytes as strings
	this.updatePair = (pair,bytes) => {
		pair = registerPairTable[pair].split(' ');
		if(pair.length === 1){ //stack pointer or program counter
			if(pair[0] === 'SP'){
				this.SP = bytes[1] + bytes[0];
			}
			else{ //pair equal to PC
				this.PC = bytes[1] + bytes[0];
			}
		}
		else{ //if register pair
			this[pair[0]] = bytes[1];
			this[pair[1]] = bytes[0];
		}

	};

}


/**
Executes the opcode passed into this function to update the current state
Opcode is a hex encoded opcode (like 0xc3)
Bytes is an array of 0,1, or 2  bytes.
State is an object with the current emulator state
**/
function executeOpcode(opcode,bytes,state){
	let code = opcodeTable[opcode];
	let type,params;
	[type,params] = getOpcodeType(code.name);
	switch(type){
		case 'NOP': //do nothing
			break;

		case 'LXI':
			state.updatePair(params[0],bytes);
			break;


		case 'STAX':
			state.updatePair(params[0],bytes);
			break;

		case 'INX':


		case 
	}


	/*switch(code.name){
		case '00': //NOP. Does nothing
			break;
		case '01': //LXI B,D16
			state.c = params[0];
			state.b = params[1];
			break;
		case '02': //STAX B
			state.bc = a;
			break;
		case '03': //INX B
			state.bc++; //increment bc
			break;
		case '04': //INR B
			let temp = state.b; //the previous state
			state.b++; //increment B
			setFlags(code,temp,state.b,state);
			break;
		case '05': //DCR B
			let temp = state.b; //the previous state
			state.b--; //decrement B
			setFlags(code,temp,state.b,state);
			break;
		case '06': //MVI
			state.b = params[1];
			break;
		case '07':*/










	}
}


/**
Sets the flags for the current state.
Opcode is the object with the values for its name,
flag list, and size.
prev and result are the previous and current results of
the operation that called this function.
**/
function setFlags(opcode,prev,result,state){
	for(flag in opcode.flags){
		switch(flag){
			case 'Z':
				if(result === 0){
					state.z = true;
				}
				break;
			case 'S':

		}
	}
}

/**
Returns the type of the code (LXI, ADD, STAX, etc)
and the params (B, D, SP, etc)
op code is the name of the opcode as a string ("LXI B,D16")
**/
function getOpcodeType(opcode){
	let codeInfo = opcode.split(" ");
	let type = codeInfo[0];
	let params = codeInfo[1].split(" ");
	params = params.map((element){
		return element.trim();
	});
	return [type,params];
}


/**
Adds to hex values,looping back to 0 if it exceeds
the max value. 
Ie:  0xFFFF + 1 = 0x0000
Returns the value as a string
**/
function addToHex(hex,increment){
	let temp = hex;
	increment = Number(increment);
	hex = Number(hex);

	hex += increment; //increment hex
	if(hex.toString('16').length > temp.length){
			
	}
	else{
		return hex.toString('16');
	}


}


/**
Adds to register pairs
**/
function addToRP(){
	let pair = registerPairTable[registerpair].split(' ');
	if(pair.length === 1){
		addToPCSP(pair,increment,state);
	}
	else{
		
	}
}


/**
Adds values to the stackpointer or 
program counter.
**/
function addToPCSP(){

}