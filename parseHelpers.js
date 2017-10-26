


/**
Splits hex data into bytes (Every 2 characters);
**/
function splitBytes(hex){
	const bytes = [];
	if((hex.length%2) !== 0){
		throw "Hex data has odd-numbered length. Invalid data file!!"; 
	}
	for(let i = 0;i < hex.length;i+=2){
		let token = hex[i] + hex[i+1];
		bytes.push(token);
	}
	return bytes;

}


module.exports = {
	splitBytes:splitBytes
};