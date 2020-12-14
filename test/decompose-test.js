const assert = require('assert');
const jsc = require('jsverify');

const decompose = require('../decompose.js');

const  {
	affineR,
	affineX,
	affineY,
	affineS
} = require('../primitive.js');

const SOURCE = Symbol();



const matrix = (P="XYS")=>jsc.bless({
	generator:(size)=>{
		let num = jsc.number(-3, 4).generator;
		let s_x = num(size),
			s_y = num(size);
			
		while(s_x===0){
			s_x = num(size);
		}
		while(s_y===0){
			s_y = num(size);
		}
		
		const d = P.split("").map((type)=>{
			if(type === 'S'){
				return affineS(s_x,s_y);
			}
			else if(type === 'X'){
				return affineX(num(size));
			}
			else if(type === 'Y'){
				return affineY(num(size));
			}
			else if(type === 'R'){
				const a = num(size);
				return affineR(Math.sin(a), Math.cos(a));
			}
		});
		
		const m = product(d);
		
		return m;
	}
});


function mult(a, b){
	return [
		[ a[0][1]*b[1][0] + a[0][0]*b[0][0],  a[0][1]*b[1][1] + a[0][0]*b[0][1] ],
		[ b[1][0]*a[1][1] + b[0][0]*a[1][0],  a[1][1]*b[1][1] + b[0][1]*a[1][0] ]
	];
};

function product(M){
	const f = M[0], l = M.slice(1);
	
	return l.reduce(mult, f);
}

const TOLERANCE = 5e-5;

function approx(A, B){
	return true &&
		Math.abs( A[0][0] - B[0][0] ) < TOLERANCE
		&&
		Math.abs( A[0][1] - B[0][1] ) < TOLERANCE
		&&
		Math.abs( A[1][0] - B[1][0] ) < TOLERANCE
		&&
		Math.abs( A[1][1] - B[1][1] ) < TOLERANCE
	;
}

const control = (P, V)=>(A)=>{
		const D = decompose(A, P, V);
		
		const M = product(D);
		
		if(!approx(A, M)){
			console.log(P, V, A);
			assert.deepEqual(M, A);
		}
		return true;
	};
	
function once(P, V=0){
	it('once '+P + ' ' + V, ()=>{
		control(P, V)(matrix(P).generator(1));
	});
}

function manual(P, V, M){
	it('manual '+P + ' ' + V, ()=>{
		control(P, V)(M);
	});
}

const byOnce = false;

describe('decompose', ()=>{
	
	it('exists', ()=>{
		assert.ok(decompose);
	});
	
	jsc.property('control of arb', matrix(), (m)=>{
		assert.equal(m.length, 2);
		assert.equal(m[0].length, 2);
		assert.equal(m[1].length, 2);
		return true;
	});

	
	//Первая группа
	[
		'XYS',
		'SXY',
		'XSY',
		'YXS',
		'SYX',
		'YSX'
	].forEach((P)=>{
		if(byOnce){
			once(P);
		}
		else{
			jsc.property(P, matrix(), control(P));
		}
	});
	
	//Вторая группа
	[
		'RSX',
		'RSY',
		'RXS',
		'RYS',
		'SXR',
		'SYR',
		'XSR',
		'YSR'
	].forEach((P)=>{
		if(byOnce){
			once(P);
		}
		else{
			jsc.property(P, matrix(), control(P));
			jsc.property(P +' 1', matrix(), control(P, 1));
		}
	});

	//Третья группа
	[
		'SRX',
		'SRY',
		'XRS',
		'YRS'
	].forEach((P)=>{
		if(byOnce){
			once(P);
		}
		else{
			jsc.property(P, matrix(P), control(P, 0));
			jsc.property(P +' 1', matrix(P), control(P, 1));
			jsc.property(P +' 2', matrix(P), control(P, 2));
			jsc.property(P +' 3', matrix(P), control(P, 3));
		}
	});

	//Четвёртая группа
	[
		'XYR',
		'YXR',
		'RXY',
		'RYX'
	].forEach((P)=>{
		if(byOnce){
			once(P);
		}
		else{
			jsc.property(P, matrix(P), control(P));
			jsc.property(P + ' 1', matrix(P), control(P, 1));
		}
	});
	
	//Пятая группа
	[
		'XRY',
		'YRX'
	].forEach((P)=>{
		if(byOnce){
			once(P);
		}
		else{
			jsc.property(P, matrix(P), control(P));
			jsc.property(P + ' 1', matrix(P), control(P, 1));
		}
	});
	

});