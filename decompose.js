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


/**
 * @param A : Array[1]<Array[1]<Number>> - матрица
 * @param P : String - тип разложения
 * @param V : Uint[0..3] - номер варианта
 */
function decompose(A, P, V=0){
	const pos = (L)=>(P.indexOf(L)+1);
	
	let h_x, h_y, s_x, s_y, sina, cosa;

	const D = A[0][0]*A[1][1] - A[0][1]*A[1][0];
	
	if(pos("R")===0){
		//console.log('R=0');
		//Первая группа разложений
		if(pos("X") < pos("Y")){
			s_y = A[1][1];
			s_x = D/s_y;
		}
		else if(pos("Y") < pos("X")){
			s_x = A[0][0];
			s_y = D/s_x;
		}
		else{
			throw new Error();
		}
		
		if(pos("X") < pos("S")){
			h_x = A[0][1]/s_y;//X<S
		}
		else if(pos("S") < pos("X")){
			h_x = A[0][1]/s_x; //S<X
		}
		else{
			throw new Error();
		}
		
		if(pos("Y") < pos("S")){
			h_y = A[1][0]/s_x; //Y<S
		}
		else if(pos("S") < pos("Y")){
			h_y = A[1][0]/s_y; //S<Y
		}
		else{
			throw new Error();
		}
		
	}
	else if(pos("R")!==2){
		//Вторая группа разложений, допускает два решения
		let sigx = (V & 1) ? -1 : 1;
		let sigy = sign(D)*sigx;
		
		const trig = (a, b, sign)=>{
			let s = sign * sqrt(a**2 + b**2);
			
			return [s, D/s, a/s, b/s, D/s * b/s];
		};
		
		let dh, b, axis;
		
		if(pos("X") > 0){
			b = A[1][0];
		}
		else if(pos("Y") > 0){
			b = -A[0][1];
		}
		else{
			throw new Error();
		}
		
		if(pos("R") < pos("X") || pos("Y") > 0 && pos("R") === 3 ){
			//pos("X") > 0 && pos("R") < pos("X") || pos("Y") > 0 && pos("R") > pos("Y")
			[s_x, s_y, cosa, sina, dh] = trig(A[0][0], b, sigx);
		}
		else if(pos("R") < pos("Y") || pos("X") > 0 && pos("R") === 3){
			//pos("X") > 0 && pos("R") > pos("Y") || pos("Y") > 0 && pos("R") < pos("Y")
			[s_y, s_x, cosa, sina, dh] = trig(A[1][1], b, sigy);
		}
		else{
			throw new Error();
		}

		if(pos("X")){
			let hbase = (A[0][1] + dh)/cosa;

			if(pos("S")<pos("X")){
				//S < X
				h_x = hbase/s_x;
			}
			else if(pos("X")<pos("S")){
				//X < S
				h_x = hbase/s_y;
			}
		}
		else if(pos("Y")){
			let hbase = (A[1][0] - dh)/cosa;
			
			if(pos("S") < pos("Y")){
				//S < Y
				h_y = hbase/s_y;
			}
			else if(pos("Y") < pos("S")){
				//Y < S
				h_y = hbase/s_x;
			}
		}
		else{
			throw new Error();
		}
	}
	else if(pos("R")===2){
		let T;
		
		let p, q;
		
		if(pos("X")>0){
			p = A[1][0];
		}
		else if(pos("Y")>0){
			p = -A[0][1];
		}
		
		if(pos("X") === 3 || pos("Y") === 1){
			q = A[0][0];
		}
		else if(pos("X") === 1 || pos("Y") === 3){
			q = A[1][1];
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
		

		if(pos("X")===3 || pos("Y") === 1){
			s_x = A[0][0]/cosa;
			s_y = D/s_x;
			dh = s_x*sina;
			nh = A[0][0];

		}
		else if(pos("Y")===3 || pos("X") === 1){
			s_y = A[1][1]/cosa;
			s_x = D/s_y;
			dh = s_y*sina;
			nh = A[1][1];
		}
		else{
			throw new Error();
		}
		
		if(pos("X")>0){
			h_x = (A[0][1] + dh)/nh;
		}
		
		if(pos("Y")>0){
			h_y = (A[1][0] - dh)/nh;
		}


	}
	else if(pos("S")===0){
		let s = Math.sqrt(D); //pm
		if(pos("R")!==2){
			throw new Error();
		}
		else if(pos("R")===2){
			throw new Error();
		}
		else{
			throw new Error();
		}
	}
	else{
		throw new Error();
	}
	
	let param = {h_x, h_y, s_x, s_y, sina, cosa};
	
	return P.split("").map((L)=>factory(L, param));
}

module.exports = decompose;