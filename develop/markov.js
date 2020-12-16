
function Markov(rules){
	rules = [...rules];
	return function(str){
		var f = true;
		while(f){
			f = false;
			for(let [pattern, replacement] of rules){
				if(str.indexOf(pattern)>-1){
					str = str.split(pattern).join(replacement);
					f = true;
				}
			}
		}
		return str;
	}
}

module.exports = Markov;