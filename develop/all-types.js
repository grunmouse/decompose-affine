
const colors = require('colors');

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

async function doMaxima(set){
	
	let array = [...set];
	
	let commands = array.map((item)=>{
		let name = "'" + item.type().map(convertIndex).join("");
		let equation = item.map(a=>a.name).map(convertIndex).join('.');
		
		equation = equation.replace(/^s\.'/, 's*');
		
		return `${name} = ${equation}, trigreduce, trigsimp`;
	});
	
	let code = await getTex(commands, {displaystyle:true, inline:true, angle:true});
	
	
	let eq = code.split(/\$\$\s*\$\$/g);
	
	
	let arr = array.map((item, i)=>([item, eq[i].replace(/\$\$/,'')]));
	
	return [code, arr];
}

async function makeMD(set){
	printTree(set);
	let [code, arr] = await doMaxima(set);
	await require('fs').promises.writeFile('sample.md', code);
	
	return arr;
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

const classingByCountRD = (item)=>{
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
	
};

const classingByPosR =(items)=>{
	let map = new MapOfSet();
	for(let item of items){
		if(item.bracketComponents().type().includes('R')){
			map.add('R * , * R', item)
		}
		else{
			map.add('* R *', item);
		}
	}
	return map;
}


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
	
	if(R === 1){
		return 'R'
	}
	
	return 'other';
};

classMap(classing.get(4), 
	{
		' S ': classingByCountRD,
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
		
		' Sx Sx ':classingByCountRD,
		' Sx Sy ':classingByCountRD,
		' Sy Sy ':classingByCountRD
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
			
		},
		
		" S " :(item)=>{
			if(item.isTriangle()){
				return 'triangle';
			}
			
			return 'other';
		}		,
		" Sx Sy " :(item)=>{
			if(item.isTriangle()){
				return 'triangle';
			}
			
			return 'other';
		}
	}
);


function intersect(s1, s2){
	return new Set([...s2].filter(x => s1.has(x)));
}

function join(s1, s1){
	return new Set([...s1, ...s2]);
}

function cut(m, n){
	return new Set([...m].filter(x => !m.has(n)));
}

classify(classing.get(3).get(' '), 'R D X|Y', classingByPosR);
classify(classing.get(3).get(' '), 'R XY', classingByPosR);

classify(classing.get(4).get(' Sx Sy '), 'R XY', classingByPosR);

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

//classing\s.tex Перечислено; /s/*tex Описано
classing.get(4).delete(' S ');

//classing\s_sx.tex Перечислено
classing.get(4).delete(' S Sx ');
classing.get(4).delete(' S Sy ');

classing.get(4).get(' Sx Sy ').delete(' Sx Sy => S ');
classing.get(4).get(' Sx Sy ').delete(' Sx D => S ');
classing.get(4).get(' Sx Sy ').delete(' Sy D => S ');
//
classing.get(4).get(' Sx Sy ').delete('XY');
classing.get(4).get(' Sx Sy ').delete('R XY');

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

function a11(str){
	let pat = new RegExp('\\{pmatrix\\}\\s*'+str+'\\s+&');
	return ([item, eq])=>(pat.test(eq));
}

function a22(str){
	let pat = new RegExp('&\\s+' + str + '\\s*(?:\\\\\\\\\\s+)?\\\\end\{pmatrix\}');
	return ([item, eq])=>(pat.test(eq));
}

function a21(str){
	let pat = new RegExp('\\\\\\\\\\s+' + str + '\\s+&');
	return ([item, eq])=>(pat.test(eq));
}

function a12(str){
	let pat = new RegExp('&\\s+' + str + '\\s*\\\\\\\\');
	return ([item, eq])=>(pat.test(eq));	
}

function elFilter([name, value]){
	let key = [name, value].join(' = ');
	
	value = value.replace(/\\/g, '\\\\');
	value = value.replace(/\s*(\\\\)/g, '\\s*$1');
	value = value.replace(/\s+/g, '\\s+');
	
	let reg = {
		a11:new RegExp('\\{pmatrix\\}\\s*'+value+'\\s+&'),
		a22:new RegExp('&\\s+' + value + '\\s*(?:\\\\\\\\\\s+)?\\\\end\{pmatrix\}'),
		a12:new RegExp('&\\s+' + value + '\\s*\\\\\\\\'),
		a21:new RegExp('\\\\\\\\\\s+' + value + '\\s+&')
	};
	
	let pat = reg[name];
	//console.log(pat);
	
	let fun = ([item, eq])=>(pat.test(eq));	
	
	return [key, fun];
}

function positionAnalyse(eq, cond){
	let pair = eq.map(([item, eq])=>([item.comparePos(), eq]));
	let positions = pair.map(([pos, eq])=>(pos));
	
	return cond.map(elFilter).map(([key, fun])=>{
		const sel = pair.filter(fun).map(([pos, eq])=>(pos));
		
		console.log(sel);
		
		const set = sel.length ? sel.reduce(intersect) : new Set();
		
		return [key, set, sel.length];
	});
}

printTree(classing.get(4));


async function main(){
	let [code, eq] = await doMaxima(classing.get(4).get(' Sx Sy ').get('R R X|Y'));
	//console.log(eq);
	
	await require('fs').promises.writeFile('sample.md', code);

	//let arr = eq.filter(a21('\\\\sin\\\\alpha')).map(([item, eq])=>(item.comparePos()));
	//console.log(arr);
	//eq = eq.filter(s=>(s[0].type().includes('Y')));
	
	let res = positionAnalyse(eq, [
		//['a21', '\\sin\\alpha'],
		//['a21', 's_x s_y \\sin\\alpha'],
		//['a12', '- s_x s_y \\sin\\alpha'],
		//['a12', '- \\sin\\alpha'],
		//['a22', 's_y \\cos\\alpha'],
		//['a11', 's_x \\cos\\alpha']
	]);
	
	for(let [key, un, ctrl] of res){
		if(ctrl === 0){
			throw new Error(key);
		}

		console.log(key.white+ ' :', [...un].map(x=>x.green).join(' & '));
	}
}

main().catch(err=>console.log(err.stack));
