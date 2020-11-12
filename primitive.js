
function affineR(sina, cosa){
	const cont = Math.hypot(sina, cosa);
	if(Math.abs(cont - 1)>1e-10){
		sina = sina/cont;
		cosa = cosa/cont;
	}
	return [
		[ cosa, -sina ],
		[ sina,  cosa ]
	];
}

function affineX(h_x){
	return [
		[ 1, h_x ],
		[ 0,  1  ]
	];
}

function affineY(h_y){
	return [
		[  1 , 0 ],
		[ h_y, 1 ]
	];
}

function affineS(s_x, s_y){
	return [
		[ s_x,  0  ],
		[  0 , s_y ]
	];
}

module.exports = {
	affineR,
	affineX,
	affineY,
	affineS
};