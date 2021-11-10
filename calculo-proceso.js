
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
