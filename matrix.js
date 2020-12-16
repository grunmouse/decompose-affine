
function lmul(a, b){
	if(a === 0 || b === 0){
		return 0;
	}
	if(a === 1){
		return b;
	}
	if(b === 1){
		return a;
	}
	
	let c;
	try{
		c = a * b;
	}
	catch{
		c = NaN;
	}
	
	if(isNaN(c)){
		if(typeof a === 'object' && a.inv === b || typeof b === 'object' && b.inv === a){
			return 1;
		}
		return Symbol();
	}
	else{
		return c;
	}
}

function ladd(a, b){
	if(a === 0){
		return b;
	}
	if(b === 0){
		return a;
	}
	
	let c;
	try{
		c = a + b;
	}
	catch{
		c = NaN;
	}
	
	if(isNaN(c)){
		if(typeof a === 'object' && a.neg === b || typeof b === 'object' && b.neg === a){
			return 0;
		}
		return Symbol();
	}
	else{
		return c;
	}
}

function lneg(a){
	if(typeof a === 'number'){
		return -a;
	}
	if(typeof a === 'object'){
		if(a.neg){
			return a.neg;
		}
	}
	
	return {neg:a};
}

function linv(a){
	if(typeof a === 'number'){
		return 1/a;
	}
	if(typeof a === 'object'){
		if(a.inv){
			return a.inv;
		}
	}
	
	return {inv:a}
}

function lensure(a){
	if(a == null){
		return Symbol();
	}
}

function ensuretrig(sina, cosa){
	if(typeof sina === 'number' && typeof cosa === 'number'){
		const cont = Math.hypot(sina, cosa);
		if(Math.abs(cont - 1)>1e-10){
			sina = sina/cont;
			cosa = cosa/cont;
		}
	}
	
	return [lensure(sina), lensure(cosa)];
}

function isNumber(a){
	return typeof a === 'number';
}

function isVar(a){
	return !isNumber(a);
}

class Matrix{
	constructor(mat, det, vars=0){
		const [[a11, a12], [a21, a22]] = mat;
		this.a11 = a11;
		this.a12 = a12;
		this.a21 = a21;
		this.a22 = a22;
		this.det = det || ladd(lmul(a11, a22), lmul(a12, a21));
		this.varCount = vars;
	}
	
	static rotate(sina, cosa){
		[sina, cosa] = ensuretrig(sina, cosa);
		return new this([[cosa, lneg(sina)], [sina, cosa]], 1, 1);
	}
	
	static skewX(s){
		s = lensure(s);
		return new this([[1, s], [0, 1]], 1, 1);
	}

	static skewY(s){
		s = lensure(s);
		return new this([[1, 0], [s, 1]], 1, 1);
	}
	
	static diagonal([a11, a22], det, vars=0){
		det = det || lmul(a11, a22);
		return new this([[a11, 0], [0, a22]], det, vars);
	}
	
	static scale(s_x, s_y){
		s_x = lensure(s_x);
		s_y = lensure(s_y);
		return this.diagonal([s_x, s_y], null, (+isVar(s_x)) + (+isVar(s_y)));
	}
	
	static scaleX(s){
		s = lensure(s);
		return this.diagonal([s, 1], s, (+isVar(s)));
	}
	
	static scaleY(s){
		s = lensure(s);
		return this.diagonal([1, s], s, (+isVar(s)));
	}
	
	static scaleD(s){
		s = lensure(s);
		return this.diagonal([s, linv(s)], 1, (+isVar(s)));
	}
	
	static scalar(s){
		s = lensure(s);
		return this.diagonal([s, s], null, (+isVar(s)));
	}
	
	static E(){
		return this.diagonal([1, 1]);
	}
	
	static factory(type, param){
		param = param || {};
		switch(type){
			case 'R':return this.rotate(param.sina, param.cosa);
			case 'S':return this.scale(param.s_x, param.s_y);
			case 'P':
			case 'Sx':return this.scaleX(param.s_x);
			case 'Q':
			case 'Sy':return this.scaleY(param.s_y);
			case 'Hx':
			case 'X':return this.skewX(param.h_x);
			case 'Hy':
			case 'Y':return this.skewY(param.h_y);
			case 's':return this.scalar(param.s);
			case 'D':return this.scaleD(param.d);
			default: throw new Error('Unknown type '+ type);
		}
	}
	
	get isUpTriangle(){
		return this.a21 === 0;
	}

	get isDownTriangle(){
		return this.a12 === 0;
	}
	
	get isDiagonal(){
		return this.a12 === 0 && this.a21 === 0;
	}
	
	get isTriangle(){
		return this.a12 === 0 || this.a21 === 0;
	}
	
	get isScaleX(){
		return this.isDiagonal && this.a22 === 1;
	}

	get isScaleY(){
		return this.isDiagonal && this.a11 === 1;
	}
	
	get isScale(){
		return this.isDiagonal;
	}
	
	get isScaleD(){
		return this.isScale && this.det === 1;
	}
	
	get isScalar(){
		return this.isDiagonal && this.a11 === this.a22;
	}
	
	_mIsSkew(){
		return this.a11 === 1 && this.a22 === 1;
	}
	
	get isSkewX(){
		return this._mIsSkew() && this.isUpTriangle();
	}

	get isSkewY(){
		return this._mIsSkew() && this.isDownTriangle();
	}
	
	mul(that){
		let c11 = ladd(lmul(this.a11, that.a11), lmul(this.a12, that.a21));
		let c12 = ladd(lmul(this.a11, that.a12), lmul(this.a12, that.a22));
		let c21 = ladd(lmul(this.a21, that.a11), lmul(this.a22, that.a21));
		let c22 = ladd(lmul(this.a21, that.a12), lmul(this.a22, that.a22));
		let det = lmul(this.det, that.det);
		let vars = this.varCount + that.varCount;

		return new this.constructor([[c11, c12], [c21, c22]], det, vars);
	}
	
	get paramCount(){
		let {a11, a12, a21, a22, det} = this;
		let count = [a11, a12, a21, a22].reduce((akk, a)=>(akk + (+isVar(a))), 0);
		let ctrl = isVar(det) ? 4 : 3;
		
		return Math.min(count, ctrl);
	}
	
	hasSwap(that){
		if(that.isScalar()){
			return !this.isScalar();
		}
		if(this.isDiagonal() && that.isDiagonal()){
			if(this.isScaleD()){
				return true;
			}
			if(that.isScaleX() && this.isScaleY){
				return true;
			}
		}
	}
	
	get isNotDecomposable(){
		return this.paramCount < this.varCount;
	}
	
	get isInfiniteValued(){
		return this.paramCount > this.varCount;
	}
}

module.exports = Matrix;