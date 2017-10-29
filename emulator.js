

const opcodeTable = JSON.parse(fs.readFileSync('./opcodes.json', 'utf8')); //loads opcode table

//a table containing conversions from single letter register names to registerpairs
const registerPairTable = {"B":'B C','D':'D E','H':'H L','SP':'SP', 'PC':'PC','M':'memLoc'};

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
	this.memLoc = '0000'; //need to modify functions to resolve memory locations first
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
			addToRP(params[0],1,state);
			break;
		case 'INR':
			let result = addToReg(params[0],1,state,true);
			setFlags(code,result,state);
			break;
		case 'DCR':
			let result = addToReg(params[0],-1,state,true); //will adding negative numbers work? need to test if number falls below 0
			setFlags(code,result,state);
			break;
		case 'MVI':
			state[params[0]] = bytes[0];
			break;
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
			state.C = true; //sets carry
		}
	}
	else{
		if(flagged){
			state.C = false; //resets carry
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


