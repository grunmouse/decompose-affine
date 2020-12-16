const fs = require("fs");

function getObject(source, keys){
	if(source.classes){
		return getObject(source.classes, keys);
	}
	
	if(keys.length === 0){
		return source;
	}
	
	let key = keys[0], next = keys.slice(1);
	
	return getObject(source[key], next);
}

function isIterable(obj){
	return typeof obj !== 'string' && obj[Symbol.iterator] && obj[Symbol.iterator].call;
}

function * flatmap(iterable, callback){
	for(let val of iterable){

		let result = callback(val);
		
		if(isIterable(result)){
			yield * result;
		}
		else{
			yield result;
		}
	}
}

function replacer(substr, replacement, dolog){
	if(Array.isArray(substr)){
		substr = new RegExp(" (?:" + substr.join("|") + ") ");
	}
	else{
		substr = untrim(substr);
	};
	if(!Array.isArray(replacement)){
		replacement = [replacement];
	}
	
	replacement = replacement.map(untrim);

	return function(str){
		let newstr = replacement.map(repl => str.replace(substr, repl));
		
		if(dolog){
			console.log(str, newstr);
		}
		
		return newstr;
	}
}

function convertClasses(root, rule){
	//console.log(rule);
	let source = getObject(root, rule.base);
	var dolog;
	if(rule.base[0]==='S Sx|Sy'){
		//dolog = true;
	}
	
	let substr = rule.convert[1], replacement = rule.convert[0];

	return flatmap(readClasses(source, root), replacer(substr, replacement, dolog));
}

function untrim(str){
	let res = (isIterable(str) ? ["", ...str, ""] : ["", str, ""]).join(" ");
	return res;
}

function * readClasses(data, root){
	root = root || data;
	
	if(Array.isArray(data)){
		yield * data.map(untrim);
		return;
	}
	
	if(data.classes){
		yield * readClasses(data.classes, root);
		return;
	}
	
	for(let [key, value] of Object.entries(data)){
		//console.log(key);
		if(value.convert){
			yield * convertClasses(root, value);
		}
		else if(typeof value === "object" && value != null){
			yield * readClasses(value, root);
		}
		
	}
	
}

module.exports = function(){
	let code = fs.readFileSync("classification.json", {encoding:"utf8"});
	let data = JSON.parse(code);

	return new Set(readClasses(data));
}