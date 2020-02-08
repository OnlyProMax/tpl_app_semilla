//INFO: vars globales, inicializa, libreria, etc.

var { Component, h, render } = window.preact;
var { Accordion, Card, Divider, Responsive, Grid, Table, Dropdown ,Label ,Select ,Header, Icon, Image, Menu, Segment, Sidebar, Modal, Button, Input, List, Item, Container, Form, Message }= window.semanticUIReact; //U: para acceder directamente ej. con h(Button ....)
var Cmp= window.semanticUIReact; //U: para acceder con Cmp.Button, a todos de una (MEJOR)

render_str= preactRenderToString; //U: genera el html para un componente

function CmpDef(f, proto) { //U: definir un componente de UI que se puede usar como los otros de pReact+Semantic ej. Button, le pasa una variable "my" como parametro a "f" ej. para hacer "my.render= ..."
	proto= proto || Component;
	var myComponentDef= function (...args) {
		var my= this; //A: I want my closueres back!
		proto.apply(my,args);  //A: initialize with parent
		my.toProp= function (name) { return (e) => { my[name]= e.target.value; } }
		//U: para usar con onChange u onInput
		
		f.apply(my,[my].concat(args));
		//A: llamamos la funcion que define el componente
	}
	myComponentDef.prototype= new proto(); 
	return myComponentDef;
}

UiNA= () => h('div',{},'UiNA:NOT IMPLEMENTED');

/************************************************************************** */
//S: colores y formatos UI
var UiThemes= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti".split(' '); //U: vienen preinstalados!

function UiSetTheme(nombre) { //U: activar este tema de ui (colores, tamaños, etc.)
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+nombre+'.min.css';
}

COLOR= { } //U: para definir colores por nombre o funcion, ej. "FONDO" y poder cambiarlos
COLOR.azulOscuro= 'rgb(56,87,162)';
COLOR.azulClaro= 'rgb(105,178,226)';
COLOR.gris= 'rgb(194,195,201)';

LAYOUT= { //U: para poder definir directamente CSS y cambiarlo desde cfg
	BG_COLOR : COLOR.gris //U: el fondo la pagina para el sitio 
}

VIDEO_ICON_URL= '/ui/imagenes/video_play.png'

/************************************************************************** */
//S: server and files cfg
Server_url= location.href.match(/(https?:\/\/[^\/]+)/)[0]; //A: tomar protocolo, servidor y puerto de donde esta esta pagina
Api_url= ServerUrl+'/api'; //U: la base de la URL donde atiende el servidor

var Auth_usr= ''; //U: que ingreso en el form login, se pueden usar ej. para acceder a server
var Auth_pass= '';

function auth_save() { //U: guardar usuario y pass ej. para recuperar si entra de nuevo o reload, NOTAR que solo se accede desde esta url, el store es "mas o menos" seguro
	localStorage.setItem('usuario', Auth_usr);
	localStorage.setItem('password', Auth_pass);
}

function auth_load() { //U: recuperar usuario y pass si se guardaron
	if (!Auth_usr){
		Auth_usr = localStorage.getItem('usuario');
		Auth_pass = localStorage.getItem('password');
	}
	return Auth_usr;
}

function auth_token() { //U: genera un token unico para autenticarse con el servidor ej. para cuando queres acceder directo a la url de una imagen o archivo para download desde un link
  var salt= Math.floor((Math.random() * 10000000)).toString(16).substr(0,4);
  var token= salt+CryptoJS.SHA256(salt + Auth_usr + Auth_pass).toString(); //TODO: defenir stringHash() como en el server //TODO: EXPIRAR el token!!!
  return token;
}

async function FetchUrl(url, usuario, password, quiereJsonParseado, data, method){ //U: hacer una peticion GET y recibir un JSON
  let response= await fetch(url,{
		method: method || 'GET', //U: puede ser POST
    headers: new Headers({
      'Authorization': 'Basic '+btoa(`${usuario}:${password}`), 
      'Content-Type': 'application/json',
    }),
		body: data!=null ? JSON.stringify(data): null,
  })
  if(quiereJsonParseado=="text") { return await response.text(); }
	else if (quiereJsonParseado) { return await response.json(); }

  return response;
}

async function GetUrl(url,quiereJsonParseado, data) {
	return FetchUrl(url, Auth_usr, Auth_pass, quiereJsonParseado, data);
}

async function PostUrl(url, quiereJsonParseado, data) {
	return FetchUrl(url, Auth_usr, Auth_pass, quiereJsonParseado, data, 'POST');
}


/************************************************************************** */
/****S: Util */

CopyToClipboardEl= null; //U: el elemento donde ponemos texto para copiar
function copyToClipboard(texto) { //A: pone texto en el clipboard
	if (CopyToClipboardEl==null) {
		CopyToClipboardEl= document.createElement("textarea");   	
		CopyToClipboardEl.style.height="0px"; 
		CopyToClipboardEl.style.position= "fixed"; 
		CopyToClipboardEl.style.bottom= "0"; 
		CopyToClipboardEl.style.left= "0"; 
		document.body.append(CopyToClipboardEl);
	}
	CopyToClipboardEl.value= texto;	
	CopyToClipboardEl.textContent= texto;	
	CopyToClipboardEl.select();
	console.log("COPY "+document.execCommand('copy')); 
	document.getSelection().removeAllRanges();
}

/************************************************************************** */
function JSONtoDATE(JSONdate) {  //U: recibe una fecha en formato json y devuelve un string con la fecha dia/mes/anio
	let fecha = new Date(JSONdate);
	if (isNaN(fecha)) return 'error en fecha'
	return  [fecha.getDate(), fecha.getMonth()+1, fecha.getFullYear()].map(n => (n+'').padStart(2,"0")).join("/");
	//A: ojo, Enero es el mes CERO para getMonth
}

function JSONtoHour(JSONdate) {
	let date = new Date(JSONdate);
	return [date.getHours(), date.getMinutes()].map(n => (n+'').padStart(2,"0")).join(":");
}             



