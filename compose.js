
const proto = {
	S:{
		diagonal:true,
		det:true,
		detsign:true,
		unallowscalar: true,
		varcount:2
	},
	Sx:{
		diagonal:true,
		det:true,
		detsign:true,
		varcount:1,
		commutafter:['S']
	},
	Sy:{
		diagonal:true,
		det:true,
		detsign:true,
		varcount:1,
		commutafter:['Sx', 'S']
	},
	D:{
		diagonal:true,
		varcount:1,
		commutafter:['Sx', 'Sy', 'S']
	},
	Mx:{
		diagonal:true,
		detsign:true,
		varcount:0,
		exclude:true
	},
	My:{
		diagonal:true,
		detsign:true,
		varcount:0,
		exclude:true
	},
	s:{
		scalar:true,
		det:true,
		varcount:1,
		once:"s",
		exclude:true
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

const unallowed = {
	"2":{
		//" S Sx ":"Неоднозначный масштаб"
	},
	"3":{
	},
	"4":{
	}
}


function parse(str){
	let m = str.match(/[A-Z][x-y]?\d*'*|s/g);
	if(m){
		return m.map((name)=>{
			let [type, number] = name.split(/(\d+)/);
			
			return Object.create(proto[type], {
				//type:{value:type},
				number:{value:+number},
				name:{value:name}
			})
		});
	}
	return [];
}

function stringifyType(arr){
	return arr.map(a=>a.type).join(" ");
}
	

for(let [type, obj] of Object.entries(proto)){
	obj.type = type;
	obj.diagonal = obj.diagonal || obj.scalar || false;
	obj.up = obj.up || obj.diagonal;
	obj.down = obj.down || obj.diagonal;
	obj.commutafter = obj.commutafter || [];
	obj.det = obj.det || false;
	obj.detsign = obj.detsign || false;
	
	obj.toString = function(){
		return this.name || this.type || 'A';
	}
}

proto.P = proto.Sx;
proto.Q = proto.Sy;
proto.Hx = proto.X;
proto.Hy = proto.Y;

/**
 * Нужно ли поменять местами a и b, если они встретятся в массиве подряд
 */
function hasSwap(a, b){
	if(b.scalar){
		return true;
	}
	if(a.diagonal && b.diagonal){
		return a.commutafter.includes(b.type);
	}
	
	return false;
}

function untrim(arr){
	return ["", ...arr, ""].join(" ");
}

function sortAbc(a, b){
	if(a.type < b.type){
		return -1;
	}
	else if(a.type > b.type){
		return 1;
	}
	else if(a.name < b.name){
		return -1;
	}
	else if(a.name > b.name){
		return 1;
	}
	else{
		return 0;
	}
}

function sortSwap(a, b){
	if(hasSwap(a, b)){
		return 1;
	}
	else if(hasSwap(b, a)){
		return -1;
	}
	return 0;
}


class Components extends Array{
	constructor(code){
		if(typeof code === "string"){
			super(...parse(code));
		}
		else if(code && code[Symbol.iterator] && code[Symbol.iterator].call){
			super(...code);
		}
		else{
			super();
		}
	}

	static get [Symbol.species](){ 
		return Array; 
	}
	
	toString(){
		return untrim(this);
	}

	type(){
		return this.map(a=>a.type);
	}
	
	push(p){
		if(typeof p === 'string'){
			return parse(p).map(p=>this.push(p)).pop();
		}
		
		return super.push(p);
	}	
	
	filter(...arg){
		let res = super.filter(...arg);
		return Components.from(res);
	}

	slice(...arg){
		let res = super.slice(...arg);
		return Components.from(res);
	}
	
	typeString(){
		return untrim(this.type());
	}

	detComponents(){
		return this.filter((a=>a.det)).sort(sortAbc);
	}
	
	nodetComponents(){
		return this.filter((a=>!a.det)).sort(sortAbc);
	}	
}

class Compose extends Components{

	
	static hasSwap(a, b){
		if(typeof a === 'string'){
			a = parse(a).pop();
		}
		if(typeof b === 'string'){
			b = parse(b)[0];
		}
		
		if(!a){
			return false;
		}
		else if(!b){
			return true;
		}
		
		return hasSwap(a, b);
	}
	
	get last(){
		return this[this.length - 1];
	}
	
	allowPush(p){
		if(typeof p === 'string'){
			p = parse(p)[0];
		}
		
		if(!p){
			return false;
		}
		
		if(this.length === 0){
			return true;
		}
		
		if(this.last.type === p.type){
			return false;
		}

		if(hasSwap(this.last, p)){
			return false;
		}
		
		if(p.unallowscalar && this.includesScalar()){
			return false;
		}
		
		let postfix = new Components();
		postfix.push(p);
		
		postfix.unshift(this.last);
		if(unallowed[postfix.length][postfix.typeString()]){
			return false;
		}
		
		
		return true;
	}
	
	clone(){
		return new Compose(this);
	}

	slice(...arg){
		let res = super.slice(...arg);
		return Compose.from(res);
	}
	
	compose(p){
		let res = this.clone();
		res.push(p);
		return res;
	}
	
	varCount(){
		return this.reduce((akk, s)=>(akk + s.varcount), 0);
	}

	isDiagonal(){
		return this.every(s=>s.diagonal);
	}

	isDownTriangle(){
		return this.every(s=>s.down);
	}

	isUpTriangle(){
		return this.every(s=>s.up);
	}

	isTriangle(){
		return this.isUpTriangle() || this.isDownTriangle();
	}

	isDetConst(){
		return this.every(s=>(!s.det))
	}

	isDetUnsign(){
		return this.every(s=>(!s.detsign))
	}

	paramCount(){
		return Math.min(
			this.isDiagonal() ? 2 : 4,
			this.isTriangle() ? 3 : 4,
			this.isDetConst() ? 3 : 4
		)
	}
	
	includesScalar(){
		return this.some(s=>s.scalar);
	}
	
	bracketComponents(){
		return Components.from([this[0], this.last]);
	}
	
	hasSubstr(str){
		if(typeof str === 'string' && !/^\s.*\s$/.test(str)){
			str = new Compose(str);
		}
		
		if(str.charString){
			str = str.typeString();
		}
		
		if(typeof str !== 'string'){
			throw new TypeError('Incorrect argument type');
		}
		
		return this.typeString().indexOf(str)>-1;
	}
	
	isSortable(){
		return this.some((item, i, arr)=>(i!==0 && hasSwap(item, arr[i-1])));
	}
	

	reducibilityToS(){
		let type = this.type();
		let replacement = new Components();
		if(type.includes('s')){
			replacement.push('s')
			type.shift();
			for(let i=0; i<type.length; ++i){
				let item = type[i];
				if(['Sx', 'Sy', 'D'].includes(item)){
					replacement.push(item);
					type[i] = 'S';
					return [replacement, new Compose(untrim(type))];
				}
			}
		}
		else{
			const pat = /\s(?:Sx\s(?:Sy|D)|Sy\sD)\s/;
			let str = untrim(type);
			let result = str.replace(pat, (repl)=>{
				replacement = new Components(repl);
				return ' S ';
			});
			
			if(result !== str){
				return [replacement, new Compose(result)];
			}
		}
		
		return false;
	}
}

module.exports = {
	Compose,
	hasSwap,
	parse,
	proto,
	keys:["s", "S", "Sx", "Sy", "D", "X", "Y", "R"]
};