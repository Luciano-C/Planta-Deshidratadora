(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

function calcular_proceso_global() {
    // Importa objetos y funciones de objetos.js
    var obj = require("./objetos.js");

    // Se da valor inicial 0 para iniciar la iteracion y poder crear equipos
    var calor_agua_evaporada_secador = 0;
    // Valor inicial de flujo de recirculación
    var flujo_recirculacion = new obj.Flujo("Recirculación", 0, 0, 0);


    // Valores para probar el código
    /* var aire_fresco = 0.825;
    var temperatura_ambiente = 20;
    var hr_aire = 60;
    var temperatura_operacion_secador = 65;
    var masa_tomate = 350;
    var humedad_objetivo = 0.3; */


    // Datos que vienen de html.
    var aire_fresco = Number(document.getElementById("flujo_aire").value / 3600);
    var temperatura_ambiente = Number(document.getElementById("temperatura_ambiente").value);
    var hr_aire = Number(document.getElementById("hr_aire").value);
    var temperatura_operacion_secador = Number(document.getElementById("temperatura_operacion_secador").value);
    var masa_tomate = Number(document.getElementById("masa_tomate").value);
    var humedad_objetivo = Number(document.getElementById("humedad_objetivo").value / 100);


    // Funcion que calcula todo el proceso
    function calcular_proceso (flujo_recirculacion, calor_agua_evaporada_secador) {

        // Calcula flujo de alimentación fresca
        var f1 = new obj.Flujo("F1", aire_fresco, temperatura_ambiente, hr_aire);


        // Cálculo flujo de entrada a quemador
        masa_aire_seco_f2 = f1.masa_aire_seco + flujo_recirculacion.masa_aire_seco;
        masa_agua_f2 = f1.masa_agua + flujo_recirculacion.masa_agua;
        // Media ponderada de temperaturas
        temperatura_f2 = (f1.flujo * f1.temperatura + flujo_recirculacion.flujo * flujo_recirculacion.temperatura) / (f1.flujo + flujo_recirculacion.flujo);
        var propiedades_f2 = obj.calcular_propiedades(masa_aire_seco_f2, masa_agua_f2, temperatura_f2);
        var f2 = new obj.Flujo("F2", propiedades_f2["aire_humedo"], propiedades_f2["temperatura"], propiedades_f2["humedadRelativa"]);


        // QUEMADOR
        var quemador = new obj.Quemador("Quemador", f2, calor_agua_evaporada_secador, temperatura_operacion_secador);
        var f3 = quemador.generarSalida();

        // SECADOR
        var secador = new obj.Secador("Secador", f3, masa_tomate, temperatura_operacion_secador, humedad_objetivo);
        // Se recalcula el calor de agua evaporada utilizando el método del secador
        calor_agua_evaporada_secador = secador.calcular_calor_evaporacion();
        // Calcula flujo de salida del secador/entrada a divisor
        var entrada_divisor = secador.generarSalida();


        // DIVISOR
        var divisor = new obj.Divisor("Divisor", entrada_divisor, 0.46);
        var f5 = divisor.generarSalida()["descarte"];
        var f4 = divisor.generarSalida()["recirculacion"];

        return {"f1": f1, "f2": f2, "f3": f3, "f4": f4, "f5": f5, "R": flujo_recirculacion, "quemador": quemador, "secador": secador, "divisor": divisor};

    }

    var comparacion = 100;
    var error = 10**-10;

    while (comparacion >= error) {

        var parametros_proceso = calcular_proceso(flujo_recirculacion, calor_agua_evaporada_secador)
        var comparacion = Math.abs(parametros_proceso["f4"].flujo - parametros_proceso["R"].flujo);
        flujo_recirculacion = parametros_proceso["f4"];
        calor_agua_evaporada_secador = parametros_proceso["secador"].calcular_calor_evaporacion();

    }

    var f1 = parametros_proceso["f1"];
    var f2 = parametros_proceso["f2"];
    var f3 = parametros_proceso["f3"];
    var f4 = parametros_proceso["f4"];
    var f5 = parametros_proceso["f5"];
    var quemador = parametros_proceso["quemador"];
    var secador = parametros_proceso["secador"];
    var divisor = parametros_proceso["divisor"];

    // Calor requerido de gas en kW
    var q_gas = quemador.calcular_calor_gas();
    // Consumo de gas en kg/h
    var consumo_gas = quemador.calcular_consumo_gas();
    // Tiempo de secado en minutos
    var tiempo_secado_minutos = secador.calcular_tiempo(0,100000, 10**-10);
    var tiempo_secado_horas = tiempo_secado_minutos / 60;
    var consumo_gas_total = consumo_gas * tiempo_secado_horas;

    // Cálculo de tomate producido
    var porcentaje_agua_inicial_tomate = secador.calcular_humedad(0);
    var pulpa_tomate = (1 - porcentaje_agua_inicial_tomate) * masa_tomate;
    var masa_tomate_deshidratado = pulpa_tomate / (1 - humedad_objetivo);

    // Cálculo de agua retirada
    var agua_retirada = masa_tomate - masa_tomate_deshidratado;
   

    var resultados = {"f1": f1, "f2": f2, "f3": f3, "f4": f4, "f5": f5, "quemador": quemador, "secador": secador, "divisor": divisor,
     "q_gas": q_gas, "consumo_gas": consumo_gas, "tiempo_secado:minutos": tiempo_secado_minutos, "tiempo_secado_horas": tiempo_secado_horas,
      "consumo_gas_total": consumo_gas_total, "masa_tomate_deshidratado": masa_tomate_deshidratado, "agua_retirada": agua_retirada};

    return resultados;

}

module.exports = {calcular_proceso_global};

},{"./objetos.js":3}],2:[function(require,module,exports){

function correr_script() {
    
    // Cálculos previos
    
    var correr_proceso = require("./calculo-proceso.js");
    var resultados = correr_proceso.calcular_proceso_global();
    var flujos = [];
    var temperaturas = [];
    var humedades = [];
    
    for (var i = 1; i <= 5; i++) {
        // Flujos másicos
        flujos.push(document.getElementById("f"+ i));
        flujos[i-1].innerHTML = resultados["f"+ i].flujo.toFixed(3);
        // Temperaturas
        temperaturas.push(document.getElementById("t_f" + i));
        temperaturas[i-1].innerHTML = resultados["f" + i].temperatura.toFixed(1);
        // Humedades
        humedades.push(document.getElementById("h_f" + i));
        humedades[i-1].innerHTML = resultados["f" + i].humedadRelativa.toFixed(1);
    }

    // Otros resultados
    var q_gas = document.getElementById("q_gas");
    q_gas.innerHTML = resultados["q_gas"].toFixed(2);

    var tiempo_secado_horas = document.getElementById("tiempo_secado_horas");
    tiempo_secado_horas.innerHTML = resultados["tiempo_secado_horas"].toFixed(2);
    
    var consumo_gas = document.getElementById("consumo_gas");
    consumo_gas.innerHTML = resultados["consumo_gas"].toFixed(2);

    var consumo_gas_total = document.getElementById("consumo_gas_total");
    consumo_gas_total.innerHTML = resultados["consumo_gas_total"].toFixed(2);

    var agua_retirada = document.getElementById("agua_retirada");
    agua_retirada.innerHTML = resultados["agua_retirada"].toFixed(2);

    var masa_tomate_deshidratado = document.getElementById("masa_tomate_deshidratado");
    masa_tomate_deshidratado.innerHTML = resultados["masa_tomate_deshidratado"].toFixed(2);
}

function limpiar() {
    var a_limpiar = document.querySelectorAll(".to-clear")
    for (var i = 0; i < a_limpiar.length; i++) {
        a_limpiar[i].innerHTML = "-";
    }
}

var button_1 = document.getElementById("button_1");
button_1.onclick = correr_script;

var button_2 = document.getElementById("button_2");
button_2.onclick = limpiar;








},{"./calculo-proceso.js":1}],3:[function(require,module,exports){

function antoine(temperatura) {
    var a_antoine = 7.96687;
    var b_antoine = 1668.21;
    var c_antoine = 228;
    var presionParcialAntoine = (10**(a_antoine-b_antoine/(c_antoine + temperatura)))/760;
    return presionParcialAntoine; 
}

function calcular_propiedades (masa_aire_seco, masa_agua, temperatura) {
    var aire_humedo = masa_aire_seco + masa_agua;
    var pmAire = 29;
    var pmAgua = 18;
    var moles_aire_seco = masa_aire_seco / pmAire;
    var moles_agua = masa_agua / pmAgua;
    var y_agua = moles_agua / (moles_agua + moles_aire_seco); 
    var presionSaturacionAgua = antoine(temperatura);
    var presionParcialAgua = y_agua * 1;
    var humedadRelativa = presionParcialAgua / presionSaturacionAgua *100;
    return {"aire_humedo": aire_humedo, "temperatura": temperatura, "humedadRelativa": humedadRelativa};

}

// Flujo (Nombre: string, flujo: float en kg/s, temperatura: in °C,  humedadRelativa: float en %)
class Flujo {
    constructor(nombre, flujo, temperatura, humedadRelativa){
        this.nombre = nombre;
        this.flujo = flujo;
        this.temperatura = temperatura;
        this.humedadRelativa = humedadRelativa;
        this.pmAgua = 18;
        this.pmAire = 29;
        this.presionSaturacionAgua = antoine(this.temperatura);
        this.presionParcialAgua = this.humedadRelativa / 100 * this.presionSaturacionAgua;
        this.y_agua = this.presionParcialAgua/1;
        this.y_aire = 1 - this.y_agua;
        this.pmPromedio = this.pmAgua * this.y_agua + this.pmAire * this.y_aire;
        this.moles_aire_total = this.flujo / this.pmPromedio;
        this.moles_agua = this.moles_aire_total * this.y_agua;
        this.moles_aire_seco = this.moles_aire_total - this.moles_agua;
        this.masa_agua = this.moles_agua * this.pmAgua;
        this.masa_aire_seco = this.moles_aire_seco * this.pmAire;
    }
}


class Equipo {
    constructor(nombre, flujoEntrada){
        this.nombre = nombre;
        this.flujoEntrada = flujoEntrada;
    }

    generarSalida(){
        var flujoSalida = this.flujoEntrada;
        return flujoSalida;

    }

} 
// Secador (nombre:string, flujoEntrada: objeto Flujo, masaTomate: numeric, temperatura_operacin: numeric, humedad_objetivo: float)
class Secador extends Equipo {
    constructor(nombre, flujoEntrada, masaTomate, temperatura_operacion, humedad_objetivo) {
        super(nombre, flujoEntrada);
        this.masaTomate = masaTomate;
        this.temperatura_operacion = temperatura_operacion;
        this.humedad_objetivo = humedad_objetivo;
        var k_curva_base = 0.000004 * this.temperatura_operacion ** 2 - 0.0003 * this.temperatura_operacion + 0.0174;
        var factor_k = 0.002;
        var n_curva_base = -0.00005 * this.temperatura_operacion ** 2 + 0.0093 * this.temperatura_operacion + 0.6444;
        var factor_n = 1.84
        this.k_curva = k_curva_base * factor_k;
        this.n_curva = n_curva_base * factor_n;
        this.m0_curva = 21.22;
        this.me_curva = 0.25;
    }


    calcular_humedad (tiempo) {
        var mr_curva = Math.exp(-this.k_curva * (tiempo ** this.n_curva));
        var mt_curva = mr_curva * (this.m0_curva - this.me_curva) + this.me_curva;
        var humedad_curva = mt_curva / (mt_curva + 1);
        return humedad_curva;
    }
    
    
    comparar_humedad (tiempo, humedad_objetivo) {
        var humedad_a_comparar = this.calcular_humedad(tiempo);
        var comparacion_humedad = humedad_objetivo - humedad_a_comparar;
        return comparacion_humedad;
    }

    // Calcula tiempo utilizando método de bisección en curva de secado.
    calcular_tiempo (a, b, error) {
        if (this.comparar_humedad(a, this.humedad_objetivo) * this.comparar_humedad(b, this.humedad_objetivo) >= 0) {
            return "a y b incorrectos";
        } 
        var c = a;
        while (b - a >= error) {
            c = (a + b) / 2;
            if (this.comparar_humedad(c, this.humedad_objetivo) == 0.0) {
                return c; 
            }
            else if (this.comparar_humedad(c, this.humedad_objetivo) * this.comparar_humedad(a, this.humedad_objetivo) < 0) {
                b = c;
            }
            else {
                a = c;
            }
        }
        return c;
    }
    
    calcular_agua_a_retirar () {
        var humedad_tomate_inicial = this.calcular_humedad(0);
        var pulpa_tomate = (1 - humedad_tomate_inicial) * this.masaTomate;
        var agua_inicial = this.masaTomate - pulpa_tomate;
        var agua_final = (pulpa_tomate / (1 - this.humedad_objetivo)) * this.humedad_objetivo;
        var agua_a_retirar = agua_inicial - agua_final;
        var tiempo_secado = this.calcular_tiempo(0,100000, 10**-10);
        var flujo_agua = (agua_a_retirar / tiempo_secado) / 60;
        return flujo_agua;
    }

    calcular_calor_evaporacion () {
        var flujo_agua = this.calcular_agua_a_retirar();
        // calor de vaporizacion en kj/kg
        var delta_calor_vaporizacion = 2617;
        var calor_vaporizacion = flujo_agua * delta_calor_vaporizacion;
        return calor_vaporizacion; 
    }


    generarSalida () {
        var masa_aire_seco = this.flujoEntrada.masa_aire_seco;
        var agua_retirada = this.calcular_agua_a_retirar();
        var masa_agua = this.flujoEntrada.masa_agua + agua_retirada;
        var temperatura_salida = this.temperatura_operacion;
        var propiedades = calcular_propiedades(masa_aire_seco, masa_agua, temperatura_salida)
        var flujo_salida = new Flujo("Salida Secador", propiedades["aire_humedo"], propiedades["temperatura"], propiedades["humedadRelativa"]);
 
        return flujo_salida;
    }
}

class Divisor extends Equipo {
    constructor(nombre, flujoEntrada, factor_recirculacion) {
        super(nombre, flujoEntrada);
        this.factor_recirculacion = factor_recirculacion;
    }


    calcular_recirculacion () {
        var masa_aire_seco = this.flujoEntrada.masa_aire_seco * this.factor_recirculacion;
        var masa_agua = this.flujoEntrada.masa_agua * this.factor_recirculacion;
        var temperatura_salida = this.flujoEntrada.temperatura;
        var propiedades = calcular_propiedades(masa_aire_seco, masa_agua, temperatura_salida);
        var recirculacion = new Flujo("Recirculacion", propiedades["aire_humedo"], propiedades["temperatura"], propiedades["humedadRelativa"]);
        return recirculacion;
    }

    calcular_descarte () {
        var masa_aire_seco = this.flujoEntrada.masa_aire_seco * (1 - this.factor_recirculacion);
        var masa_agua = this.flujoEntrada.masa_agua * (1 - this.factor_recirculacion);
        var temperatura_salida = this.flujoEntrada.temperatura;
        var propiedades = calcular_propiedades(masa_aire_seco, masa_agua, temperatura_salida);
        var descarte = new Flujo("Descarte", propiedades["aire_humedo"], propiedades["temperatura"], propiedades["humedadRelativa"]);
        return descarte;
    }

    generarSalida () {
        var recirculacion = this.calcular_recirculacion();
        var descarte = this.calcular_descarte();
        return {"recirculacion": recirculacion, "descarte": descarte};
    }
}

class Quemador extends Equipo {
    constructor(nombre, flujoEntrada, calor_agua_evaporada_secador, temperatura_operacion_secador) {
        super(nombre, flujoEntrada);
        this.calor_agua_evaporada_secador = calor_agua_evaporada_secador;
        this.temperatura_operacion_secador = temperatura_operacion_secador;
        // calor combustion gas en kJ/kg
        this.delta_combustion_ch4 = 50050;
        // cp aire en kJ/kg K
        this.cp_aire = 1;
    }


    generarSalida () {
        var masa_aire_seco = this.flujoEntrada.masa_aire_seco;
        var masa_agua = this.flujoEntrada.masa_agua;
        var temperatura_salida = this.temperatura_operacion_secador + (this.calor_agua_evaporada_secador / this.flujoEntrada.flujo) * this.cp_aire;
        var propiedades = calcular_propiedades(masa_aire_seco, masa_agua, temperatura_salida)
        var flujo_salida = new Flujo("Salida Quemador", propiedades["aire_humedo"], propiedades["temperatura"], propiedades["humedadRelativa"]);
        return flujo_salida;
    }

    calcular_calor_gas () {
        var flujo_salida = this.generarSalida();
        var calor_gas = this.flujoEntrada.flujo * this.cp_aire * (flujo_salida.temperatura - this.flujoEntrada.temperatura);
        return calor_gas;
    }

    calcular_consumo_gas () {
        var calor_gas = this.calcular_calor_gas();
        // flujo de gas en kg/h
        var flujo_gas = (calor_gas / this.delta_combustion_ch4) * 3600;
        return flujo_gas;
    }
}


//Código para poder importar clases en main
module.exports = {Flujo, Equipo, Secador, Quemador, Divisor, antoine, calcular_propiedades};
},{}]},{},[2]);
