
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