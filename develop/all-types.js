
const Matrix = require('../matrix.js');

const {
	keys,
	Compose
} = require('../compose.js');

const{
	MapOfSet,
	TypedMap
} = require('@grunmouse/special-map');

const {
	getTex
} = require('./maxima.js');

const convertIndex = (el)=>{
	let name = el[0];
	let b = el.slice(1);
	if(b){
		name += '_' + b;
		//console.log(name);
	}
	return name;
};

async function makeMD(set){
	printTree(set);
	
	let commands = [...set].map((item)=>{
		let name = "'" + item.type().map(convertIndex).join("");
		let equation = item.map(a=>a.name).map(convertIndex).join('.');
		
		equation = equation.replace(/^s\.'/, 's*');
		
		return `${name} = ${equation}`;
	});
	
	let code = await getTex(commands, {displaystyle:true});
	
	await require('fs').promises.writeFile('sample.md', code);
}

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
	item.enumerate();
	classing
		.get(item.varCount())
		.get(item.detComponents().typeString())
		.add(item)
}

classing = untypedRecursive(classing);

const classed = require('./read-classing.js')();

const sx_sy = (item)=>{
	let nodet = item.nodetComponents();
	
	let type = item.type();
	
	let R = type.reduce((akk, t)=>(akk + (t==='R')), 0);
	
	if(R === 0){
		return 'XY';
	}
	
	return 'other';
};

classMap(classing.get(4), 
	{
		' S ': (item)=>{
			
			let type = item.type();
			
			let R = type.reduce((akk, t)=>(akk + (t==='R')), 0);
			
			if(R === 0){
				return ' X Y ';
			}
			else if(R === 1){
				if(type.includes('D')){
					return ' D R ';
				}

				if(type.indexOf('R') === 1){
					return ' * R * ';
				}
				else{
					return ' R * * , * * R ';
				}
			}
			
			return untrim(type);
			
		},
		' s ': (item)=>{
			let nodet = item.nodetComponents();
			
			let type = nodet.type();
			
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
			if(brkt.includes('Sy')){
				return 'Sy * * * , * * * Sy';
			}
			
			return 'other';
		},
		
		' Sx Sx ':sx_sy,
		' Sx Sy ':sx_sy,
		' Sy Sy ':sx_sy
	}
);
classMap(classing.get(3), 
	{
		" ": (item)=>{
			let type = item.type();
			
			let R = type.reduce((akk, t)=>(akk + (t==='R')), 0);
			
			let D = type.reduce((akk, t)=>(akk + (t==='D')), 0);
			
			let code = ('R'.repeat(R) + 'D'.repeat(D)).split('');
			
			if(code.length<2){
				code.push('XY');
			}
			else if(code.length === 2){
				code.push('X|Y');
			}
			
			return code.join(' ');
			
		}
	}
);

const classingByPosR =(items)=>{
	let map = new MapOfSet();
	for(let item of items){
		if(item[1].type === 'R'){
			map.add('* R *', item);
		}
		else{
			map.add('R * * , * * R', item)
		}
	}
	return map;
}

classify(classing.get(3).get(' '), 'R D X|Y', classingByPosR);
classify(classing.get(3).get(' '), 'R XY', classingByPosR);

//Три матрицы $S_x$, $S_y$ (одна из них входит дважды) - всегда допускает замену $S_x S_y = S$
classing.get(4).delete(' Sx Sx Sy ');
classing.get(4).delete(' Sx Sy Sy ');

//Скаляр $s$ и матрица $S_x$ или $S_y$ - допускает замену $s S_x = S$ или $s S_y = S$
classing.get(4).delete(' Sy s ');
classing.get(4).delete(' Sx s ');

//Скаляр $s$ и две матрицы $S_x$, $S_y$ (возможно однотипные) - допускает замену $s S_x = S$ или $s S_y = S$
classing.get(4).delete(' Sx Sx s ');
classing.get(4).delete(' Sx Sy s ');
classing.get(4).delete(' Sy Sy s ');

//classing\s_m.tex Перечислено
classing.get(4).delete(' s ');

//classing\s.tex Перечислено
classing.get(4).delete(' S ');

//classing\s_sx.tex Перечислено
classing.get(4).delete(' S Sx ');
classing.get(4).delete(' S Sy ');

//one-det\group-xy.tex Описано
//classing.get(3).get(' ').delete('XY');
//one-det\group-dxy.tex Описано
//classing.get(3).get(' ').delete('D XY');
//one-det\group-rxy-1
//one-det\group-rxy-2
//one-det\group-rxy-3 Описано
//classing.get(3).get(' ').delete('R XY');
//one-det\group-rdd Описано
//classing.get(3).get(' ').delete('R D D');
//one-det\group-rrd Описано
//classing.get(3).get(' ').delete('R R D');
//one-det\group-rrxy Описано
//classing.get(3).get(' ').delete('R R X|Y');
//one-det\group-rdxy-1 Описано
//one-det\group-rdxy-2 Описано
//classing.get(3).get(' ').delete('R D X|Y');

printTree(classing.get(4));


//makeMD(classing.get(3).get(' ').get('R D X|Y').get('R * * , * * R')).catch(err=>console.log(err.stack));
