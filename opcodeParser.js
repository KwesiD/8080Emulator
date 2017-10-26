

const fs = require('fs');

function getOpcodes(){
	const codes = {}
	fs.readFile(__dirname + '/opcodes',(error,data) => {
		if(error){
			console.log(error);
		}
		else{
			data = (data+"").split('\n');
			for(let i = 0;i < data.length;i++){
				let line = data[i].split('\t');
				let [code,name,size,flag] = line; //destructures line to 4 variables
				code = code.substring(2,code.length+1);
				codes[code] = {'name':name,'size':size,'flag':flag};
			}
			codeString = JSON.stringify(codes);
			fs.writeFile("opcodes.json", codeString);
		}
	});
}


getOpcodes();

