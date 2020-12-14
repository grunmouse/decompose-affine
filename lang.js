
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
		varcount:2,
		conflict:"M"
	},
	Sx:{
		diagonal:true,
		varcount:1,
		conflict:"M"
	},
	Sy:{
		diagonal:true,
		varcount:1,
		conflict:"M"
	},
	D:{
		diagonal:true,
		varcount:1
	},
	Mx:{
		diagonal:true,
		varcount:0,
		exclude:true,
		once:"M"
	},
	My:{
		diagonal:true,
		varcount:0,
		exclude:true,
		once:"M"
	},
	s:{
		scalar:true,
		varcount:1,
		once:"s"
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
}


const varcount = (items)=>{
	return items.reduce((akk, s)=>(akk + abc[s.type].varcount), 0);
}

const isDiagonal = (items)=>{
	return items.reduce((akk, s)=>(akk && abc[s.type].diagonal), true);
};

const isDownTriangle = (items)=>{
	return items.reduce((akk, s)=>(akk && abc[s.type].down), true);
};

const isUpTriangle = (items)=>{
	return items.reduce((akk, s)=>(akk && abc[s.type].up), true);
};

const isTriangle = (items)=>(isUpTriangle(items) || isDownTriangle(items));

const toExclude = (items)=>{
	return new Set(items.map(a=>a.once).filter(a=>a));
}

function analysePostfix(items){
	let result = {}, diagonal = true, up = true, down = true, varcount = 0, exclude = new Set();
	for(let i = items.length; i--;){
		let item = abc[items[i].type];
		diagonal = diagonal && item.diagonal;
		up = up && item.up;
		down = down && item.down;
		varcount = varcount + item.varcount ;
		if(item.conflict) exclude.add(item.conflict);
		if(item.once) exclude.add(item.once);
		
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
	result.last = items.length ? abc[items[items.length-1].type] : {};
	return result;
}

function nextSymbolSet(items){
	const postfix = analysePostfix(items);
	const result = new Set();
	for(let [name, config] of Object.entries(abc)){
		if(config.exclude) continue;
		if(postfix.exclude.has(name)) continue;
		if(config.diagonal && postfix.diagonal + config.varcount > 2) continue;
		if(config.up && postfix.up + config.varcount > 3) continue;
		if(config.down && postfix.down + config.varcount > 3) continue;
		if(name === postfix.last.type) continue;
		
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
		
		if(state.varcount === 4 || state.varcount === 2 && state.diagonal === 2 || state.varcount === 3 && (state.up === 3 || state.down === 3)){
			yield ext;
		}
		if(state.varcount < 4){
			yield * generate(ext);
		}
	}
}

for(let a of generate()){ 
	console.log(a.map(s=>s.name).join(" "));
}
//console.log([...generate()].map((a=>a.map(s=>s.name).join(""))));