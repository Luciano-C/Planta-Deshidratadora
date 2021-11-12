# Acerca del proyecto
En este proyecto se busca que un usuario pueda de manera sencilla simular diferentes condiciones de operación para la planta de deshidratado de tomate de la empresa Agroindustrial CK2. Para esto se creó una interfaz sencilla en html que permite al usuario ingresar los parámetros de entrada al modelo, éstos se utilizan en un código javascript para calcular el proceso completo y los resultados se muestran posteriormente en la interfaz html.

# Interfaz html
Es un código sencillo que utiliza css para definir el estilo y está ligado el script bundle.js.

# Código javascript
Aquí es donde se realizan los cálculos más importantes del proceso. 
El código fue escrito utilizando Node.js. Está dividido en 3 módulos:
<b>- objetos.js</b>: En este módulo se utiliza POO y se definen objetos para los flujos y los equipos involucrados, además de funciones relevantes para su cálculo.<br>
<b>- calculo-proceso.js</b>: En este módulo se define una función donde se crean instancias de cada equipo y flujos para realizar el cálculo del proceso.<br>
<b>- ck2_main</b>: En este módulo se llama a la funcion de cálculo de proceso y escribe los resultados en la interfaz html.

Para poder trabajar con el código html estos módulos se fusionan en uno llamado bundle.js, el cual es creado utilizando "browserify". Para hacer cambios se debe tener instalado browserify en la carpeta del proyecto y despues de realizar los cambios en los archivos escribir en la terminal: <br>

<b>npm run build</b> <br>




