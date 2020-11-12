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
	
	//console.log('D ', D);
	
	if(pos("R")===0){
		//console.log('R=0');
		//Первая группа разложений
		if(pos("X")<pos("Y")){
			//console.log('X<Y');
			s_y = A[1][1];
			s_x = D/s_y;
		}
		else if(pos("Y")<pos("X")){
			s_x = A[0][0];
			s_y = D/s_x;
		}
		else{
			throw new Error();
		}
		
		if(pos("X")<pos("S")){
			//console.log('X<S');
			h_x = A[0][1]/s_y;//X<S
		}
		else if(pos("S")<pos("X")){
			h_x = A[0][1]/s_x; //S<X
		}
		else{
			throw new Error();
		}
		
		if(pos("Y")<pos("S")){
			//console.log('Y<S');
			h_y = A[1][0]/s_x; //Y<S
		}
		else if(pos("S")<pos("Y")){
			h_y = A[1][0]/s_y; //S<Y
		}
		else{
			throw new Error();
		}
		
		//console.log({s_x, s_y, h_x, h_y});
	}
	else if(pos("R")!==2){
		let sigx = (V & 1) ? -1 : 1;
		let sigy = sign(D)*sigx;

		if(pos("X")){
			
			if(pos("R")===1){
				s_x = sigx * sqrt(A[0][0]**2 + A[1][0]**2); // pm
				s_y = D/s_x;

				cosa = A[0][0]/s_x;
				sina = A[1][0]/s_x;

				if(pos("S")<pos("X")){
					h_x = (A[0][1] + s_y*sina)/(s_x*cosa);
				}
				else if(pos("X")<pos("S")){
					h_x = (A[0][1] + s_y*sina)/(s_y*cosa);
				}
			}
			else if(pos("R")===3){
				s_y = sigy * sqrt(A[1][0]**2 + A[1][1]**2); // pm
				s_x = D/s_y;

				sina = A[1][0]/s_y;
				cosa = A[1][1]/s_y;
				if(pos("S")<pos("X")){
					h_x = (A[0][1] + s_x*sina)/(s_x*cosa);
				}
				else if(pos("X")<pos("S")){
					h_x = (A[0][1] + s_x*sina)/(s_y*cosa);
				}
			}
			else{
				throw new Error();
			}
		}
		else if(pos("Y")){
			if(pos("R")===1){
				s_y = sigy * sqrt(A[0][1]**2 + A[1][1]**2); // pm
				sina = -A[0][1]/s_y;
				cosa = A[1][1]/s_y;
				s_x = D/s_y;
				
				if(pos("S")<pos("Y")){
					h_y = (A[1][0] - s_x*sina)/(s_y*cosa);
				}
				else if(pos("Y")<pos("S")){
					h_y = (A[1][0] - s_x*sina)/(s_x*cosa);
				}
			}
			else if(pos("R")===3){
				s_x = sigx * sqrt(A[0][0]**2 + A[0][1]**2); //pm
				cosa = A[0][0]/s_x;
				sina = -A[0][1]/s_x;
				s_y = D/s_x;

				if(pos("S")<pos("Y")){
					h_y = (A[1][0] - s_y*sina)/(s_y*cosa);
				}
				else if(pos("Y")<pos("S")){
					h_y = (A[1][0] - s_y*sina)/(s_x*cosa);
				}
			}
			else{
				throw new Error();
			}
			
		}
		else{
			throw new Error();
		}
	}
	else if(pos("R")===2){
		let T;
		if(P === "SRX"){
			T = A[0][0]*A[1][0]/D;
		}
		else if(P === "XRS"){
			T = A[1][0]*A[1][1]/D;
		}
		else if(P === "YRS"){
			T = -A[0][0]*A[0][1]/D;
		}
		else if(P === "SRY"){
			T = -A[0][1]*A[1][1]/D;
		}
		else{
			throw new Error();
		}
		
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

		if(P === "SRX"){
			s_x = A[0][0]/cosa;
			s_y = D/s_x;
			h_x = (A[0][1] + s_x*sina)/(s_x*cosa);
		}
		else if(P === "XRS"){
			s_y = A[1][1]/cosa;
			s_x = D/s_y;
			h_x = (A[0][1] + s_y*sina)/(s_y*cosa);
		}
		else if(P === "YRS"){
			s_x = A[0][0]/cosa;
			s_y = D/s_x;
			
			h_y = (A[1][0] - s_x*sina)/(s_x*cosa);
		}
		else if(P === "SRY"){
			s_y = A[1][1]/cosa;
			s_x = D/s_y;

			h_y = (A[1][0] - s_y*sina)/(s_y*cosa);
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