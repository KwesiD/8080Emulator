const fs = require('fs');

let my = (fs.readFileSync('myVidMem')+"").split('\n');
let std = (fs.readFileSync('standardVidMem')+"").split('\n');


my = my.filter((ele) => {
	return !(ele.trim() === "");
});

std = std.filter((ele) => {
	return !(ele.trim() === "");
});

if(my.length !== std.length){
	console.log(my.length,std.length);
	process.exit();
}
for(let i = 0;i < my.length;i++){
	if(my[i] !== std[i]){
		console.log(my[i],std[i]);
	}
}