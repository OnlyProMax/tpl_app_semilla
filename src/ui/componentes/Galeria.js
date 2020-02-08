// INFO: componente que dibuja una galeria con un array de fotos que le pasan
uiGalleriaImagenes= CmpDef(function (my) {
	var imagenes = [
        'https://images.freeimages.com/images/large-previews/3a6/rain-on-sea-ii-1368899.jpg',
        'https://cdn.pixabay.com/photo/2020/01/11/13/22/freedom-4757533_1280.jpg',
        'https://cdn.pixabay.com/photo/2020/01/21/11/39/running-4782721_1280.jpg',
        'https://images.freeimages.com/images/large-previews/3a6/rain-on-sea-ii-1368899.jpg',
        'https://cdn.pixabay.com/photo/2020/01/11/13/22/freedom-4757533_1280.jpg',
        'https://cdn.pixabay.com/photo/2020/01/21/11/39/running-4782721_1280.jpg',
    ]

    var imagenes= my.props.imagenes || imagenes;

    const styleImage={
        cursor: 'pointer'
      }    

      function HandleImageGalleryClick(e){
        my.setState({imgSelected: e.target.src})
      }
    
	my.render= function (props,state) {
		return (
			h(Container, {},
                h(Header,{textAlign:'center'},'Galeria'),
                h(Image.Group, {size: 'small'},
                imagenes.map( imagenUrl=> {
                    return h(Image, {style:{...styleImage}, src: imagenUrl, onClick: (e)=> HandleImageGalleryClick(e)},)
                })
                ),
                my.state.imgSelected 
                    ? h(Image, {src:my.state.imgSelected}, )
                    : h('h1',{}, 'Seleccion una imagen')
            )
		);
	}
});
