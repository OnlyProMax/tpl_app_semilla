//S: server and files cfg
ServerUrl= location.href.match(/(https?:\/\/[^\/]+)/)[0]; //A: tomar protocolo, servidor y puerto de donde esta esta pagina
ApiUrl= ServerUrl+'/api';
//TODO: actualizar todas las de abajo

//colores rgb de la empresa BLK
COLORS= {
  azulOscuro: 'rgb(56,87,162)',
  azulClaro: 'rgb(105,178,226)',
  gris: 'rgb(194,195,201)',
}

LAYOUT= {
  SMART_BG_COLOR : COLORS.gris //A: el fondo la pagina para el sitio 
}

VIDEO_ICON_URL = '/ui/imagenes/video_play.png'

//S: globales
var Usuario= ''; //el nombre que se ingreso en el formulario de ingreso
var Password= '';

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

function credentialsSave() {
	localStorage.setItem('usuario', Usuario);
	localStorage.setItem('password', Password);
}

function credentialsLoad() {
	if (!Usuario){
		Usuario = localStorage.getItem('usuario');
		Password = localStorage.getItem('password');
	}
	return Usuario;
}

function genToken() { //U: genera un token unico para autenticarse con el servidor
  var salt= Math.floor((Math.random() * 10000000)).toString(16).substr(0,4);
  var token= salt+CryptoJS.SHA256(salt + Usuario + Password).toString(); //TODO: defenir stringHash() como en el server //TODO: EXPIRAR el token!!!
  return token;
}

/************************************************************************** */
var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti".split(' ');

function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}

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
	return FetchUrl(url, Usuario, Password, quiereJsonParseado, data);
}

async function PostUrl(url, quiereJsonParseado, data) {
	return FetchUrl(url, Usuario, Password, quiereJsonParseado, data, 'POST');
}

//------------------------------------------------------------
uiHome= MkUiComponent(function uiHome(my){ //U: pantalla principal cuando ya te logueaste
	my.render= function () {
		return 'Hola'
	}	
});

uiLogin= MkUiComponent(function uiLogin(my){ //U: formulario de ingreso 

  tecleando= (e, { name, value }) => my.setState({[name]: value});
  enviarFormulario= () => {
    
    Usuario= my.state.nombre.trim();
    Password= my.state.password.trim();

    if(Usuario !='' && Usuario != null & Usuario != undefined){
      if(my.state.password !='' && my.state.password != null & my.state.password != undefined)
			credentialsSave();
      preactRouter.route("/home")
    }
  }

  my.render = function(){
    return (
      h(Grid,{textAlign:'center', style:{ height: '100vh' }, verticalAlign:'middle'},
        h(Grid.Column, {style: {maxWidth: 450}},
          h(Image,{style: {width: "10em", height: "10em", margin: 'auto'}, src:'./imagenes/logo.png'},), 
          h(Form,{size:'large',onSubmit: enviarFormulario },
            h(Segment,{stacked:true},
              h(Form.Input,{name: 'nombre',onChange: tecleando , fluid:true, icon:'user', iconPosition:'left', placeholder:'E-mail address',value: my.state.nombre}),
              h(Form.Input,{name: 'password', onChange: tecleando,fluid:true, icon:'lock',iconPosition:'left',placeholder:'Password',type:'password',value: my.state.password}),
              h(Button,{color:'blue', fluid:true,size:'large'},"Login")  //onClick: () =>preactRouter.route("/menu")
            )
          )  
        )
      )
    )
  }
});

//------------------------------------------------------------
uiMenuTopbar= MkUiComponent(function uiMenuTopbar(my) {//U: menu principal de la parte superior 
  my.render= function (props, state) {
    return (
      h(Menu,{item:true,stackable:true,style:{backgroundColor: 'rgb(255, 255, 255)',backgroundColor: 'rgb(48,53,66)'}},
        h('img',{src: './imagenes/logoBlanco.png',style:{width:"180px",height:'60px',"margin-top":"3px"}}),
        
        h(Menu.Menu,{position:'right'},
          h(Menu.Item,{},
            h(Icon,{name:'user',size:'big',style:{'color': COLORS.azulOscuro}}),
            h('p',{style:{'color': COLORS.azulOscuro}}, `Welcome ${Usuario ? Usuario : ''}`,)
            
          ),
          h(Menu.Item,{},            
            h(Button, {onClick: resetDemo, style:{'background-color': '#600000','color':'rgb(255,255,255)',}},"reset" ),
          ),
          h(Menu.Item,{},
            h(Button, {onClick: () =>preactRouter.route("/"), style:{'background-color': COLORS.azulClaro,'color':'rgb(255,255,255)'}},"Log Out" ),
          ),
          h(Menu.Item,{},
            h(Button, {onClick: () =>preactRouter.route("/cfg/create"), style:{'background-color': COLORS.azulClaro,'color':'rgb(255,255,255)'}},"Devices" ),
          ),
           h(Menu.Item,{},
            h(Button, {icon: true,labelPosition:'left',onClick: props.onRefresh, color: 'green'},
              h(Icon,{name:'refresh'}),
              "Refresh" 
            )
          )
        ),
      )
		);
  }
});

//-----------------------------------------------------------------------------
//S: Mostrar Datos en formato estandar 
//VER: https://docs.google.com/document/d/1ZnnGSZLeX1SYTvjsvvmhe1z21vxmIAXjTG0LaQYvWUQ/edit#
function QR(str) { //U: genera un objeto QR para generar distintos formatos de grafico para la str recibida como parametro
  var typeNumber = 10; //U: cuantos datos entran VS que calidad requiere, con 10 y las tabletas baratas de VRN escaneando monitor laptop funciona ok, entran mas de 150 bytes
  var errorCorrectionLevel = 'L'; //U: mas alto el nivel de correcion, menos fallas pero menos datos, con L funciona ok
  var qr= qrcode(typeNumber, errorCorrectionLevel);
  qr.addData(str);
  qr.make();
  return qr
}

function QRGenerarTag(str) { //U: devuelve un tag html "img" con el QR para str
  return QR(str).createImgTag();
}

function QRGenerarData(str) { //U: devuelve la data url para usar en un tag img con el QR para str
	return QR(str).createDataURL();
}

function TokenValidate(token, cb) { //U: validar token con servidor
	GetUrl(CfgTokenUrl+'/'+token,"text").then( tokDataStr => {
		console.log("uiTokenQRData servidor "+tokDataStr);
		if (tokDataStr=='ERROR') { //A: req OK, pero error del token
			cb({isError: 'TOKEN NO VALIDO', token: token}) 
		} 
		else if (tokDataStr.match('"created_fh":')) {//A: OK, datos del token
			cb({tokData: JSON.parse(tokDataStr), token: token}) 
		} 
		else {
			cb({isError: 'ERROR SERVIDOR, REINTENTE', token: token})
		}
	});
	//A: consultar servidor, puede dar ERROR si el token no es valido
}

uiTokenQRData= MkUiComponent(function uiTokenQRData(my){ //U: mostrar datos de un token
  my.render = function uiTokenQRData_render(props,state) {
		console.log("uiTokenQRData render", props, state)
		if (props.token != state.token) { //A: todavia no validamos
			TokenValidate(props.token, (r) => { if (r.token==props.token) my.setState(r) }); //A: validar token con servidor y actualizar
		}

    return (
			h('div',{style: {textAlign: "center"}},
				h('h1',{},
					state.tokData ? 'Token valido' : 
					state.isError ? state.isError :
					 'Validando con servidor ...'),
				state.tokData ? h(null,{},
				h('img',{src: QRGenerarData(state.tokData.cfgData), style: {width: '15em', height: '15em', marginBottom: '2em'}},''),
				h('div',{},
					h('h3',{},'Cfg Data'),
					h('p',{style: 'overflow-wrap: break-word;'},state.tokData.cfgData), 
					h(Button,{onClick: () => copyToClipboard(state.tokData.cfgData)}, 'Copy')
				),
				state.tokData ? h('pre',{}, JSON.stringify(state.tokData,null,1) ) : '',
				) : ''
			)
		)
	}
});

//----------------------------------------------------------
uiDataMensaje= MkUiComponent(function uiDataMensaje(my){ //U: como tomar parametros de la ruta
  my.render = function(props){
    console.log("InstanciaID: " + props.matches.instancia + " mensajeID: " + props.matches.msg_id);
    //A: tengo la instancia y el mensaje_id con esta info le pido al servidor que mensajes tiene
    return (
			h("div",{},
				h("h1",{},"TODO:uiDataMensaje"),
				h("p",{},"de la url " + ser_json(props)),
				h("a",{onClick: () => preactRouter.route("/data/queGenios/msg/ganamos"),},"Otro mensaje usando route"),
				" ",
				h("a",{href: "#/data/queGenios/msg/ganamosViaHRef",},"Otro mensaje usando href"),
			)
		)
	}
});

//VER: https://docs.google.com/document/d/1ZnnGSZLeX1SYTvjsvvmhe1z21vxmIAXjTG0LaQYvWUQ/edit#
function ImageCreateLink(instancia, mission, file){ //A: crea una url para pedir un archivo
  return `${ApiUrl}/TODO_DONDE/${file}?tk=${genToken()}` 
}

//-----------------------------------------------------------------------------
//S: principal

Rutas= { //U; RUTA DE PREACT ROUTE
  "/":{cmp: uiLogin},
	"/home":{cmp: uiHome},
}

App= MkUiComponent(function App(my) {
  my.componentWillMount = function () {
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundColor =  LAYOUT.SMART_BG_COLOR;
  }
  //A: cambio el color del fondo
 
  my.render= function (props, state) {
    return (
      h('div', {id:'app'},
				h(preactRouter.Router, {history: History.createHashHistory()},
					Object.entries(Rutas).map( ([k,v]) => 
						h(v.cmp, {path: k, ...v}) //A: el componente para esta ruta
          ),
				), //A: la parte de la app que controla el router
				//VER: https://github.com/preactjs/preact-router
			)
		);
  }
});

//-----------------------------------------------------------------------------
//S: inicio
setTheme('chubby');
render(h(App), document.body);
//A: estemos en cordova o web, llama a la inicializacion
