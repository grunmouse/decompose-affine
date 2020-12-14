'use strict';

const {
	sqrt,
	abs,
	hypot
} = Math;

const theta = (x)=>(x<0 ? -1 : 1);

const sign = (x)=>(x>0 ? 1 : (x<0 ? -1 : 0));

const  {
	affineR,
	affineX,
	affineY,
	affineS
} = require('./primitive.js');

const assert = require('assert');


/**
 * Создаёт матрицу заданного типа, используя параметры из объекта
 */
function factory(type, {h_x, h_y, s_x, s_y, sina, cosa}){
	if(type === "R"){
		return affineR(sina, cosa);
	}
	else if(type === "X"){
		return affineX(h_x);
	}
	else if(type === "Y"){
		return affineY(h_y);
	}
	else if(type === "S"){
		return affineS(s_x, s_y);
	}
}

function sincos(a, b, sign=1){
	const s = sign * Math.hypot(a, b);
	
	return [s, a/s, b/s];
}

/**
 * @param P - строка
 * @param L - искомый символ
 * @param n - номер вхождения
 */
function posOf(P, L, n=1){
	var index = 0;
	for(let i=0; i<n; ++i){
		index = P.indexOf(L, index) + 1;
		if(index === 0){
			return 0;
		}
	}
	return index;
}

function countOf(P, L){
	return P.split(L).lenght - 1;
}

/**
 * @param A : Array[1]<Array[1]<Number>> - матрица
 * @param P : String - тип разложения
 * @param V : Uint[0..3] - номер варианта
 */
function decompose(A, P, V=0){
	const pos = (L, i=1)=>(posOf(P, L, i));
	const count = (L)=>(countOf(P, L));
	
	const result = [];
	
	let h_x, h_y, s_x, s_y, sina, cosa;
	
	const [[a11, a12], [a21, a22]] = A;

	const D = a11*a22 - a12*a21;
	
	
	if(pos("S")>0){
		if(pos("R")===0){
			//console.log('R=0');
			//Первая группа разложений
			if(pos("X") < pos("Y")){
				s_y = a22;
				s_x = D/s_y;
			}
			else if(pos("Y") < pos("X")){
				s_x = a11;
				s_y = D/s_x;
			}
			else{
				throw new Error();
			}
			
			result[pos('S')] = affineS(s_x,s_y);
			
			if(pos("X") < pos("S")){
				h_x = a12/s_y;//X<S
			}
			else if(pos("S") < pos("X")){
				h_x = a12/s_x; //S<X
			}
			else{
				throw new Error();
			}
			result[pos('X')] = affineX(h_x);
			
			if(pos("Y") < pos("S")){
				h_y = a21/s_x; //Y<S
			}
			else if(pos("S") < pos("Y")){
				h_y = a21/s_y; //S<Y
			}
			else{
				throw new Error();
			}
			result[pos('Y')] = affineY(h_y);
			
		}
		else if(pos("R")!==2){
			//Вторая группа разложений, допускает два решения
			let sigx = (V & 1) ? -1 : 1;
			let sigy = sign(D)*sigx;
			
			const trig = (a, b, sign)=>{
				//let s = sign * sqrt(a**2 + b**2);
				let [s, p, q] = sincos(a, b, sign);
				
				return [s, D/s, p, q, D/s * q];
			};
			
			let dh, b, axis;
			
			if(pos("X") > 0){
				b = a21;
			}
			else if(pos("Y") > 0){
				b = -a12;
			}
			else{
				throw new Error();
			}
			
			if(pos("R") < pos("X") || pos("Y") > 0 && pos("R") === 3 ){
				//pos("X") > 0 && pos("R") < pos("X") || pos("Y") > 0 && pos("R") > pos("Y")
				[s_x, s_y, cosa, sina, dh] = trig(a11, b, sigx);
			}
			else if(pos("R") < pos("Y") || pos("X") > 0 && pos("R") === 3){
				//pos("X") > 0 && pos("R") > pos("Y") || pos("Y") > 0 && pos("R") < pos("Y")
				[s_y, s_x, cosa, sina, dh] = trig(a22, b, sigy);
			}
			else{
				throw new Error();
			}
			
			result[pos('S')] = affineS(s_x, s_y);
			result[pos('R')] = affineR(sina, cosa);
			

			if(pos("X")){
				let hbase = (a12 + dh)/cosa;

				if(pos("S")<pos("X")){
					//S < X
					h_x = hbase/s_x;
				}
				else if(pos("X")<pos("S")){
					//X < S
					h_x = hbase/s_y;
				}
				
				result[pos('X')] = affineX(h_x);
			}
			else if(pos("Y")){
				let hbase = (a21 - dh)/cosa;
				
				if(pos("S") < pos("Y")){
					//S < Y
					h_y = hbase/s_y;
				}
				else if(pos("Y") < pos("S")){
					//Y < S
					h_y = hbase/s_x;
				}
				result[pos('Y')] = affineY(h_y);
			}
			else{
				throw new Error();
			}
		}
		else if(pos("R")===2){
			let T;
			
			let p, q;
			
			if(pos("X")>0){
				p = a21;
			}
			else if(pos("Y")>0){
				p = -a12;
			}
			
			if(pos("X") === 3 || pos("Y") === 1){
				q = a11;
			}
			else if(pos("X") === 1 || pos("Y") === 3){
				q = a22;
			}
			
			T = p*q/D;

			if(T===0){
				//4 варианта
				if(V===0){
					sina = 0;
					cosa = 1;
				}
				else if(V===1){
					sina = 1;
					cosa = 0;
				}
				else if(V===2){
					sina = 0;
					cosa = -1;
				}
				else if(V===3){
					sina = -1;
					cosa = 0;
				}
			}
			else{
				let sig2 = ((V & 1) ? -1 : 1)*sign(T);
				let sig1 = ((V & 2) ? -1 : 1)*sign(T);
				let cos2a = sig2 * sqrt(1 - 4*(T**2)); // pm
				cosa = sig1 * sqrt(0.5 + cos2a/2); // pm

				sina = T/cosa;
			}

			let hbase, dh, nh;
			
			result[pos('R')] = affineR(sina, cosa);

			if(pos("X")===3 || pos("Y") === 1){
				s_x = a11/cosa;
				s_y = D/s_x;
				dh = s_x*sina;
				nh = a11;

			}
			else if(pos("Y")===3 || pos("X") === 1){
				s_y = a22/cosa;
				s_x = D/s_y;
				dh = s_y*sina;
				nh = a22;
			}
			else{
				throw new Error();
			}
			
			result[pos('S')] = affineS(s_x, s_y);
			
			if(pos("X")>0){
				h_x = (a12 + dh)/nh;
				result[pos('X')] = affineX(h_x);
			}
			
			if(pos("Y")>0){
				h_y = (a21 - dh)/nh;
				result[pos('Y')] = affineY(h_y);
			}

		}
		else{
			throw new Error();
		}
	}
	else if(pos("S")===0){
		let s = Math.sqrt(Math.abs(D)); //pm
		
		const [b11, b12, b21, b22] = [a11, a12, a21, a22].map(a=>(a/s));
		
		if(pos("R")!==2){
			const sigh = (V & 1) ? -1 : 1;
			const calc = (c, d, d1)=>{
				let q = c**2 + d**2;
				let h = sigh * Math.sqrt(q - 1);
				let si = (h*d - c)/q;
				let cosa = (h*c + d)/q;
				let h1 = (d1 - cosa)/(h*cosa - si);
				
				return [cosa, si, h, h1];
			}
			
			let c, d, d1;
			if(pos("X")<pos("Y")){
				d = b22; d1 = b11;
			}
			else if(pos("Y")<pos("X")){
				d = b11; d1 = b22;
			}

			if(pos("Y")===2){
				c = b21;
				
				let si;
				
				[cosa, si, h_y, h_x] = calc(c, d, d1);
				
				sina = -si;
				
			}			
			else if(pos("X")===2){
				c = b12;
				
				let si;
				
				[cosa, si, h_x, h_y] = calc(c, d, d1);
				
				sina = si;
				
			}
			
			result[pos('X')] = affineX(h_x);
			result[pos('Y')] = affineY(h_y);
			result[pos('R')] = affineR(sina, cosa);
			
		}
		else if(pos("R")===2){
			const signs = (V & 1) ? -1 : 1;
			if(pos("X")<pos("Y")){
				cosa = b22;
			}
			else if(pos("Y")<pos("X")){
				cosa = b11;
			}
			sina = Math.sqrt(1-cosa**2);
			h_x = (b12 + sina)/cosa;
			h_y = (b21 - sina)/cosa;

			result[pos('X')] = affineX(h_x);
			result[pos('Y')] = affineY(h_y);
			result[pos('R')] = affineR(sina, cosa);
		}
		else{
			throw new Error();
		}
		
		s_x = s; s_y = s;
		
		result.push(affineS(s,s));
		//P = 'S' + P;
	}
	else{
		throw new Error();
	}
	
	//let param = {h_x, h_y, s_x, s_y, sina, cosa};
	
	result.shift();
	
	//return result;
	//let oldResult = P.split("").map((L)=>factory(L, param));

	//assert.deepEqual(result, oldResult);
	
	//console.log(P, oldResult, result);
	
	return result;
}

module.exports = decompose;