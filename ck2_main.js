
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







