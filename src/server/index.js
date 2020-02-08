//INFO: servidor estandar para demos y clientes simples

//OjO! cuidar seguridad, limpiar SIEMPRE nombres de archivo y solo dejar subir extensiones SEGURAS, sin ".." ni barras ni caracteres que no sean a-zA-Z0-9_ en el nombre
//OjO! cuidar tamaño maximo en uploads
//OjO! nunca poner nombres ni datos de clientes

//TODO: declarar con 'var' TODAS las variables que NO deben ser globales!!!
//TODO: funciones asincronas name_a
//TODO: validar y formatear json recibido?
//TODO: algun tipo de token, no pisar archivos sin asegurarse que la fuente es confiable ...

//----------------------------------------------------------
//S: dependencias
var express= require('express');
var bodyParser= require('body-parser');
var os= require('os'); //A: para interfases
var fs= require('fs');
var fileUpload= require('express-fileupload');
var _path= require('path');
var crypto= require('crypto');
var fsExtra= require('fs-extra');
var shell= require('shelljs');
var open= require('open');
var basicAuth= require('express-basic-auth');

//----------------------------------------------------------
//S: config

CfgPortDflt= 8888; //U: el puerto donde escuchamos si no nos pasan PORT en el ambiente
CfgDbBaseDir= 'DATA'; //U: los datos se guardar aqui

CfgUploadSzMax= 50 * 1024 * 1024; //U: 50MB max file(s) size

CfgUsers={ //U: los usuarios y contraseñas que dejamos pasar //TODO: leer de archivo
	'admin':'PodemosAprender',//U: el usuario real que hace la demo
};

//------------------------------------------------------------------
//S: util

function timestamp(d) { return (new Date(d||Date.now())).toISOString(); }

function ser_json(o) { return JSON.stringify(o); }
function ser_json_r(s) { return JSON.parse(s); }
ser= ser_json;
ser_r= ser_json_r;

//U: una string de len BYTES al azar (crypto seguros)
function randomStr(len) { 
	const a = new Uint8Array(len);
	var r= Buffer.from(crypto.randomFillSync(a).buffer, a.byteOffset, a.byteLength).toString('hex');
	return r;
}

//U: hash para un string
// Other algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...depends on availability of OpenSSL on platform
//VER: https://gist.github.com/GuillermoPena/9233069
function stringHash(string, algorithm = 'sha256') {
	let shasum = crypto.createHash(algorithm);
	shasum.update(string)
	var hash = shasum.digest('hex')
	return hash;
}

//-------------------------------------------------------------------------------
//S: encriptar compatible con .net, java, etc.
var AES = {};
AES.encrypt= function(plaintext, key, iv) {
    var encipher = crypto.createCipheriv(EncryptAlgo, key, iv);
    return Buffer.concat([
        encipher.update(plaintext),
        encipher.final()
    ]);
}
AES.decrypt= function(encrypted, key, iv) {
    var decipher = crypto.createDecipheriv(EncryptAlgo, key, iv);
    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);
}

var EncryptAlgo= 'aes-256-cbc';

function encryptGenKey() { //U: generar una clave aleatoria
	return crypto.randomBytes(32).toString('base64');
}

function encrypt(textToEncrypt, key, iv) { //U: encriptar compatible con unity client, iv es opcional
	var ivBuffer= iv ? new Buffer(iv,'base64') : crypto.randomBytes(16);
	var keyBuffer= new Buffer(key,'base64');
	var enc= AES.encrypt(textToEncrypt, keyBuffer, ivBuffer);
	if (false) { //DBG
		console.log('iv (base64):', iv.toString('base64'));
		console.log('key (base64):', key.toString('base64'));
		console.log('value:', textToEncrypt);
		console.log('encrypted: ', enc.toString('base64'));
	}
	return ivBuffer.toString('base64')+'='+enc.toString('base64'); //A: base64 siempre termina con UNO o DOS =, y solo aparecen al final => el primero antes de un caracter que NO es '=' es nuestro separador, pero la gilada no sabe ;)
}

function encrypt_r_Impl(textoEncriptado, key, iv) { 
	var ivBuffer= new Buffer(iv,'base64');
	var keyBuffer= new Buffer(key,'base64');
	var enc= new Buffer(textoEncriptado,'base64');
	var dec= AES.decrypt(enc, keyBuffer, ivBuffer);
	if (false) { //DBG
		console.log('iv (base64):', ivBuffer.toString('base64'));
		console.log('key (base64):', keyBuffer.toString('base64'));
		console.log('value:', textoEncriptado);
		console.log('decrypted: ' + dec.toString('utf8'));
	}
	return dec.toString('utf8')
}

function encrypt_r(textoEiv, key) { //U: desencriptar, la inversa de nuestra encrypt
	var parts= textoEiv.match(/(.*?)=([^=].*)/); //A: encrypt nos deja este separador para encontrar el iv al principio
	console.log("encrypt_r "+parts[1]+" "+parts[2]);
	return encrypt_r_Impl(parts[2],key,parts[1]);
}

//TEST
/*
function TEST_encrypt() {
	var T= 'Un Ñandú Feliz!';
	var key= encryptGenKey();
	var enc= encrypt(T,key);
	console.log('key: '+key);	
	console.log('enc: '+enc);	
	var dec= encrypt_r(enc,key);
	console.log('dec: '+dec);	
	console.log('isOk '+(T==dec));
}
TEST_encrypt();
*/

//-------------------------------------------------------------------------------
function ensureDir(rutaCarpetaSegura) { //U: crea el dir rutaCarpetaMision y todos los necesarios para llegar ahi
	fs.mkdirSync(rutaCarpetaSegura, {recursive: true});
}

//U: reemplaza extensiones de archivos no aceptadas y caracteres peligrosos por seguros
/*
limpiarFname("../../esoy un path \\Malvado.exe");
limpiarFname("TodoBien.json");
limpiarFname("TodoCasiBien.Json");
limpiarFname("Ok.mp3");
*/
function limpiarFname(fname, dfltExt) {
	//TODO: elegir cuales dejamos subir y cuales bajar
	var fnameYext= fname.match(/(.+?)(\.(mp4|mov|avi|mp3|wav|png|jpg|json|txt|md|pdf|lua|xml|dat))/) || ["", fname, dfltExt||""];
	//A: o tiene una extension aceptada, o le ponemos dfltExt o ""
	var fnameSinExt= fnameYext[1];
	var fnameLimpio= fnameSinExt.replace(/[^a-z0-9_-]/gi, "_") + fnameYext[2];
	//A: en el nombre si no es a-z A-Z 0-9 _ o - reemplazo por _ , y agrego extension aceptada
	return fnameLimpio;
}

function leerJson(ruta, dflt) {
	var r= dflt || null;
	try { r= JSON.parse(fs.readFileSync(ruta)); } //SEC:FS:READ
	catch (ex) { console.log("READ JSON ERROR "+ ruta +" "+ex) }
	return r;
}

function escribirJson(ruta, data) {
	var r= null;
	try { fs.writeFileSync(ruta, ser(data)); r=true; } //SEC:FS:WRITE
	catch (ex) { console.log("WRITE JSON ERROR "+ ruta +" "+ex) }
	return r;
}

//U: recibe la ruta de un archivo y devuelve un hash con el sha256
// Other algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...depends on availability of OpenSSL on platform
//VER: https://gist.github.com/GuillermoPena/9233069
function fileHash(filename, algorithm = 'sha256') {
	return new Promise((resolve, reject) => {
		let shasum = crypto.createHash(algorithm);
		try {
			let s = fs.ReadStream(filename); //SEC:FS:READ
			s.on('data', function (data) { shasum.update(data) })
			s.on('end', function () {
				var hash = shasum.digest('hex')
				return resolve(hash);
			});
		} catch (error) { return reject('calc fail'); }
	});
}

function obtenerHashArchivo(ruta, cb) {//U: recibe una ruta y un call back, devuelve el hash de un archivo
	if (!fs.existsSync(ruta) || fs.lstatSync(ruta).isDirectory()) { //SEC:FS:READ
		//A: archivo no existe o es una carpeta
		console.log("ruta: ", ruta, " No existe")
		return cb("not file or directory",null);
	}

	fileHash(ruta).then((hash) => {
		console.log("get file hash, ruta: " + ruta +" hash: " + hash);
		cb(null,hash)
		//A:  no se manda error en callback
	})
}

function leerContenidoCarpeta(ruta, omitirCarpetas, omitirArchivos) { //U: devuelve un array con los nombres de archivos y carpetas que contiene una ruta
	var r = new Array();
	if (ruta && fs.existsSync(ruta)){//SEC:FS:READ
		fs.readdirSync(ruta).forEach(item => { //SEC:FS:READ
			item = item || [];
			rutaCompleta = `${ruta}/${item}`

			if ((!omitirCarpetas || !fs.lstatSync(rutaCompleta).isDirectory()) && (!omitirArchivos || !fs.lstatSync(rutaCompleta).isFile())){
				r.push(item)
			}

		});
	}
	return r;
}

function filesAndHash(ruta, cb){//U: me devuelve todos los archivos y hashes de una ruta
	var r = {};
	if (ruta && fs.existsSync(ruta)){
		listaArchivos =  fs.readdirSync(ruta); //SEC:FS:READ
		hashPendingCnt = listaArchivos.length;
		//A: tengo una array con todos los archivos y CARPETAS dentro de ruta

		for (let index = 0; index < listaArchivos.length; index++) {
			rutaArchivo =  `${ruta}/${listaArchivos[index]}`;
			console.log("rutaArchivo: " , rutaArchivo);
			obtenerHashArchivo(rutaArchivo, (err, hash) => {
				hashPendingCnt--; //A: me falta uno menos

				if (err) { r[listaArchivos[index]]= 'error'; }
				else { r[listaArchivos[index]]= hash; }

				if (hashPendingCnt==0) { cb(r) } //A: si termine, llamo el cb con los hashes
			})
		}
	}
}

//U: guarda en rutaPfxSeguro/nombreSeguro varios archivos que llegan como parte de un post
function guardarArchivos(kvArchivos, rutaPfxSeguro, logPfx, cb){
	var hashPendingCnt= Object.keys(kvArchivos).length;
	var hashes= {};
	Object.values(kvArchivos).map(archivo => {
		//A : el tamaño maximo se controla con CfgUploadSzMax
		var nameOk = limpiarFname(archivo.name, ".dat"); //A: ruta carpeta limpia path (que no tenga .. exe js )
		var rutaArchivo = _path.join(rutaPfxSeguro, nameOk);

		archivo.mv( rutaArchivo, err => { //SEC:FS:WRITE
			//A: mostrar hash del archivo
			fileHash(rutaArchivo).then((hash) => {
				hashPendingCnt--; //A: me falta uno menos
				console.log((logPfx || "Guardar ") + "upload: " + rutaArchivo + " sz: " + archivo.size + " hash: " + hash);
				hashes[archivo.name]= hash;
				if (hashPendingCnt==0) { cb(hashes) } //A: si termine, llamo el cb con los hashes
			})
		})
	});
}

//----------------------------------------------------------
function isValidAuthToken(token) { //U: valida un token generado con genToken en el cliente
	if ( typeof(token) != 'string' || token.length < 4) return null; //A: token invalido

	var salt= token.substr(0,4); //A: nos la manda al principio del token
	var usuarioOK= Object.entries(CfgUsers).find( userYpass => {
		var tokenDeberiaSer= salt+stringHash(salt + userYpass[0] + userYpass[1]);
		//DBG: console.log("isValidAuthToken comparo : token " , token , " tokenDeberiaSer: " , tokenDeberiaSer);
		return tokenDeberiaSer == token; //A: Si el que nos mandaron con la salt hashea igual que el que tenemos guardado OK
	})
	return usuarioOK; //A: undefined o el usuario que coincide
}

verificarAuthBasic=  basicAuth({ //U: funcion middleware estandar para autenticar
	users: CfgUsers,
	unauthorizedResponse: 'error'
});


//TODO: usar token como en https://stackoverflow.com/a/42280739  en especial para los mp4 etc
var verificarAuth= function (req, res, next) { //U: como autenticamos y autorizamos
	var path= req.path;
	var token= req.query.tk; //U: aceptamos un hash = token en la url ejemplo para mp4
	console.log("verificarAuth path " + path + " token " + token);
	if ( isValidAuthToken(token) ) { next(); } //A: nos paso un token valido en la url, lo dejamos seguir
	else { //A: no nos paso token valido revisamos Header
		console.log("verificarAuth path " + path + " hdr Authorization " + req.header('Authorization'));
		verificarAuthBasic(req,res,next);
	}
};

//----------------------------------------------------------
function net_interfaces() { //U: conseguir las interfases de red
	//SEE: https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
	var r= {};
	var ifaces = os.networkInterfaces();
	Object.keys(ifaces).forEach(function (ifname) {
		var alias = 0;

		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family || iface.internal !== false) {
				return; //A: skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			}

			if (alias >= 1) { //A this single interface has multiple ipv4 addresses
					r[ifname + ':' + alias]= iface.address;
			} else { //A: this interface has only one ipv4 adress
					r[ifname]= iface.address;
			}
			++alias;
		});
	});

	// en0 -> 192.168.1.101
	// eth0 -> 10.0.0.101
	return r;
}

//----------------------------------------------------------
//--------------------------------------------------------------------
//S: inicializar app express
app = express();
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type'); // Request headers you wish to allow
    next(); // Pass to next layer of middleware
});
//A: le decimos a los browsers que aceptamos requests de cualquier origen, asi una pagina bajada de x.com puede acceder a nuestra api en y.com

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); //A: aceptamos application/json en los posts
app.use(fileUpload({
	abortOnLimit: true,
	responseOnLimit: "ERROR: Size Max " + CfgUploadSzMax,
	limits: { fileSize: CfgUploadSzMax },
}));
//A: accedemos a parametros de posts y uploads, con tamaño maximo controlado
//A: configuramos middleware de servidor web express, y defaults


//S: funciones comunes para express
function returnNotFound(res){ res.status(404).send("not found"); }


//VER: http://expressjs.com/en/starter/static-files.html
app.use('/ui', express.static(__dirname + '/../ui'));
app.use('/app', express.static(__dirname + '/../app'));
app.use('/node_modules', express.static(__dirname + '/../../node_modules'));

//U: si no pidio /api que entre a la Single Page App de la UI
app.get('/', function(req, res) { res.redirect('/ui/'); });
//SEE: http://expressjs.com/en/starter/basic-routing.html


//------------------------------------------------------------
//S: API estandar, todos los proyectos

//U: responder para cuando cliente busca servidor escaneando la red
//TEST: H=`curl 'http://localhost:8888/api/isPodemosAprender?nonce=MiSecretoComoCliente1'`; if [ "$H" == "bc86f7dfe95687c6faf5a632b790c458" ] ; then echo "OK" ; fi
//TEST: H=`curl 'http://localhost:8888/api/isPodemosAprender?nonce=MiSecretoComoCliente2'`; if [ "$H" == "98b2a107561e8d5cdfd997efdc599268" ] ; then echo "OK" ; fi
app.get('/api/isPodemosAprender', verificarAuth,  (req, res) => {
	var clientNonce= req.query.nonce || 'thisMayBeASecret'; //A: el cliente manda un texto al azar
	console.log('Scan nonce: '+clientNonce);
	var hash= stringHash(clientNonce + '\t' + CfgPodemosAprenderNonce);
	res.status(200).send(hash);
	//A: devolvemos un hash unico mezclando el nonce del cliente (al azar) Y el compartido
	//asi el cliente puede validar que el servidor es el que busca hashando lo mismo y comparando
	//TODO: agregar salt al hash
})

//-----------------------------------------------------------------------------------
//S: inicializar

//U: listen for requests
var listener = app.listen(process.env.PORT || CfgPortDflt, function() {
	var if2addr= net_interfaces();
	var k;
	for (k in if2addr) {
		var url = 'http://'+if2addr[k]+':'+listener.address().port;
	 	console.log(k+' : '+ url);
	}
	if (process.env.BROWSER!="NO") { open(url); } //A: lanzamos el browser por defecto
});

