

process.on('message',function(data){
	console.log("Emu:  " + data);
	test();
});

test();




function test(){
	let time = new Date().getTime() + 5000;
	while(time >  new Date().getTime()){
		try{
			err();
		}
		catch(e){
			break;
		}
	}

	console.log('broke');

}


function err(){
	throw 'uh';
}