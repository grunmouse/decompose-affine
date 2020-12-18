
const child_process = require('child_process');
const spawn = child_process.spawn;

const maxima_command = "E:\\maxima-5.43.2\\bin\\maxima.bat";
const maxima_keys = ["--very-quiet"];


/* maxima.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});
 */

//maxima.stdout.pause();

async function read(readStream){
	const chunks = [];
	for await (const chunk of readStream) {
		//console.log('chunk');
		chunks.push(chunk);
	}

	return Buffer.concat(chunks).toString();
}

const doEvents = ()=>(Promise.resolve());

const mac_path = "E:\\\\repo\\\\decompose-affine\\\\mac\\\\";

async function getTex(commands, options){
	const maxima = spawn(maxima_command, maxima_keys);

	maxima.stdin.write('load("matrix")$');
	maxima.stdin.write(`load("${mac_path}affine-split.mac")$`);
	maxima.stdin.write(`load("${mac_path}primitives.mac")$`);

	//maxima.stdin.write('print(%)$');
	
	for(let command of commands){
		//console.log(command);
		maxima.stdin.write(command + '$');
		maxima.stdin.write('tex(%)$');
	}

	maxima.stdin.write('quit()$');
	
	maxima.on('error', (code)=>{
		console.log('err ', err);
	});
	
	let code = await read(maxima.stdout);
	
	
	code = code.replace(/\\ifx\\endpmatrix\\undefined((?:[^\\]|\\(?!else))*)\\else((?:[^\\]|\\(?!fi))*)\\fi/g, '$2');
	//console.log(code);
	code = code.replace(/\{\\it\s+([^\s}]*)\s*\}(?:_\{(\d)\})?/g, '$1$2');
	code = code.replace(/\{\s*\{([^}]+)\}\s*\\over\s*\{([^}]+)\}\s*\}/g, '\\frac{$1}{$2}');
	code = code.replace(/\\[,;]/g, ' ');
	code = code.replace(/\\([_\-])/g, '$1');
	code = code.replace(/\\(sin|cos)\s+a/g, '\\$1\\alpha');
	
	code = code.replace(/_\{(\d)\}/g, '_$1');
	
	for(let i=0; i<3; ++i){
		code = code.replace(/(\\(?:sin|cos)\\alpha(?:_\d)?)\s+([shdab][_\a-z\d]*)/g, function(str, sin, v){
			return v + ' ' + sin;
		});
	}
	
	for(let i=0; i<2; ++i){
		code = code.replace(/(\S)([+\-=&]|\\(?:right|cr))/g, '$1 $2');
		code = code.replace(/([+\-=&]|\\left.)(\S)/g, '$1 $2');
	}
	
	code = code.replace(/(\\cr[ \t]*)(?![\n\r])/g, '$1\n');
	code = code.replace(/\\cr/g, '\\\\');
	code = code.replace(/\s+?[\r\n]/g, '\n');
	
	code = code.replace(/_([xy\d]{2,})/g, '_{$1}');
	
	if(options.displaystyle){
		code = code.replace(/\\frac/g, '\\displaystyle\\frac');
	}
	
	return code;
}

async function main(){
	
	let commands = [
		`'XSxRX = X_1.S_x.R.X_2`
	];
	
	let text = await getTex(commands, {displaystyle:true});
	
	console.log(text);
}

module.exports = {
	getTex
};
//main().catch(err=>console.log(err.stack));