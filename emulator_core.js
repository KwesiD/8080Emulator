const fs = require('fs');
const opcodeTable = JSON.parse(fs.readFileSync('./opcodes.json', 'utf8')); //loads opcode table

//a table containing conversions from single letter register names to registerpairs
const registerPairTable = {"B":'B C','D':'D E','H':'H L','SP':'SP', 'PC':'PC','M':'H L'};

//State object constructor
function EmulatorState(){
	//registers
	//let a,b,c,d,e,h,l;
	this.A = '0000';
	this.B = '0000';
	this.C = '0000';
	this.D = '0000';
	this.E = '0000';
	this.H = '0000';
	this.L = '0000';


	//program counter
	this.PC = '0000';
	//stack pointer
	this.SP = '0000';
	//memory location
	this.memory = new Array(0xFFFF).fill('0000');//need to modify functions to resolve memory locations first
	//flags
	this.Z = false;
	this.S = false;
	this.P = false;
	this.AC = false;
	this.CY = false;


	//Maybe move this to a general function.....?

	//Updates register pairs or stack pointer/program counter
	//pair is a single string that is mapped in the registerPairTable.
	//Bytes is an array of 0,1,or 2 bytes as strings
	this.updatePair = (pair,bytes) => {
		//console.log(pair);
		console.log(bytes);
		pair = registerPairTable[pair].split(' ');
		if(pair.length === 1){ //stack pointer or program counter
			if(pair[0] === 'SP'){
				this.SP = bytes[1] + bytes[0];
			}
			else if (pair[0] === 'PC'){ //pair equal to PC
				this.PC = bytes[1] + bytes[0];
			}
			else{//memory Location
				//this.memLoc = bytes[1] + bytes[0];
			}
		}
		else{ //if register pair
			this[pair[0]] = bytes[1];
			this[pair[1]] = bytes[0];
		}

	};

	/**
	Loads game data into memory
	**/
	this.loadGame = (gameData) => {
		gameData.forEach((element) => {
			let index = element.split('\t')[0];
			this.memory[Number("0x" + index)] = element;
		});
/*
		for(let i = 0;i < gameData.length;i++){
			this.memory[i] = gameData[i];
		}*/
	};

	/**
	Gets the data from the memory pair
	**/
	this.getPair = (pair) => {
		pair = registerPairTable[pair].split(' ');
		if(pair.length === 1){ //stack pointer or program counter
			return this[pair[0]];
		}
		else{ //if register pair
			return this[pair[0]] + this[pair[1]];
		}
	};

	this.getMemory = (memLoc) => {
		return this.memory[Number(memLoc)];
	};

	this.setMemory = (memLoc,data) => {
		this.memory[Number(memLoc)] = data;
	};

	this.getPSW = () => {
		return "" + (+this.S) + (+this.Z) + '0' + (+this.AC) + '0' + (+this.P) + '1' + (+this.C); //the extra + converts bool to 1 or 0
	};

	this.setPSW = (psw) => {
		this.S = !!psw[0];
		this.Z = !!psw[1];
		this.AC = !!psw[3];
		this.P = !!psw[5];
		this.C = !!psw[7];
	};

	this.incrementPC = (increment) => {
		this.PC = (Number('0x' + this.PC) + increment).toString('16');
		//console.log("incremented by " + increment + " :" + this.PC)
	};

	this.toString = () => {
		let props = Object.getOwnPropertyNames(this);
		let string = "";
		props.forEach((prop) =>{
			if((prop === 'memory') || (typeof(this[prop]) === 'function')){
				return;
			}
			if(string !== ""){
				string += ",";
			}
			string += prop + ": " + this[prop];
		});
		string = "{" + string + "}";
		return string;
	};
}

/**
Executes the opcode passed into this function to update the current state
Opcode is a hex encoded opcode (like 0xc3)
Bytes is an array of 0,1, or 2  bytes.
State is an object with the current emulator state
**/
function executeOpcode(opcode,bytes,state){
	//console.log(opcode,bytes);
	let code = opcodeTable[opcode];
	let type,params;
	let result,adr;
	[type,params] = getOpcodeType(code.name);

	switch(type){
		case 'NOP': //do nothing
			state.incrementPC(Number(code.size));
			break;

		case 'LXI':
			state.updatePair(params[0],bytes);
			state.incrementPC(Number(code.size));
			break;

		case 'STAX':
			let memloc = state.getPair(params[0]);
			state.setMemory(memLoc,state.A);
			state.incrementPC(Number(code.size));
			break;

		case 'INX':
			addToRP(params[0],1,state);
			state.incrementPC(Number(code.size));
			break;

		case 'INR':
			result = addToReg(params[0],1,state,true);
			setFlags(code,result,state);
			state.incrementPC(Number(code.size));
			break;

		case 'DCR':
			result = addToReg(params[0],-1,state,true); //TODO: will adding negative numbers work? need to test if number falls below 0
			setFlags(code,result,state);
			state.incrementPC(Number(code.size));
			break;

		case 'MVI':
			//state.updatePair(params[0],bytes);
			state[params[0]] = bytes[0];
			state.incrementPC(Number(code.size));
			//state[params[0]] = bytes[0];
			break;

		case 'RLC':
			state.A = rotateLeft(state.A,state); //carries
			state.incrementPC(Number(code.size));
			break;

		case 'DAD': //always adds to HL pair //carries
			result = swap(splitBytes(addRegisterPairs('H',params[0],state)));
			state.updatePair('H',result);
			state.incrementPC(Number(code.size));
			break;
		
		case 'LDAX':
			let data = state.getMemory(state.getPair(params[0]));
			state.A = data;
			state.incrementPC(Number(code.size));
			break;
		
		case 'DCX':
			addToRP(params[0],-1,state,false);
			state.incrementPC(Number(code.size));
			break;

		case 'RRC':
			state.A = rotateRight(state.A,state); //carries
			state.incrementPC(Number(code.size));
			break;

		case 'STA':
			adr = bytes[1] + bytes[0]; //TODO: should these be swapped???
			state.setMemory(adr,state.A);
			state.incrementPC(Number(code.size));
			break;

		case 'LDA':
			adr = bytes[1] + bytes[0]; //TODO: should these be swapped???
			state.A = state.getMemory(adr);
			state.incrementPC(Number(code.size));
			break;

		case 'MOV':
			move(params[0],params[1],state);
			state.incrementPC(Number(code.size));
			break;

		case 'ANA':
			result = bitwiseReg('A',params[0],state,'and');
			setFlags(code,result,state);
			state.incrementPC(Number(code.size));
			break;

		case 'XRA':
			result = bitwiseReg('A',params[0],state,'xor');
			setFlags(code,result,state);
			state.incrementPC(Number(code.size));
			break;

		case 'ORA':
			result = bitwiseReg('A',params[0],state,'or');
			setFlags(code,result,state);
			state.incrementPC(Number(code.size));
			break;

		case 'DAA':
			DAA(state);
			state.incrementPC(Number(code.size));
			break;

		case'POP':
			stackPop(params[0],state);
			state.incrementPC(Number(code.size));
			break;
		
		case 'JNZ':
			if(!state.Z){
				state.PC = bytes[1] + bytes[0];
			}
			break;

		case 'JMP':
			state.PC = bytes[1] + bytes[0];
			break;

		case 'ADI':
			result = addToReg('A',bytes[0],state,true);
			setFlags(code,result,state);
			state.incrementPC(Number(code.size));
			break;

		case 'RET':
			ret(state);
			state.incrementPC(Number(code.size));
			break;

		case 'CALL':
			stackCall(state,bytes[1] + bytes[0]);
			//state.incrementPC(Number(code.size));
			break;

		case 'ANI':
			result = bitwiseReg('A',bytes[0],state,'and');
			setFlags(code,result,state);
			state.incrementPC(Number(code.size));
			break;

		case 'XCHG':
			exchange(state);
			state.incrementPC(Number(code.size));
			break;

		default:
			unimplemented(opcode,bytes,state);

	}
	
}

/**
Takes a pair of bytes in an array
and swaps them
**/
function swap(bytes){
	let temp = bytes[0];
	bytes[0] = bytes[1];
	bytes[1] = temp;
	return bytes;
}

/**
Takes 2 bytes in a string and splits them evenly.
Pads the original string first.
**/
function splitBytes(bytes){
	bytes = padBytes(bytes,2);
	let byte1 = bytes.substring(0,2);
	let byte2 = bytes.substring(2,4);
	return [byte1,byte2];

}

/**
Sets the flags for the current state.
Opcode is the object with the values for its name,
flag list, and size.
Result is the result of the operation that called this functon.
**/
function setFlags(opcode,result,state){
	for(flag in opcode.flags){
		switch(flag){
			case 'Z':
				if(Number(result) === 0){
					state.Z = true;
				}
				else{
					state.Z = false;
				}
				break;
			case 'S':
				if((Number("0x"+result) & 128) === 128){ //result & 10000000. the zeroes mask everything but the MSB
					state.S = true;
				} 
				else{
					state.S = false;
				}
				break;
			case 'P':
				state.P = checkParity(result);	
				break;


			//TODO: How to handle carry and a-carry. How to handle when 2 parts of the number are carried (high and low order)
			//When do we not touch the carry? do we set/reset always?


		}
	}
}

/**
Checks the parity of the bytes;
**/
function checkParity(hex){
	let bin = "";
	for(let i = 0;i < hex.length;i++){
		bin += padBytes(Number('0x' + hex[i]).toString('2'),2); 
	}
	let ones = 0;
	for(let i = 0;i < bin.length;i++){
		if(bin[i] === '1'){
			ones++;
		}
	}

	if(ones%2 === 0){
		return true; //set parity to even
	}
	else{
		return false; //set parity to odd
	}
}




/**
Returns the type of the code (LXI, ADD, STAX, etc)
and the params (B, D, SP, etc)
op code is the name of the opcode as a string ("LXI B,D16")
**/
function getOpcodeType(opcode){
	//console.log(opcode);
	let codeInfo = opcode.split(" ");
	let type = codeInfo[0];
	let params;
	if(codeInfo[1] !== undefined){
		params = codeInfo[1].split(",");

		params = params.map((element) => {
			return element.trim();//.replace(' ','');
		});
	}
	return [type,params];
}


/**
Adds to hex values,looping back to 0 if it exceeds
the max value. 
Ie:  0xFFFF + 1 = 0x0000
Returns the value as a string
**/
function addToHex(hex,increment,state=null,flagged=false){
	//let temp = Number(hex).toString('16'); //truncate the 0x prefix   //TODO: May not be necessary
	let size =  hex.length;
	let temp = hex;
	increment = Number(increment);
	hex = Number(hex);
	hex += increment; //increment hex
	//console.log(hex.toString('16').length);
	//console.log(temp.length);
	if(hex.toString('16').length > temp.length){
		hex = (increment - (Math.pow(16,hex.toString('16').length-1)-Number("0x"+temp))); //loops the number around //0x denotes hex during conversion
		if(flagged){
			state.CY = true; //sets carry
		}
	}
	else{
		if(flagged){
			state.CY = false; //resets carry
		}
	}
	
	return padBytes(hex.toString('16'),size);

}

/**
Add to single register
**/
function addToReg(register,increment,state,flagged=false){
	state[register] = addToHex(state[register],increment,state,flagged);
	return state[register];
}
/**
Adds to register pairs
**/
function addToRP(registerpair,increment,state,flagged=false){
	let pair = registerPairTable[registerpair].split(' ');
	if(pair.length === 1){
		addToPCSP(pair,increment,state,flagged); //register is PC or SP
	}
	else{
		let reg1 = pair[0];
		let reg2 = pair[1];
		state[reg1] = addToHex(state[reg1],increment,flagged); //only work on higher order register
		state[reg2] = addToHex(state[reg2],increment);
	}
}

/**
Adds Register pairs together. ie: HL + BC
Sets carry.
**/
function addRegisterPairs(pair1,pair2,state){
	pair1 = registerPairTable[pair1]; //gets the register pairs
	pair2 = registerPairTable[pair2];
	let reg1 = pair1[0] + pair1[1];
	let reg2 = pair2[0] + pair2[1];
	return addToHex(reg1,Number('0x' + reg2),state,true); //flagged for carry
}

/**
Adds values to the stackpointer or 
program counter.
**/
function addToPCSP(register,increment,state,flagged=false){
	let bytes = state[register];
	let byte1 = addToHex(bytes.substring(0,2),increment,state,flagged);//only work on higher order register
	let byte2 = addToHex(bytes.substring(2,4),increment);
	state[register] = byte1 + byte2;

}


/**
Pad the beginning of a byte or 2 bytes with zeroes.
Mul = multiplicity, either 1 or 2 (number of bytes).
Defaults to 1.
**/
function padBytes(bytes,mul=1){
	const pad = (2*mul) - (""+bytes.length); 
	for(let i = 0;i < pad;i++){
		bytes = "0" + bytes; 
	}
	return bytes;
}

/**
Rotates bits to the left.
Sets carry
**/
function rotateLeft(hex,state){
	let bits = (Number('0x' + hex)).toString('2');
	let lead = bits[0];
	bits = bits.substring(1,bits.length) + lead;
	state.CY = lead; //sets carry
	let num = Number('0b' + bits);
	return ""+num; //to string
}

/**
Rotates bits to the right.
Sets carry
**/
function rotateRight(hex,state){
	let bits = (Number('0x' + hex)).toString('2');
	let end = bits[bits.length-1];
	bits = end + bits.substring(0,bits.length-1);
	state.CY = end; //sets carry
	let num = Number('0b' + bits);
	return ""+num; //to string
}


/**
Special function for DAA
**/
function DAA(state){
	if(((state.A & 15) > 9) || state.AC === true){ //accumulator & 00001111
		addToReg('A',6,state);
		////TODO: If carry, then set aux, else reset
	}
	if(((state.A & 240) > 9) || state.CY === true){ //acc & 240
		addToReg('A',96,state); //?? most significant 4 bits incremented by 6. 01100000 (96) increments first 4  by 6? (6 = 0110)
		////TODO: If carry, then set regular carry, else do nothing
	}
}


/**
Returns an error when an unimplemented opcode is run.
**/
function unimplemented(opcode,bytes,state){
	console.log(opcode,bytes,state);
	throw "Error, unimplemented!!";
}

function move(loc1,loc2,state){
	if(loc1 === 'M'){
		state.setMemory(state.getPair('H'),state[loc2]);
	}
	else if(loc2 === 'M'){
		state[loc1] = state.getMemory(state.getPair('H'));
	}
	else{
		state[loc1] = state[loc2];
	}
}


/**
performs bitwise operations on 
registers based on operator variable
**/
function bitwiseReg(reg1,reg2,state,operator){
	let val;
	if(reg2 === 'M'){
		val = state.getMemory(state.getPair('H'));
	}
	else{
		val = state[reg2];
	}
	switch(operator){
		case 'and':
			state[reg1] &= val; break;
		case 'or':
			state[reg1] |= val; break;
		case 'xor':
			state[reg1] ^= val; break;
	}
	state.CY = false; //resets carry
	return state[reg1];
}

function bitwiseVal(reg,val,state,operator){
	val = Number(val);
	if(reg === 'M'){
		val = state.getMemory(state.getPair('H'));
	}
	else{
		val = state[reg];
	}
	switch(operator){
		case 'and':
			state[reg] &= val; break;
		case 'or':
			state[reg] |= val; break;
		case 'xor':
			state[reg] ^= val; break;
	}
	state.CY = false; //resets carry
	return state[reg];
}

function stackPop(pair,state){
	pair = registerPairTable[pair].split(' ');
	if(pair.length === 1 && pair[0] === 'PSW'){
		state.setPSW(state.getMemory(state.SP));
		state.SP++;
		state.A = state.getMemory(state.SP); 
		state.SP++;
	}
	else{
		state[pair[1]] = state.getMemory(state.SP);
		state.SP++;
		state[pair[0]] = state.getMemory(state.SP);
		state.SP++;
	}

}

function stackPush(pair,state){
	pair = registerPairTable[pair].split(' ');
	if(pair.length === 1 && pair[0] === 'PSW'){
		state.setMemory(state.SP,state.getPSW());
		state.SP--;
		state.setMemory(state.SP,state.A);
		state.SP--;
	}
	else{
		state.setMemory(state.SP,state[pair[1]]);
		state.SP--;
		state.setMemory(state.SP,state[pair[0]]);
		state.SP--;
	}
}

function stackCall(state,adr){
	let lo; //high and low order bits of PC
	let hi;
	[hi,lo] = splitBytes(state.PC);
	state.setMemory(state.SP-1,hi);
	state.setMemory(state.SP-2,lo);
	state.SP += 2;
	state.PC = adr;
}

function ret(state){
	state.PC = state.getMemory(state.SP+1) + state.getMemory(state.SP);
	state.SP += 2;
}


function exchange(state){
	let temp = state.H;
	state.H = state.D;
	state.D = temp;
	temp = state.L;
	state.L = state.E;
	state.E = temp;
}


//TODO: Implement OUT, EI, CPI

module.exports = {
	EmulatorState:EmulatorState,
	executeOpcode:executeOpcode
};