const assert = require('assert');
const jsc = require('jsverify');

const Matrix = require('../matrix.js');

describe('matrix', ()=>{
	it('exists', ()=>{
		assert.ok(Matrix);
	});
	
	describe('diagonal', ()=>{
		it('create', ()=>{
			let m = new Matrix([[1, 0], [0, 1]]);
			assert.equal(m.a11, 1);
			assert.equal(m.a22, 1);
			assert.ok(m.isDiagonal);
			assert.ok(m.isScalar);
			assert.ok(m.det === 1);
		});		
		it('E', ()=>{
			let m = Matrix.E();
			assert.equal(m.a11, 1);
			assert.equal(m.a22, 1);
			assert.ok(m.isDiagonal);
			assert.ok(m.isScalar);
			assert.ok(m.det === 1);
		});
	});
	
	describe('sample', ()=>{
		it('S S', ()=>{
			let m = Matrix.scale().mul(Matrix.scale());
			assert.ok(m.isScale);
			assert.equal(m.varCount, 4);
			assert.equal(m.paramCount, 2);
		});
	});
});