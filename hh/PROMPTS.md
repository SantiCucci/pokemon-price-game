1) Modelo / agente de IA utilizado: Claude

2) Prompts más relevantes utilizados

1. "necesito agregar un control de filtrado interactivo (búsqueda y filtro por
   categoría) a mi proyecto. De que manera se puede armar para no romper la estetica de la pagina 
   y que, además, muestre un cartel de 'error al conectar' y 'cargando'"

   Justificacion de la IA: me explico que lo mas viable era agregar una 
   seccion aparte para "Explorar cartas" en lugar del juego mismo. Y para los estados 
   de "error" y "cargando" se podia reciclar los modelos ya existente en el juego de cartas.


2. "el filtrado tiene que hacerse con los datos ya traídos, sin volver
   a recargar la API."

   Justificacion de la IA: aca queria asegurarme de trabajar bien esta parte porque
   era lo que mas dudas me generaba. Me sugirió un fetch que suelte todo de una en 
   el menu de "Explorar cartas" y que el buscador tenga ese filtro en base a las cartas
   ya cargadas.

3. "la consigna pide 'Diseño e interfaz responsiva sin librerías externas de JavaScript.'
    me gustaria saber si el uso de bootstrap como librería css puede significar el incumplimiento de 
    dicha consigna"

    Justificacion de IA: aca queriamos asegurarnos de no incumplir la consigna de "Estructura 
    semántica en HTML5 sin librerías de componentes externas." 

4. "el 'Explorar cartas' solo trae un lote chico. Me gustaria amppliar el lote y asegurar al menos 
   una carta por pokemon en el catálogo de exploracion."

   Justificacion de IA: aca tenaimos el problema de que el catalogo solo traia al rededor de 50 cartas
   mientras que en el juego habia cargadas mas de 100. Necesitabamos saber como traer mas y asegurar al menos 
   una carta por pokemon en el menu de exploracion." 


3) Sugerencias aceptadas y descartadas

Aceptada (prompt 1): agregar una sección aparte llamada "Explorar cartas"
   en lugar de tocar la pantalla del juego, reciclar los mismos estados de
   "Cargando" y "Error" en vez de crear un diseño nuevo.
   Se aceptó porque resolvía el pedido sin romper la estética ni duplicar estilos.

Aceptada (prompt 2): hacer un único fetch al abrir "Explorar cartas"
  que traiga todas las cartas de una, y que el buscador filtre en base
  a esa peticion ya existente. 
  Se aceptó porque evita gastar de más el límite gratuito de la API.

Descartada (prompt 3): no se logro una respuesta clara sobre si bootstrap
   entra en conflicto con la consigna de "sin librerías de componentes externas". 
   Se optó por dejar bootstrap (para no rehacer todo el diseño visual) y
   asumir el riesgo de que se pueda objetar en la corrección.

Aceptada (prompt 4): en vez de traer una sola página chica de cartas,
  recorrer varias paginas de la API y quedarse con una sola carta por cada 
  pokemon distinto.
  Se aceptó porque ampliaba mucho el catalogo sin pedir muchas paginas ni
   arriesgar el límite gratuito de la API.