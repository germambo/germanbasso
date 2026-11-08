/* ==========================================================================
   CONTENIDO DE vaso.ar
   Es el único archivo que hay que tocar para cambiar textos y obras.
   Las imágenes y los videos de cada obra los describe medios.js, que se
   genera solo con el script de medios.

   - El orden de la lista es el orden de la portada y del índice: la
     importancia la marca el orden.
   - Una obra con «oculta: true» queda guardada pero no aparece.
   - «acotacion» va solo en la ficha, debajo del título. En la portada, el
     estado va al final de «datos» (… · en desarrollo).
   - Cada texto puede ser un string o { es: '...', en: '...' }.
   ========================================================================== */

window.VASO = {

  firma: 'vaso',
  nombre: 'Germán Basso',
  // Lo que muestran Google y WhatsApp para vaso.ar sin obra elegida. Cada obra
  // arma la suya con sus datos y el comienzo de la sinopsis.
  descripcion: {
    es: 'Obras de Germán Basso, director de cine: Carrero, Qomí, Roca, Cosas Viejas y otros trabajos.',
    en: 'Films by Germán Basso, film director: Carrero, Qomí, Roca, Cosas Viejas and other work.'
  },
  contacto: {
    email: 'gerbasso@gmail.com',
    instagram: { usuario: '@germanbasso', url: 'https://www.instagram.com/germanbasso/' }
  },

  obras: [
    {
      id: 'carrero',
      titulo: 'Carrero',
      datos: { es: 'Largometraje · 2022 · 84 min · 2.35:1', en: 'Feature film · 2022 · 84 min · 2.35:1' },
      ver: { texto: { es: 'Ver película', en: 'Watch the film' }, sub: { es: 'Completa · 84 min', en: 'Full film · 84 min' }, yt: '1Yp5gZYMWew' },
      trailer: 'kMbPUt84vRg',
      ficha: {
        // La frase de la carátula de la ficha (en lugar de repetir los datos de la portada).
        frase: { es: 'Ale tiene 17 años y pierde su trabajo en un supermercado. Empieza a salir con Rengo, un carrero del barrio, a juntar lo que la ciudad tira.', en: 'Ale is 17 and loses his job at a supermarket. He starts going out with Rengo, a carrero from the neighborhood, to collect what the city throws away.' },
        linea: { es: 'Largometraje · 2022 · 84 min · 2.35:1', en: 'Feature film · 2022 · 84 min · 2.35:1' },
        sinopsis: {
          es: 'Ale tiene 17 años y pierde su trabajo en un supermercado. Empieza a salir con Rengo, un carrero del barrio, a juntar lo que la ciudad tira. Su madre y su amigo Gonza le advierten que ese camino es peligroso, pero a Ale le gusta el oficio y la amistad que va creciendo. Filmada en el barrio Malvinas de La Plata, con vecinos y vecinas como elenco.',
          en: 'Ale is 17 and loses his job at a supermarket. He starts going out with Rengo, a carrero from the neighborhood, to collect what the city throws away. His mother and his friend Gonza warn him the path is dangerous, but Ale enjoys the trade and the growing friendship. Shot in barrio Malvinas, La Plata, with neighbors as the cast.'
        },
        creditos: [
          [{ es: 'Dirección', en: 'Directed by' }, 'Germán Basso, Fiona Lena Brown'],
          [{ es: 'Guion', en: 'Screenplay' }, 'Leonardo Novak, Fiona Lena Brown, Germán Basso, Brian González'],
          [{ es: 'Fotografía', en: 'Cinematography' }, 'Fiona Lena Brown, Emilia Oldrino'],
          [{ es: 'Montaje', en: 'Editing' }, 'Germán Cantore, Germán Basso'],
          [{ es: 'Sonido', en: 'Sound' }, 'Valeria Berro, Valentín Mengascini, Hernán Biasotti'],
          [{ es: 'Música', en: 'Music' }, 'Luciana Casares, Magdalena Vitale Morillo, Marianela Diaz, Peces Raros, Florencia Urrutia'],
          [{ es: 'Producción', en: 'Producer' }, 'Germán Basso, La Cordillera Films'],
          [{ es: 'Elenco', en: 'Cast' }, 'Rodrigo Varela, Carlos Castillo, Aldana Jara, Sandra Nuñez, Matías González, Brian González']
        ],
        premios: [
          ['BAFICI 2022', { es: 'Premio estímulo al cine argentino, Competencia Internacional', en: 'Argentine Cinema Encouragement Award, International Competition' }],
          ['BAFICI 2022', { es: 'Premio ADF a la mejor dirección de fotografía: Emilia Oldrino y Fiona Lena Brown', en: 'ADF Award for Best Cinematography: Emilia Oldrino and Fiona Lena Brown' }],
          ['BAFICI 2022', { es: 'Primera mención SIGNIS', en: 'SIGNIS First Mention' }],
          ['Panorama, Bahía', { es: 'Mejor largometraje, Competencia Internacional', en: 'Best Feature, International Competition' }],
          ['Tandil', { es: 'Mejor largometraje', en: 'Best Feature' }],
          ['Tandil', { es: 'Mejor actor: Carlos Castillo', en: 'Best Actor: Carlos Castillo' }],
          ['FESAALP', { es: 'Mejor largometraje', en: 'Best Feature' }],
          ['Leonardo Favio, Bolívar', { es: 'Mejor largometraje', en: 'Best Feature' }],
          ['Festifreak', { es: 'Mejor actriz: Aldana Jara', en: 'Best Actress: Aldana Jara' }],
          ['SEMINCI 2022', { es: 'Selección, Valladolid', en: 'Official selection, Valladolid' }]
        ],
        criticas: [
          { cita: 'una honestidad brutal, una credibilidad, una autenticidad que no abundan', autor: 'Diego Batlle', medio: 'Otros Cines' },
          { cita: 'el aire de verdad que transpira un elenco conformado por vecinos y vecinas del lugar', autor: 'Ezequiel Boetti', medio: 'Otros Cines' }
        ]
      }
    },
    {
      id: 'qomi',
      titulo: 'Qomí',
      acotacion: { es: '(EN DESARROLLO)', en: '(IN DEVELOPMENT)' },
      datos: { es: 'Largometraje · Cinema 7 Films · en desarrollo', en: 'Feature film · Cinema 7 Films · in development' },
      ver: { texto: { es: 'Ver prueba de concepto', en: 'Watch proof of concept' }, yt: 'rmHEXpIrGEk' },
      ficha: {
        frase: { es: 'Piguem, un niño qom de doce años del monte chaqueño, se convence de que está maldito y de que sólo los rocshés, los hombres blancos, pueden sacarle la maldición.', en: 'Piguem, a twelve-year-old Qom boy from the Chaco forest, becomes convinced that he is cursed and that only the rocshés, the white men, can lift the curse.' },
        linea: { es: 'Largometraje · Producción: Cinema 7 Films', en: 'Feature film · Produced by Cinema 7 Films' },
        sinopsis: {
          es: 'En el corazón del Gran Chaco, en el monte conocido como El Impenetrable, vive Piguem, un niño qom de doce años. Un objeto extraño que encuentra interrumpe ese equilibrio: el monte retumba, una estampida de pecaríes se hace presente y su amigo Payak cae y muere. Desde entonces Piguem carga una culpa que revive con cada pérdida. Mientras los rocshés —hombres blancos— avanzan y obligan a los qom a desplazarse, mueren su hermana Dasoví y su padre Kedok. Aturdido y con la sensación de estar maldito, Piguem se convence de que la maldición existe y sólo los rocshés pueden sacársela.',
          en: 'In the heart of the Gran Chaco, in the forest known as El Impenetrable, lives Piguem, a twelve-year-old Qom boy. A strange object he finds breaks that balance: the forest rumbles, a stampede of peccaries bursts in, and his friend Payak falls and dies. From then on Piguem carries a guilt that returns with every loss. As the rocshés (white men) advance and force the Qom to move, his sister Dasoví and his father Kedok die. Dazed and feeling cursed, Piguem becomes convinced that the curse is real and that only the rocshés can lift it.'
        },
        creditos: [
          [{ es: 'Dirección', en: 'Directed by' }, 'Germán Basso'],
          [{ es: 'Producción', en: 'Production' }, 'Cinema 7 Films'],
          [{ es: 'Estado', en: 'Status' }, { es: 'En búsqueda de financiamiento para el rodaje', en: 'Seeking production funding' }]
        ]
      }
    },
    {
      id: 'roca',
      titulo: 'Roca',
      acotacion: { es: '(EN DESARROLLO)', en: '(IN DEVELOPMENT)' },
      datos: { es: 'Largometraje documental · en desarrollo', en: 'Feature documentary · in development' },
      ver: { texto: { es: 'Ver teaser', en: 'Watch teaser' }, yt: 'YhT1mZvRUR0' },
      ficha: {
        frase: { es: 'Darío «Roca», descendiente de qom, lleva consigo el conocimiento de una cultura ancestral mientras trabaja de hachero, de sereno o cavando pozos para piletas.', en: 'Darío “Roca”, a descendant of the Qom, carries the knowledge of an ancestral culture while working as a woodcutter, a night watchman or digging holes for swimming pools.' },
        linea: { es: 'Largometraje documental · Chaco, Argentina', en: 'Feature documentary · Chaco, Argentina' },
        sinopsis: {
          es: 'Proyecto documental sobre comunidades indígenas Qom del Chaco argentino, en la localidad de Roca. Sigue a Darío «Roca», un descendiente de Qoms que lleva consigo todo el conocimiento de la cultura ancestral y que trabaja de hachero, de sereno, o cavando pozos para piletas.',
          en: 'Documentary project about Qom indigenous communities in the Argentine Chaco, in the town of Roca. It follows Darío “Roca”, a descendant of the Qom who carries all the knowledge of the ancestral culture and works as a woodcutter, a night watchman, or digging holes for swimming pools.'
        },
        creditos: [[{ es: 'Dirección', en: 'Directed by' }, 'Germán Basso']]
      }
    },
    {
      id: 'cosas-viejas',
      titulo: 'Cosas Viejas',
      datos: { es: 'Cortometraje · 2017', en: 'Short film · 2017' },
      ver: { texto: { es: 'Ver corto', en: 'Watch the short' }, sub: { es: 'Completo · 12:15', en: 'Full film · 12:15' }, yt: 'W9JAXVvoanM' },
      ficha: {
        frase: { es: 'En San Telmo, Tristán dirige un negocio que compra muebles viejos, los restaura y los vende. Lo más riesgoso del oficio: reconocer un mueble de autor.', en: 'In San Telmo, Tristán runs a business that buys old furniture, restores it and sells it. The riskiest part of the trade: spotting a designer piece.' },
        linea: { es: 'Cortometraje documental · 2017 · 12:15', en: 'Documentary short · 2017 · 12:15' },
        sinopsis: {
          es: 'Compran muebles, los restauran y los ofrecen a la venta. Tristán es la cabeza del negocio de antigüedades. Su conocimiento del rubro y su atención a los detalles le permite manejar uno de los negocios más vendedores de San Telmo y de la Argentina. Detectar muebles de autor es uno de los desafíos de mayor riesgo en el rubro.',
          en: 'They buy furniture, restore it and put it up for sale. Tristán runs the antiques business. His knowledge of the trade and his eye for detail let him manage one of the best-selling shops in San Telmo and in Argentina. Spotting designer furniture is one of the riskiest challenges in the trade.'
        },
        creditos: [[{ es: 'Dirección', en: 'Directed by' }, 'Germán Basso']]
      }
    },
    {
      id: 'homero-taisen',
      titulo: 'Homero Taisen',
      datos: { es: 'Mi Casa sessions · Sesión en vivo · 2026', en: 'Mi Casa sessions · Live session · 2026' },
      ver: { texto: { es: 'Ver sesión', en: 'Watch the session' }, sub: { es: 'Completa · 13 min', en: 'Full session · 13 min' }, yt: '-uuosnM2FBg' },
      ficha: {
        frase: { es: 'Homero Taisen y su banda en una sesión en vivo de «Perdón Amor de nuevo», «Zamba del Desamorado» y «La Luna se me hizo calor».', en: 'Homero Taisen and band in a live session of “Perdón Amor de nuevo”, “Zamba del Desamorado” and “La Luna se me hizo calor”.' },
        linea: { es: 'Mi Casa sessions · Sesión en vivo · 2026 · 13 min', en: 'Mi Casa sessions · Live session · 2026 · 13 min' },
        sinopsis: {
          es: 'Sesión en vivo de Homero Taisen y su banda. Tres canciones: «Perdón Amor de nuevo», «Zamba del Desamorado» y «La Luna se me hizo calor».',
          en: 'Live session by Homero Taisen and band. Three songs: “Perdón Amor de nuevo”, “Zamba del Desamorado” and “La Luna se me hizo calor”.'
        },
        creditos: [
          [{ es: 'Dirección', en: 'Directed by' }, 'Germán Basso'],
          [{ es: 'Producción', en: 'Producer' }, 'Agostina Sanchez Freijo'],
          [{ es: 'Cámaras', en: 'Camera' }, 'Catalina Chontasi, Germán Basso'],
          [{ es: 'Edición', en: 'Editing' }, 'Germán Basso'],
          [{ es: 'Arte', en: 'Art direction' }, 'Sol Irupé Saralegui'],
          [{ es: 'Foto fija', en: 'Stills' }, 'Sol Irupé Saralegui'],
          [{ es: 'Colorimetría', en: 'Color grading' }, 'Lucía Kristef'],
          [{ es: 'Sonido', en: 'Sound' }, { es: 'DALSUONO (grabación), Piter Mazda (edición y mezcla)', en: 'DALSUONO (recording), Piter Mazda (editing and mixing)' }]
        ]
      }
    },
    {
      id: 'alpapuyo',
      titulo: 'Alpapuyo',
      datos: { es: 'Videoclip animado · 2021', en: 'Animated music video · 2021' },
      ver: { texto: { es: 'Ver videoclip', en: 'Watch the video' }, yt: 'QOEcIGJvAEY' },
      ficha: {
        frase: { es: 'Videoclip hecho con animación para Mango Lafruta.', en: 'Music video made with animation for Mango Lafruta.' },
        linea: { es: 'Videoclip animado · 2021', en: 'Animated music video · 2021' },
        sinopsis: {
          es: 'Videoclip realizado para Mango Lafruta. Fue seleccionado en múltiples festivales, incluyendo el Bamfest, donde ganó el premio a mejor videoclip de animación.',
          en: 'Music video made for Mango Lafruta. Selected at multiple festivals, including Bamfest, where it won Best Animated Music Video.'
        },
        creditos: [[{ es: 'Artista', en: 'Artist' }, 'Mango Lafruta'], [{ es: 'Dirección', en: 'Directed by' }, 'Fiona Lena Brown, Germán Basso']]
      }
    },
    {
      id: 'fiat',
      titulo: 'Fiat',
      // Oculta por ahora: no aparece en la portada ni en el índice. Para volver
      // a mostrarla, borrar la línea de abajo.
      oculta: true,
      // En pantallas horizontales se muestran los cinco reels uno al lado del otro.
      mosaicoHorizontal: true,
      datos: { es: 'Campaña para redes · 2024 · con Homero Pettinato', en: 'Social media campaign · 2024 · with Homero Pettinato' },
      ver: { texto: { es: 'Ver los reels', en: 'Watch the reels' }, ficha: true },
      ficha: {
        credito: { es: 'para Fiat Argentina', en: 'for Fiat Argentina' },
        linea: { es: 'Campaña para redes · 2024', en: 'Social media campaign · 2024' },
        nota: { es: 'Pinamar, Buenos Aires.', en: 'Pinamar, Buenos Aires.' },
        sinopsis: {
          es: 'Campaña publicitaria para promocionar la pickup Fiat Toro con el conductor e influencer Homero Pettinato en las costas de Pinamar. También se realizaron sketches breves para la concesionaria Autogenerali.',
          en: 'Advertising campaign for the Fiat Toro pickup with host and influencer Homero Pettinato on the Pinamar coast. Short sketches were also made for the Autogenerali dealership.'
        },
        creditos: [[{ es: 'Cliente', en: 'Client' }, 'Fiat Argentina, Autogenerali']],
        reels: [
          { img: 'media/instagram1.jpg', url: 'https://www.instagram.com/reel/DEI-nL-Sgdg/' },
          { img: 'media/instagram2.jpg', url: 'https://www.instagram.com/homeropettinato/reel/DFvP1x1x0vK/' },
          { img: 'media/instagram3.jpg', url: 'https://www.instagram.com/homeropettinato/reel/DC47H39y1LR/' },
          { img: 'media/instagram4.jpg', url: 'https://www.instagram.com/homeropettinato/reel/DHEwCDFSRu9/' },
          { img: 'media/instagram5.jpg', url: 'https://www.instagram.com/homeropettinato/reel/DIUlXTzSBSg/' }
        ]
      }
    },
    {
      id: 'vialidad',
      titulo: 'Vialidad Nacional',
      // Videos de la portada: 'vialidad-2' es el juego nuevo.
      // Para volver al anterior, borrar esta línea; sus archivos siguen en media/.
      medios: 'vialidad-2',
      datos: { es: 'Institucional · 2020–2025 · 7 piezas', en: 'Institutional · 2020–2025 · 7 pieces' },
      ver: { texto: { es: 'Ver las piezas', en: 'See the pieces' }, ficha: true, seccion: 'piezas' },
      ficha: {
        frase: { es: 'Campañas y contenidos sobre los caminos de la Argentina, hechos en el Área Audiovisual de Vialidad Nacional.', en: 'Campaigns and content about Argentina’s roads, made at the Audiovisual Area of Vialidad Nacional.' },
        linea: { es: 'Contenido institucional · 2020–2025', en: 'Institutional content · 2020–2025' },
        sinopsis: {
          es: 'Campañas y contenidos institucionales sobre la infraestructura vial argentina, realizados en el Área Audiovisual de Vialidad Nacional.',
          en: 'Campaigns and institutional content about Argentina’s road infrastructure, made at the Audiovisual Area of Vialidad Nacional.'
        },
        creditos: [],
        piezas: [
          { yt: 'LiIt8ncgEc0', t: { es: 'Derrumbe Brazo Huemul, La Angostura', en: 'Brazo Huemul Landslide, La Angostura' } },
          { yt: 's_XLHpwqQwc', t: { es: 'Plan Integral de Mantenimiento Invernal 2025', en: '2025 Winter Maintenance Plan' } },
          { yt: '6QQIy0L5N-k', t: { es: 'Día del Camino 2024', en: 'Road Day 2024' } },
          { yt: 'SppKAlIo2Sc', t: { es: 'Nuevos Laboratorios Regionales', en: 'New Regional Laboratories' } },
          { yt: 'yM5GciGtZVM', t: { es: 'Operativo Invernal en Neuquén', en: 'Winter Operation in Neuquén' } },
          { yt: 'o4A54NKJgHk', t: { es: 'Historia de Vialidad Nacional', en: 'History of Vialidad Nacional' } },
          { yt: '2NbDimA2vTo', t: { es: 'Día del Camino 2020', en: 'Road Day 2020' } }
        ]
      }
    }
  ],

  ui: {
    es: {
      obras: 'Obras', contacto: 'Contacto', lang: 'En', langNombre: 'English', anterior: 'Obra anterior', siguiente: 'Obra siguiente', fichaAnterior: 'Ficha anterior', fichaSiguiente: 'Ficha siguiente',
      trailer: 'Tráiler', ficha: 'Ficha', volver: 'Volver', cerrar: 'Cerrar',
      sinopsis: 'Sinopsis', creditos: 'Créditos', premios: 'Premios y festivales', criticas: 'Críticas', piezas: 'Piezas', reels: 'Reels',
      tambien: 'También', principales: 'Obras', escribime: 'Contacto', copiar: 'Copiar', copiado: 'Copiado',
      mas: 'Ver más', escuchar: 'Activar sonido', silenciar: 'Silenciar', liviano: 'Modo liviano: imágenes fijas para que cargue rápido.', cargarTodo: 'Cargar los clips igual'
    },
    en: {
      obras: 'Works', contacto: 'Contact', lang: 'Es', langNombre: 'Español', anterior: 'Previous work', siguiente: 'Next work', fichaAnterior: 'Previous details', fichaSiguiente: 'Next details',
      trailer: 'Trailer', ficha: 'Details', volver: 'Back', cerrar: 'Close',
      sinopsis: 'Synopsis', creditos: 'Credits', premios: 'Awards and festivals', criticas: 'Reviews', piezas: 'Pieces', reels: 'Reels',
      tambien: 'Also', principales: 'Works', escribime: 'Contact', copiar: 'Copy', copiado: 'Copied',
      mas: 'More', escuchar: 'Turn sound on', silenciar: 'Mute', liviano: 'Light mode: still images so the page loads fast.', cargarTodo: 'Load the clips anyway'
    }
  }
};
