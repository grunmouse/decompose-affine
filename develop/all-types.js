
const Matrix = require('../matrix.js');

const {
	keys,
	Compose
} = require('../compose.js');

const{
	MapOfSet,
	TypedMap
} = require('@grunmouse/special-map');

function isIterable(obj){
	return typeof obj !== 'string' && obj[Symbol.iterator] && obj[Symbol.iterator].call;
}

function untrim(str){
	let res = (isIterable(str) ? ["", ...str, ""] : ["", str, ""]).join(" ");
	return res;
}

const Map2OfSet = TypedMap(MapOfSet, []);
const Map3OfSet = TypedMap(Map2OfSet, []);
const Map4OfSet = TypedMap(Map3OfSet, []);


Compose.prototype.calc = function(){
	let types = this.type();

	let mat = types.map(t=>Matrix.factory(t, {}));
	
	return mat.reduceRight((akk, m, i)=>{
		let n = m.mul(akk[0]);
		return [n].concat(akk);
	}, [Matrix.E()]);
}

function * genNext(comp){
	if(comp){
		for(let p of keys){
			if(comp.allowPush(p)){
				yield comp.compose(p);
			}
		}
	}
	else{
		for(let p of keys){
			yield new Compose(p);
		}		
	}
}

function genAll(){
	//const NotDecomposable = new Set();
	//const InfiniteValued = new Set();
	
	function *recursive(comp){
		if(comp && comp.length>4){
			throw new Error('Oversized');
		}
		for(let item of genNext(comp)){
			let M = item.calc();
			//console.log(M[0]);
			if(M.some(a=>a.isNotDecomposable)){
				//NotDecomposable.add(item.typeString());
				//console.log(item.typeString());
			}
			else{
				yield item;
				
				if(M[0].varCount < 4){
					yield * recursive(item);
				}
			}
		}
	}
	
	return recursive();
}


function untypedFrom(map, callback){
	return new Map(Array.from([...map.entries()], callback));
}

function untypedRecursive(map){
	if(map instanceof Map){
		let result = new Map();
		for(let [key, val] of map.entries()){
			result.set(key, untypedRecursive(val));
		}
		return result;
	}
	return map;
}

function classify(map, key, callback){
	let source = map.get(key);
	let result = callback(source, key);
	result = untypedRecursive(result);
	map.set(key, result);
}


function classByReducibility(alter){
	alter = alter || (()=>('normal'));
	return (set)=>{
		let map = new MapOfSet();
		for(let item of set){
			let c = item.reducibilityToS();
			if(c){
				map.add(c[0].typeString() + '=> S ', item);
			}
			else{
				let key = alter(item);
				map.add(key, item);
			}
		}
		return map;
	}
}


function printTree(map, level=0){
	const tab = '\t'.repeat(level);
	if(map instanceof Map){
		for(let [key, value] of map.entries()){
			console.log( tab + key);
			printTree(value, level+1);
		}
	}
	else if(map instanceof Set){
		for(let str of map){
			console.log( tab + str);
		}
	}
}

function classMap(map, alters){
	for(let key of map.keys()){
		classify(map, key, classByReducibility(alters[key]));
	}
}




//throw new Error('stop');
//============

var classing = new Map2OfSet();

for(let item of genAll()){
	classing
		.get(item.varCount())
		.get(item.detComponents().typeString())
		.add(item)
}

classing = untypedRecursive(classing);

const classed = require('./read-classing.js')();

classMap(classing.get(4), 
	{
		' S ': (item)=>{
			let nodet = item.nodetComponents();
			
			let type = nodet.type().sort();
			
			return untrim(type);
			
		},
		' s ': (item)=>{
			let nodet = item.nodetComponents();
			
			let type = nodet.type().sort();
			
			let R = type.reduce((akk, t)=>(akk + (t==='R')), 0);
			
			return 'R'.repeat(R) || 'XY';
			
		},
		
		' Sx ': (item)=>{
			let brkt = item.bracketComponents().type();
			
			if(brkt.includes('Sx')){
				return 'Sx * * * , * * * Sx';
			}
			
			return 'other';
		},
		
		' Sy ': (item)=>{
			let brkt = item.bracketComponents().type();
			console.log(brkt);
			if(brkt.includes('Sy')){
				return 'Sy * * * , * * * Sy';
			}
			
			return 'other';
		}
	}
);
classMap(classing.get(3), 
	{
		
	}
);


printTree(classing.get(4));

