
function parse(str){
	let m = str.match(/[A-Z][x-y]?\d*'*|s/g);
	if(m){
		return m.map((name)=>{
			let [type, number] = name.split(/(\d+)/);
			return {
				type,
				number,
				name
			}
		});
	}
	return [];
}




const abc = {
	S:{
		diagonal:true,
		det:true,
		detsign:true,
		varcount:2,
		conflict:["s"]
	},
	Sx:{
		diagonal:true,
		det:true,
		varcount:1,
		detsign:true,
		conflict:["M"],
		commutafter:['s']
	},
	Sy:{
		diagonal:true,
		det:true,
		detsign:true,
		varcount:1,
		conflict:["M"],
		commutafter:['Sx', 's']
	},
	D:{
		diagonal:true,
		varcount:1,
		commutafter:['Sx', 'Sy', 's']
	},
	Mx:{
		diagonal:true,
		detsign:true,
		varcount:0,
		exclude:true,
		once:"M"
	},
	My:{
		diagonal:true,
		detsign:true,
		varcount:0,
		exclude:true,
		once:"M"
	},
	s:{
		scalar:true,
		det:true,
		varcount:1,
		once:"s",
		exclude:true,
		conflict:["S"]
	},
	X:{
		up:true,
		varcount:1
	},
	Y:{
		down:true,
		varcount:1
	},
	R:{
		varcount:1
	}
};

for(let [type, obj] of Object.entries(abc)){
	obj.type = type;
	obj.diagonal = obj.diagonal || obj.scalar || false;
	obj.up = obj.up || obj.diagonal;
	obj.down = obj.down || obj.diagonal;
	obj.commutafter =obj.commutafter || [];
	obj.conflict = obj.conflict || [];
	obj.det = obj.det || false;
	obj.detsign = obj.detsign || false;

}


const varcount = (items)=>{
	return items.reduce((akk, s)=>(akk + abc[s.type].varcount), 0);
}

const isDiagonal = (items)=>{
	return items.every(s=>abc[s.type].diagonal);
};

const isDownTriangle = (items)=>{
	return items.every(s=>abc[s.type].down);
};

const isUpTriangle = (items)=>{
	return items.every(s=>abc[s.type].up);
};

const isTriangle = (items)=>(isUpTriangle(items) || isDownTriangle(items));

const isDetConst = (items)=>(
	items.every(s=>(!abc[s.type].det))
)

const isDetUnsign = (items)=>(
	items.every(s=>(!abc[s.type].detsign))
);

const toExclude = (items)=>{
	return new Set(items.map(a=>a.once).filter(a=>a));
}

const paramcount = (items)=>{
	return Math.min(
		isDiagonal(items) ? 2 : 4,
		isTriangle(items) ? 3 : 4,
		isDetConst(items) ? 3 : 4
	)
}

function analysePostfix(items){
	let result = {}, diagonal = true, up = true, down = true, varcount = 0, exclude = new Set(), once = new Set();
	for(let i = items.length; i--;){
		let item = abc[items[i].type];
		diagonal = diagonal && item.diagonal;
		up = up && item.up;
		down = down && item.down;
		varcount = varcount + item.varcount ;
		if(item.conflict) item.conflict.forEach(a=>exclude.add(a));
		if(item.once) once.add(item.once);
		
		if(diagonal){
			result.diagonal = varcount;
		}
		if(up){
			result.up = varcount;
		}
		if(down){
			result.down = varcount;
		}
	}
	

	result.varcount = varcount;
	result.exclude = exclude;
	result.once = once;
	let last = items.length ? abc[items[items.length-1].type] : {};
	
	result.last = last;
	
	result.paramcount = paramcount(items);
	
	if(last.type){
		exclude.add(last.type);
		last.commutafter.forEach(a=>exclude.add(a));
	}
	return result;
}

function nextSymbolSet(items){
	const postfix = analysePostfix(items);
	const result = new Set();
	for(let [name, config] of Object.entries(abc)){
		if(config.exclude) continue;
		if(postfix.exclude.has(name)) continue;
		if(postfix.once.has(config.once)) continue;
		if(config.diagonal && postfix.diagonal + config.varcount > 2) continue;
		if(config.up && postfix.up + config.varcount > 3) continue;
		if(config.down && postfix.down + config.varcount > 3) continue;
		
		result.add({name, type:name});
	}
	return result;
}

function * generate(arr){
	arr = arr || [];
	let next = nextSymbolSet(arr);
	
	for(let sym of next){
		let ext = arr.concat(sym);
		
		let state = analysePostfix(ext);
		
		let types = ext.map(s=>s.type);
		
		let code = types.join(" ");
		
		if(state.varcount === state.paramcount){
			yield ext;
		}
		if(state.varcount < 4){
			yield * generate(ext);
		}
	}
}

function * all(){
	yield * generate();
	yield * generate([{name:'s', type:'s'}]);
}

const {MapOfSet} = require('@grunmouse/special-map');

const collection = {
	2:new MapOfSet(),
	3:new MapOfSet(),
	4:new MapOfSet()
};
for(let a of all()){ 
	let v = varcount(a);
	let d = isDiagonal(a);
	let up = isUpTriangle(a);
	let down = isDownTriangle(a);
	
	
	let types = a.map(s=>s.type);
	let det = types.filter(s=>abc[s].det).sort();
	
	let code = types.join(" ");
	let detcode = det.join(" ");
	
	let meta = [];
	if(code.indexOf('Sx Sy')>-1){
		meta.push("SxSy");
	}
	if(!!~code.indexOf('Sx D')){
		meta.push("SxD");
	}
	if(!!~code.indexOf('Sy D')){
		meta.push("SyD");
	}
	if(types.includes('s')){
		if(types.includes("D")){
			meta.push("sD");
		}
		if(types.includes("Sx")){
			meta.push("sSx");
		}
		if(types.includes("Sy")){
			meta.push("sSy");
		}
	}
	
	let remark = "";
	if(meta.length){
		remark = ' (' + meta.join(" ") + ')';
	}
	
	collection[v].add(detcode, [code, remark]);
	
	if(detcode === ''){
		//console.log(code, v, detcode);
	}
}

console.log(collection[4].get('Sx'));

function printUnclassed(){
	const classed = require('./read-classing.js')();
	console.log(classed);
	for(let [key, s] of collection[4].entries()){
		console.log(key);
		for(let [name, rem] of s){
			if(!classed.has(name.replace(/^s /, ''))){
				console.log('\t'+name+rem);
			}
		}
	}
}

//console.log(nextSymbolSet(parse("X Sx D")));

printUnclassed();