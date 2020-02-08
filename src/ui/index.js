//INFO: punto de entrada de la parte que se ejecuta en la web

//------------------------------------------------------------
//S: mover a lib
function fLog(msg,fToCallAfter) { //U: devuelve una funcion, que al llamarla loguea mensaje y los parametros
	return function (p1,p2) { console.log(msg,p1,p1); }
}

function fAppGoTo(link) { //U: una funcion para ir a un link que se puede poner en onClick
	return function () { appGoTo(link); }
}

//------------------------------------------------------------
function scr_home(my){ //U: pantalla principal cuando ya te logueaste
	my.render= function () { 
		return h('div',{},
			'Hola PodemosAprender!',
			h(Button,{onClick: () => appGoTo('/radio')},'radio!'),
		);
	}
}

function cmp_audio(my) { //U: un componente para reproducir audio
	my.render= function cmp_audio_render(props) {
		//eventos interesates onEnded: fLog("ended"), onLoadedmetadata: fLog("load")
		//SEE: https://www.w3schools.com/tags/ref_av_dom.asp
		return h('audio',{controls: true, ... props},
				h('source',{src: props.src , type: "audio/ogg"})
		);
	}
}

RADIO_URL="https://www.podemosaprender.org/data_radio/"
RadioIdx= null; //DFLT
function radioFecth(wantsReload) {
	if (RadioIdx && !wantsReload) { return new Promise(cb => cb(RadioIdx)) }
	//A: si ya lo tenia, lo devolvi, sino lo busco
	return fetch(RADIO_URL)
		.then(r => r.text())
		.then(t => { 
			RadioIdx= {}; 
			t.match(/<p>[^<]*/g) //A: array con todo desde <p>hasta<
			.forEach( f => {
				var parts= f.split("/"); parts.shift(); //A: tiro <p>.
				if (parts[1].match(/.ogg/)) { return } //A: no quiero los audios de entrada y salida
				var programa= RadioIdx[parts[1]] || {titulo: parts[1], audios: []};
				RadioIdx[parts[1]]= programa; //A: seguro lo guarde e inicialice
				programa.audios.push(RADIO_URL+'/'+parts.join('/'));
			});
			return RadioIdx;
		});
}

function scr_radio_$programa(my) { //U: escuchar la radio, un programa, radio/miprograma
	var wantsPlay= false;
	var audios= null;

	function audioOnLoadedMetadata(e) {
		wantsPlay= true;
		//audioDuration: e.target.duration, 
		//TODO: no puedo cambiar estado en este evento porque vuelve a hacer render, y elemento de audio pierde estado, carga de nuevo, etc.
	}

	function audioOnEnded() {
		if (my.state.audioIdx<audios.length-1) {
			my.setState({audioIdx: my.state.audioIdx+1}); //A: actualizar
		}
		else {
			my.setState({audioDone: true}); //A: actualizar
		}
	}

	function volverAEscuchar() {
		wantsPlay= true;
		my.setState({audioIdx: 0, audioDone: false});
	}

	my.componentWillMount= function () {
		radioFecth().then(() => my.setState({indexLoaded: true})); //A: cargue lista de programas
	}

	my.render= function (props, state) { 
		state.audioIdx= state.audioIdx || 0; 
		programa= props.matches.programa;
		audios= RadioIdx && RadioIdx[programa] && RadioIdx[programa].audios
		console.log("Radio programa="+programa+" audios="+audios);

		return h('div',{},
			h('h1',{},'Radio PodemosAprender'),
			h('h2',{},programa),
			state.indexLoaded 
				? state.audioDone 
					? h(Button,{onClick: volverAEscuchar},'Volver a escuchar') 
					: h('div',{},
							h('h4',{},"(" + state.audioIdx + "/" + audios.length+") "+audios[state.audioIdx]),
							h(Cmp.audio,{src: audios[state.audioIdx], onEnded: audioOnEnded, onLoadedmetadata: audioOnLoadedMetadata, autoplay: wantsPlay}),
							h('div',{},
								h(Button,{onClick: audioOnEnded},'Próximo') 
							)
						)
				: 'Cargando programa '+programa,
			h(Button,{onClick: fAppGoTo('/radio')},'Volver a la lista')
		);
	}
}

function scr_radio(my) { //U: escuchar la radio, ver programas
	my.componentWillMount= function () {
		radioFecth().then(() => my.setState({indexLoaded: true})); //A: cargue lista de programas
	}

	my.render= function (props, state) { 
		return h('div',{},
			h('h1',{},'Radio PodemosAprender'),
			state.indexLoaded 
				? Object.keys(RadioIdx).map( k => h('p',{},h('a',{onClick: fAppGoTo('/radio/'+k)},k)) )
				: 'Cargando programas ...'
		);
	}

}

function scr_login(my){ //U: formulario de ingreso 
  var tecleando= (e, { name, value }) => my.setState({[name]: value});
	toState= (k) => { return { name: k, value: my.state[k], onChange: tecleando} };

  var enviarFormulario= () => {
    Auth_usr= my.state.nombre.trim();
    Auth_pass= my.state.password.trim();

    if(Auth_usr !='' && Auth_usr != null & Auth_usr != undefined){
      if(my.state.password !='' && my.state.password != null & my.state.password != undefined)
			auth_save();
      appGoTo("/home")
    }
  }

  my.render= function(){
    return (
      h(Grid,{textAlign:'center', style:{ height: '100vh' }, verticalAlign:'middle'},
        h(Grid.Column, {style: {maxWidth: 450}},
          h(Image,{style: {width: "10em", height: "10em", margin: 'auto'}, src:'./imagenes/logo.png'},), 
          h(Form, {size:'large',onSubmit: enviarFormulario },
            h(Segment,{stacked:true},
              h(Form.Input,{name: 'nombre',onChange: tecleando , fluid:true, icon:'user', iconPosition:'left', placeholder:'E-mail address',value: my.state.nombre}),
              h(Form.Input,{name: 'password', onChange: tecleando, fluid:true, icon:'lock',iconPosition:'left',placeholder:'Password',type:'password',value: my.state.password}),
              h(Button,{color:'blue', fluid:true,size:'large'},"Login")  //onClick: () =>appGoTo("/menu")
            )
          )  
        )
      )
    )
  }
}

//------------------------------------------------------------
uiMenuTopbar= CmpDef(function uiMenuTopbar(my) {//U: menu principal de la parte superior 
  my.render= function (props, state) {
    return (
      h(Menu,{item:true,stackable:true,style:{backgroundColor: 'rgb(255, 255, 255)',backgroundColor: 'rgb(48,53,66)'}},
        h('img',{src: './imagenes/logoBlanco.png',style:{width:"180px",height:'60px',"margin-top":"3px"}}),
        
        h(Menu.Menu,{position:'right'},
          h(Menu.Item,{},
            h(Icon,{name:'user',size:'big'}),
            h('p',{}, `Welcome ${Auth_usr ? Auth_usr : ''}`,)
          ),
          h(Menu.Item,{},            
            h(Button, {onClick: resetDemo},"reset"),
          ),
          h(Menu.Item,{},
            h(Button, {onClick: props.onRefresh, icon: true, labelPosition:'left',},
            h(Icon,{name:'refresh'}), 
						"Refresh" )
          )
        ),
      )
		);
  }
});

//----------------------------------------------------------
function ImageCreateLink(instancia, file){ //U: crea una url para pedir un archivo
  return `${ApiUrl}/TODO_DONDE/${file}?tk=${auth_token()}` 
}

//-----------------------------------------------------------------------------
//S: inicio
Routes["/"]= {cmp: "scr_login"}
AppStart();
