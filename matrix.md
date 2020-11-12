# Разложение матрицы цетнро-аффинного преобразования на матрицы элементарных преобразований

Положим, что у нас есть четыре матрицы элементарных преобразований

$$
X = \begin{pmatrix}
	1 & h_x \\
	0 & 1
\end{pmatrix}
$$

$$
Y = \begin{pmatrix}
	1 & 0 \\
	h_y & 1
\end{pmatrix}
$$

$$S=
\begin{pmatrix}
	s_x & 0 \\
	0 & s_y
\end{pmatrix}
$$

$$R = \begin{pmatrix}
	\cos\alpha & -\sin\alpha \\
	\sin\alpha & \cos\alpha
\end{pmatrix}
$$

Исходная матрица 
$$A = 
\begin{pmatrix}
	a_{11} & a_{12}\\
	a_{21} & a_{22}
\end{pmatrix}
$$

Может быть разложена одним из 18 способов:
$$\begin{array}{cccccc}
	A = SXR; & A = SRX; & A = XSR; & A = XRS; & A = RSX; & A = RXS; \\
	A = SYR; & A = SRY; & A = YSR; & A = YRS; & A = RSY; & A = RYS; \\
	A = SXY; & A = SYX; & A = XSY; & A = XYS; & A = YSX; & A = YXS.
\end{array}$$

Детерминанты равны
$$\det{X} = 1;$$
$$\det{Y} = 1;$$
$$\det{S} = s_x s_y;$$
$$\det{R} = 1.$$

Из чего следует, что 
$$\det{A} = s_x s_y.$$

Для описания алгоритма сформулируем входные условия.
```
// На вход поступает матрица в виде массива массивов
A[2][2]
//и задача разложения в виде строки имён X,Y,H,R
P

//Для случаев, когда существует несколько решений, введём параметр V uint[0..3]
V

//Функция pos - синтаксический сахар
pos = (A)=>(P.indexOf(A)+1);

//Выходные переменные объявляем на уровне функции

let h_x, h_y, s_x, s_y, sina, cosa;

//детерминант матрицы считаем в начале работы, он нужен во всех ветвях алгоритма

D = det(A);

```

### X,Y,S

$$XY = \begin{pmatrix}
	h_xh_y+1 & h_x \\
	h_y & 1
\end{pmatrix};\;

YX = \begin{pmatrix}
	1 & h_x \\
	h_y & h_xh_y+1
\end{pmatrix}$$

В разложениях, включающих множители $X$ $Y$, легко находятся $s_x$ или $s_y$.

$$\begin{cases}
	s_y = a_{22}, & XY, XSY ;\\
	s_x = a_{11}, & YX, YSX .
\end{cases}$$

Не зависимо от порядка XY, в зависимости от того, с какой стороны на эту пару умножен S
$$\begin{cases}
	\begin{cases}
		h_xs_y = a_{12},\\
		h_ys_x = a_{21},
	\end{cases}
	& (xy)S;\\
	\begin{cases}
		h_xs_x = a_{12},\\
		h_ys_y = a_{21},
	\end{cases}
	& S(xy);\\
	\begin{cases}
		h_xs_y = a_{12},\\
		h_ys_y = a_{21},
	\end{cases}
	& XSY;\\
	\begin{cases}
		h_xs_x = a_{12},\\
		h_ys_x = a_{21},
	\end{cases}
	& YSX.
\end{cases}
$$

Ветвь алгоритма разбора этой группы разложений
```JavaScript
if(pos("X")<pos("Y")){
	s_y = A[2][2];
	s_x = D/s_y;
}
else if(pos("Y")<pos("X")){
	s_x = A[1][1];
	s_y = D/s_x;
}
if(pos("X")<pos("S")){
	h_x = A[1][2]/s_y;//X<S
}
else if(pos("S")<pos("X")){
	h_x = A[1][2]/s_x; //S<X
}
if(pos("Y")<pos("S")){
	h_y = A[2][1]/s_x; //Y<S
}
else if(pos("S")<pos("Y")){
	h_y = A[2][1]/s_y; //S<Y
}
```

### S,X; S,Y
группа разложений, где R не в середине

$$
SX = \begin{pmatrix}s_x & h_xs_x \\ 0 & s_y\end{pmatrix};\;
XS = \begin{pmatrix}s_x & h_xs_y \\ 0 & s_y\end{pmatrix};\;
SY = \begin{pmatrix}s_x & 0 \\ h_ys_y & s_y\end{pmatrix};\;
YS = \begin{pmatrix}s_x & 0 \\ h_ys_x & s_y\end{pmatrix};
$$

$$
\begin{cases}
	\begin{cases}
		a_{11}^2 + a_{21}^2 = s_x^2, \\
		\sin\alpha = a_{21}/s_x,\\
		\cos\alpha = a_{11}/s_x,
	\end{cases}, & R(sx);\\
	\begin{cases}
		a_{21}^2 + a_{22}^2 = s_y^2, \\
		\sin\alpha = a_{21}/s_y,\\
		\cos\alpha = a_{22}/s_y,
	\end{cases} & (sx)R;\\
	\begin{cases}
		a_{12}^2 + a_{22}^2 = s_y^2,\\
		\sin\alpha = -a_{12}/s_y,\\
		\cos\alpha = a_{22}/s_y,
	\end{cases} & R(sy);\\
	\begin{cases}
		a_{11}^2 + a_{12}^2 = s_x^2,\\
		\sin\alpha = -a_{12}/s_x,\\
		\cos\alpha = a_{11}/s_x,
	\end{cases} & (sy)R;
\end{cases}
$$

$$\begin{cases}
	h_x s_x\cos\alpha - s_y\sin\alpha = a_{12}, & RSX;\\
	h_x s_y\cos\alpha - s_y\sin\alpha = a_{12}, & RXS;\\
	h_x s_x\cos\alpha - s_x\sin\alpha = a_{12}, & SXR;\\
	h_x s_y\cos\alpha - s_x\sin\alpha = a_{12}, & XSR.
\end{cases}$$

$$\begin{cases}
	h_y s_y\cos\alpha + s_x\sin\alpha = a_{21}, & RSY;\\
	h_y s_x\cos\alpha + s_x\sin\alpha = a_{21}, & RYS;\\
	h_y s_y\cos\alpha + s_y\sin\alpha = a_{21}, & SYR;\\
	h_y s_x\cos\alpha + s_y\sin\alpha = a_{21}, & YSR.
\end{cases}$$

```JavaScript

let sigx = (V & 1) ? -1 : 1;
let sigy = sign(D)*sigx;

if(pos("X")){
	
	if(pos("R")===1){
		s_x = sigx * sqrt(A[1][1]**2 + A[2][1]**2); // pm
		s_y = D/s_x;

		cosa = A[1][1]/s_x;
		sina = A[2][1]/s_x;

		if(pos("S")<pos("X")){
			h_x = (A[1][2] + s_y*sina)/(s_x*cosa);
		}
		else if(pos("X")<pos("S")){
			h_x = (A[1][2] + s_y*sina)/(s_y*cosa);
		}
	}
	else if(pos["R")===3){
		s_y = sigy * sqrt(A[2][1]**2 + A[2][2]**2); // pm
		s_x = D/s_y;

		sina = A[2][1]/s_y;
		cosa = A[2][2]/s_y;
		if(pos("S")<pos("X")){
			h_x = (A[1][2] + s_x*sina)/(s_x*cosa);
		}
		else if(pos("X")<pos("S")){
			h_x = (A[1][2] + s_x*sina)/(s_y*cosa);
		}
	}
}
else if(pos("Y")){
	if(pos("R")===1){
		s_y = sigy * sqrt(A[1][2]**2 + A[2][2]**2); // pm
		sina = -A[1][2]/s_y;
		cosa = A[2][2]/s_y;
		s_x = D/s_y;
		
		if(pos("S")<pos("Y")){
			h_y = (A[2][1] - s_x*sina)/(s_y*cosa);
		}
		else if(pos("Y")<pos("S")){
			h_y = (A[2][1] - s_x*sina)/(s_x*cosa);
		}
	}
	else if(pos("R")===3){
		s_x = sigx * sqrt(A[1][1]**2 + A[1][2]**2); //pm
		cosa = A[1][1]/s_x;
		sina = -A[1][2]/s_x;
		s_y = D/s_x;

		if(pos("S")<pos("Y")){
			h_y = (A[2][1] - s_y*sina)/(s_y*cosa);
		}
		else if(pos("Y")<pos("S")){
			h_y = (A[2][1] - s_y*sina)/(s_x*cosa);
		}
	}
}

```

### R


Введём дополнительное обозначение

$$T = \cos\alpha\sin\alpha;$$

Образуется общая для группы часть расчета:

$$\sin(2\alpha) = 2T;$$

$$\cos(2\alpha) = \pm \sqrt{1-4T^2};$$

$$\cos\alpha = \pm \sqrt{\frac{1 + \cos(2\alpha)}{2}};$$

$$\sin\alpha = \frac{T}{\cos\alpha}.$$


$$SRX = 
\begin{pmatrix}
	{s_x}\cos\alpha  & \left({h_x} \cos\alpha -\sin\alpha\right)  {s_x}\\
	{s_y}\sin\alpha  & \left({h_x} \sin\alpha +\cos\alpha\right)  {s_y}
\end{pmatrix}
$$


$$T = \frac{a_{11}a_{21}}{\det{A}};$$

$$s_x = \frac{a_{11}}{\cos\alpha};$$


\[{h_x}=\frac{{s_x} \sin\alpha+{a_{12}}}{{s_x} \cos\alpha}\]


$$XRS = \begin{pmatrix}
	{h_x} {s_x} \sin\alpha + {s_x} \cos\alpha & {h_x} {s_y} \cos\alpha-{s_y} \sin\alpha\\
	{s_x} \sin\alpha & {s_y} \cos\alpha
\end{pmatrix}$$

$$T = \frac{a_{21}a_{22}}{\det A};$$

$$s_y = \frac{a_{22}}{\cos\alpha};$$

\[{h_x}=\frac{{s_y} \sin\alpha+{a_{12}}}{{s_y} \cos\alpha}\]


$$YRS = \begin{pmatrix}
{s_x} \cos\alpha & -{s_y} \sin\alpha\\
{h_y} {s_x} \cos\alpha+{s_x} \sin\alpha & {s_y} \cos\alpha-{h_y} {s_y} \sin\alpha
\end{pmatrix}$$

$$T = -\frac{a_{11}a_{12}}{\det A};$$

$$s_x = \frac{a_{11}}{\cos\alpha};$$

\[{h_y}=-\frac{{s_x} \sin\alpha-{a_{21}}}{{s_x} \cos\alpha}\]




$$SRY =
\begin{pmatrix}
\left( \cos\alpha-{h_y} \sin\alpha\right)  {s_x} & -{s_x} \sin\alpha\\
\left( {h_y} \cos\alpha+\sin\alpha\right)  {s_y} & {s_y} \cos\alpha
\end{pmatrix}
$$

$$T = -\frac{a_{12}a_{22}}{\det A};$$

$$s_y = \frac{a_{22}}{\cos\alpha};$$

\[{h_y}=-\frac{{s_y} \sin\alpha-{a_{21}}}{{s_y} \cos\alpha}\]

```javaScript
let T;
if(P === "SRX"){
	T = A[1][1]*A[2][1]/D;
}
else if(P === "XRS"){
	T = A[2][1]*A[2][2]/D;
}
else if(P === "YRS"){
	T = -A[1][1]*A[1][2]/D;
}
else if(P === "SRY"){
	T = -A[1][2]*A[2][2]/D;
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
	let cos2a = sig2 * sqrt(1-4*T**2); // pm
	cosa = sig1 * sqrt(0.5 + cos2a/2); // pm

	sina = T/cosa;
}

if(P === "SRX"){
	s_x = A[1][1]/cosa;
	s_y = D/s_x;
	h_x = (A[1][2] + s_x sina)/(s_x*cosa);
}
else if(P === "XRS"){
	s_y = A[2][2]/cosa;
	s_x = D/s_y;
	h_x = (A[1][2] + s_y*sina)/(s_y*cosa);
}
else if(P === "YRS"){
	s_x = A[1][1]/cosa;
	s_y = D/s_x;
	
	h_y = (A[2][1] - s_x*sina)/(s_x*cosa);
}
else if(P === "SRY"){
	s_y = A[2][2]/cosa;
	s_x = D/s_y;

	h_y = (A[2][1] - s_y*sina)/(s_y*cosa);
}

```

