
/** 
 * Генерирует строки, представляющие валидные типы разложения
 */
function * allTypes(){
	const letter = "SXYR";
	const count = 4**4;
	
	for(let i=0; i<count; ++i){
		let P = letter[i & 3] + letter[ (i>>>2) & 3] + letter[ (i>>>4) & 3] + letter[ (i>>>6) & 3];
		
		if(!!~P.indexOf('XX') || !!~P.indexOf('YY') || !!~P.indexOf('RR')){
			continue;
		}
		
		if(P.split('S').length !== 2){
			continue;
		}
		
		let T = P.slice(0,3);
		
		if(P.indexOf('S')===3){
			T = T + 's';
		}
		
		yield T;
	}
}

console.log(...allTypes());