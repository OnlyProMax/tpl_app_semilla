//INFO: punto de entrada de la parte que se ejecuta en la web

//------------------------------------------------------------
function scr_home(my){ //U: pantalla principal cuando ya te logueaste
	my.render= function () { return 'Hola PodemosAprender' }	
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
