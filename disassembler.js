

const buffer = require('buffer');
const helpers = require('./parseHelpers'); //loads helper methods
const fs = require('fs');

console.log("Loading OpCodes");
const opcodeTable = JSON.parse(fs.readFileSync('./opcodes.json', 'utf8')); //loads opcode table

console.log("Loading game rom");
if(process.argv.length < 3){
	throw "No file found!";
}
const data = fs.readFileSync(__dirname + "/" + process.argv[2]);
let hex = (new Buffer(data,'utf8')).toString('hex');
hex = helpers.splitBytes(hex); //parse data to array of bytes
const dump = disassemble(hex);  //disassemble file

function disassemble(hexdump){
	console.log('Disassembling file');
	let disassembledDump = ""; 
	for(let i = 0;i < hexdump.length;i++){
		let ele = hexdump[i]; //current element
		let temp = i + "\t" + ele + "\t";
		switch(parseInt(opcodeTable[ele].size)){
			case 1:
				temp += opcodeTable[ele].name + "\n";
				break;
			case 2:
				temp += hexdump[i+1] + "\t" +  opcodeTable[ele].name + " " + hexdump[i+1] + '\n';
				i += 1; //increment i by 1 to skip the next index
				break;
			case 3:
				temp += hexdump[i+1] + " " + hexdump[i+2] + "\t" + opcodeTable[ele].name + " " + hexdump[i+2] + "" + hexdump[i+1] + '\n';
				i += 2; //increment i by 2 to skip the next 2 indices
				break;
		}
		disassembledDump += temp;
	}
	console.log("Saving disassembly....");
	fs.writeFile('dump.disassembled',disassembledDump,(error) => {
		if(error){
			console.log(error);
			throw "Error saving file!";
		}
		console.log("File saved!");
	});
	return disassembledDump;
	
}

