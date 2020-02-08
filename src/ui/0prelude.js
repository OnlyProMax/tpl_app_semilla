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
var UiThemes= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti".split(' '); //U: vienen preinstalados!

function UiSetTheme(nombre) { //U: activar este tema de ui (colores, tamaños, etc.)
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+nombre+'.min.css';
}


