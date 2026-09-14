# ¿Cuál carta vale más? — Pokémon TCG

Mini juego web que consume la API pública de [pokemontcg.io](https://pokemontcg.io).

## Cómo funciona

1. Se presiona **Iniciar juego**.
2. El sitio pide cartas al azar a la API y filtra las que tienen precio de TCGPlayer cargado.
3. Se muestran 2 cartas lado a lado.
4. El usuario elige la que cree que es **más cara** (precio "market" de TCGPlayer).
5. Se revela el resultado (Correcto / Vida perdida) junto con los precios reales y se pasa a la siguiente ronda.
6. El juego dura **10 rondas**. El jugador empieza con **3 vidas**; cada respuesta incorrecta resta una vida.
7. El juego termina apenas se cumple alguna de estas dos condiciones:
   - Se completan las 10 rondas → **victoria**.
   - Se pierden las 3 vidas → **fin del juego**.
8. Al terminar (ganando o perdiendo) se muestra una pantalla final con la opción de **Reiniciar juego**.

## Tecnologías

- HTML5 + CSS3 (tema oscuro estilo Google, sobre el modo oscuro nativo de Bootstrap)
- Bootstrap 5 (vía CDN, solo para estilos y componentes visuales)
- JavaScript puro (Vanilla JS) — `fetch` a la API, sin librerías ni frameworks

## Cómo abrirlo

1. Descomprimir el zip.
2. Abrir la carpeta en VS Code.
3. Abrir `index.html` con la extensión **Live Server** (recomendado), o simplemente abrir el archivo `index.html` directamente en el navegador.

No requiere instalación de dependencias ni `npm install`, todo se carga por CDN.

## Notas sobre la API

- Endpoint usado: `https://api.pokemontcg.io/v2/cards`
- No se usa API key (el límite gratuito sin key es de 1000 requests/día y 30 por minuto, suficiente para esto).
- El precio comparado es el valor `market` más alto entre las variantes de precio que trae `tcgplayer.prices` de cada carta (normal, holofoil, etc.), ya que no todas las cartas tienen el mismo tipo de variante cargada.
- Se descartan las cartas sin precio o sin imagen para que el juego siempre pueda comparar.
