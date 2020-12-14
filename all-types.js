
const Markov = require('./markov.js');

/*
	Алфавит
	R - поворот
	X - скос по X
	Y - скос по Y
	S - масштаб по двум осям
	P - S_x - масштаб по x
	Q - S_y - масштаб по y
	D - неоднородность масштаба
	M - M_x - отражение по x
	N - M_y - отражение по y
	s - скаляр
	n = -1
 */
 
const abc = 'RXYSPQDsMNn';

function *rules(){
	yield * 'RXYSPQDs'.split('').map(L=>([L+L, L])); /* Однотипные, сворачиваемые в себя */
	yield * 'MNn'.split('').map(L=>([L+L, ''])); /* Обратные сами себе */
	
	
	for(let L of 'PQDMNsn'){
		yield ['S'+L, 'S'];
		yield [L+'S', 'S'];
	}
	
	const commut = 'MNPQD';
	//Коммутируют в порядке перечисления
	for(let i = 0; i<commut.length; ++i){
		for(let j = i+1; j<commut.length; ++j){
			yield [ commut[j]+commut[i], commut[i]+commut[j] ];
		}
	}
	
	//Скаляры всплывают вперёд
	for(let L of 's'){
		for(let K of 'RXYPQDMN'){
			yield [ K + L, L + K ];
		}
	}
	for(let L of 'n'){
		for(let K of 'RXYPQD'){
			yield [ K + L, L + K ];
		}
	}
	
	//скаляры перемножаются
	yield ['sn', 's'];
	yield ['ns', 's'];
	
	yield ['MN', 'n'];
	
	yield ['nN', 'M'];
	yield ['Nn', 'M'];
	yield ['nM', 'N'];
	yield ['Mn', 'N'];
	yield ['nD', 'D'];
	
	yield * [
		['NQ', 'Q'],
		['MP', 'P']
	]
	
	
	for(let L of 'RXY'){
		yield ['M' + L + 'M', L];
		yield ['N' + L + 'N', L];
		yield ['MD' + L + 'M', 'D'+L];
		yield ['ND' + L + 'N', 'D'+L];
	}
	for(let L of 'RXY'){
		yield ['N' + L + 'M', 'n' + L];
		yield ['M' + L + 'N', 'n' + L];
		yield ['ND' + L + 'M', 'Dn' + L];
		yield ['MD' + L + 'N', 'Dn' + L];
	}
	
	yield * [
		['YMY', 'MY'],
		['YNY', 'YN'],
		['XMX', 'XM'],
		['XNX', 'NX'],
		
		['MRN', 'nR']
	];
};

const convert1 = Markov(rules());

function convert2(str){
	if(str[0]==='n'){
		let pos;
		if((pos = str.indexOf('M'))>-1){
			str = str.slice(1, pos) + 'N' + str.slice(pos+1);
		}
		else if((pos = str.indexOf('N'))>-1){
			str = str.slice(1, pos) + 'M' + str.slice(pos+1);
		}
		else if(str.indexOf('D')>-1||str.indexOf('S')>-1){
			str = str.slice(1);
		}
	}
	return convert1(str);
}

const convert = (str)=>(convert2(convert1(str)));

const varcount = (str)=>{
	if(str.length === 0){
		return 0;
	}
	else if(str.length === 1){
		if(str === 'S'){
			return 2;
		}
		else if('MNn'.indexOf(str)>-1){
			return 0;
		}
		else{
			return 1;
		}
	}
	else{
		return str.split("").reduce((akk, s)=>(akk + varcount(s)), 0);
	}
}



const isDiagonal = (str)=>{
	if(str.length === 0){
		return true;
	}
	else if(str.length === 1){
		return 'SPQDsMNn'.indexOf(str)>-1;
	}
	else{
		return str.split("").reduce((akk, s)=>(akk && isDiagonal(s)), true);
	}
};

const isDownTriangle = (str)=>{
	if(str.length === 0){
		return true;
	}
	else if(str.length === 1){
		return 'YSPQDsMNn'.indexOf(str)>-1;
	}
	else{
		return str.split("").reduce((akk, s)=>(akk && isDownTriangle(s)), true);
	}
};

const isUpTriangle = (str)=>{
	if(str.length === 0){
		return true;
	}
	else if(str.length === 1){
		return 'XSPQDsMNn'.indexOf(str)>-1;
	}
	else{
		return str.split("").reduce((akk, s)=>(akk && isUpTriangle(s)), true);
	}
};

const isTriangle = (str)=>(isUpTriangle(str) || isDownTriangle(str));

function * all(pref = ''){
	for(let L of abc){
		let str = pref + L;
		
		let res = convert(str);
		if(res != str){
			yield str +' <=> ' + res;
			continue;
		}
		
		if(varcount(str)>4){
			continue;
		}
		
		if(isTriangle(str) && varcount(str)>3){
			continue;
		}
		
		yield str;
		yield * all(str);
		
	}
}
let arr = [...all()];

console.log(arr.filter(c=>(c.indexOf('<=>')===-1)).join('\n'));