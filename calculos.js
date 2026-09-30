(function (raiz, fabrica) {
  const api = fabrica();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    raiz.Calculos = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const CONFIG = {
    diasMesComercial: 30,
    diasAnioComercial: 360,
    salarioMinimo: 408.8,
    vecesSalarioMinimoRenuncia: 2,
    vecesSalarioMinimoDespido: 4,
    aniosMinimosRenuncia: 2,
    diasPrestacionRenuncia: 15,
    diasIndemnizacionPorAnio: 30,
    diasMinimosIndemnizacion: 15,
    diasVacacion: 15,
    recargoVacacion: 0.3,
    factorAsueto: 2,
    factorDescanso: 1.5,
    factorHoraExtra: 2,
    factorNocturno: 1.25,
    horasJornadaDiurna: 8,
    categoriasAguinaldo: [
      { maximo: 3, incluyeMaximo: false, dias: 15, nombre: "menos de 3 años" },
      { maximo: 10, incluyeMaximo: true, dias: 19, nombre: "de 3 a 10 años" },
      { maximo: Infinity, incluyeMaximo: false, dias: 21, nombre: "más de 10 años" }
    ],
    tasaAFP: 0.0725,
    tasaISSS: 0.03,
    horaInicioDiurna: 6,
    horaInicioNocturna: 19,
    fechaReferenciaAguinaldo: { mes: 12, dia: 12 },
    reformaAguinaldo: { vigenteDesde: "2026-10-01", mesInicio: 10, diaInicio: 1, mesFin: 12, diaFin: 11 }
  };

  function redondear(valor, decimales = 2) {
    const factor = Math.pow(10, decimales);
    return Math.round(Number((valor * factor).toPrecision(12))) / factor || 0;
  }

  function truncar(valor, decimales = 3) {
    const factor = Math.pow(10, decimales);
    return Math.floor(Number((valor * factor).toPrecision(12))) / factor || 0;
  }

  const formatoMoneda = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function usd(valor) {
    return formatoMoneda.format(redondear(valor));
  }

  function usdPreciso(valor) {
    if (Math.abs(redondear(valor, 2) - valor) < 1e-9) return usd(valor);
    return "$" + redondear(valor, 4).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }

  function numero(valor, decimales = 4) {
    return redondear(valor, decimales).toLocaleString("en-US", { maximumFractionDigits: decimales });
  }

  function porcentaje(tasa) {
    return numero(tasa * 100, 2) + " %";
  }

  function cantidad(n, singular, plural) {
    return numero(n) + " " + (n === 1 ? singular : plural);
  }

  function textoAntiguedad(a) {
    return cantidad(a.anios, "año", "años") + ", " + cantidad(a.meses, "mes", "meses") + " y " + cantidad(a.dias, "día", "días");
  }

  function textoPeriodo(meses, dias) {
    if (meses === 0 && dias === 0) return "0 días";
    if (dias === 0) return cantidad(meses, "mes", "meses");
    if (meses === 0) return cantidad(dias, "día", "días");
    return cantidad(meses, "mes", "meses") + " y " + cantidad(dias, "día", "días");
  }

  function paso(titulo, formula, datos, operacion, resultado) {
    return { titulo, formula, datos, operacion, resultado };
  }

  function salarioDiario(salario) {
    const sbd = salario / CONFIG.diasMesComercial;
    return {
      sbd,
      paso: paso(
        "Salario básico diario",
        "SBD = SBM ÷ 30",
        "SBM = " + usd(salario),
        usd(salario) + " ÷ 30",
        usdPreciso(sbd)
      )
    };
  }

  function calcularAsueto({ salario, dias }) {
    const { sbd, paso: pasoSbd } = salarioDiario(salario);
    const se = sbd * CONFIG.factorAsueto;
    const total = se * dias;
    return {
      valor: redondear(total),
      sbd,
      se,
      dias,
      pasos: [
        pasoSbd,
        paso(
          "Salario por un día de asueto laborado",
          "SE = SBD × 2",
          "SBD = " + usdPreciso(sbd) + "; 2 = salario ordinario más recargo del 100 %",
          usdPreciso(sbd) + " × 2",
          usdPreciso(se)
        ),
        paso(
          "Total por días de asueto laborados",
          "Total = SE × días de asueto laborados",
          "SE = " + usdPreciso(se) + "; días = " + numero(dias),
          usdPreciso(se) + " × " + numero(dias),
          usd(total)
        )
      ],
      notas: [
        "Si además se trabajan horas extra en el día de asueto, el material indica que el recargo se calcula sobre el salario extraordinario por hora (SE ÷ horas de la jornada del contrato). Ese caso no se combina en esta calculadora."
      ]
    };
  }

  function calcularDescanso({ salario, dias }) {
    const { sbd, paso: pasoSbd } = salarioDiario(salario);
    const sdd = sbd * CONFIG.factorDescanso;
    const total = sdd * dias;
    return {
      valor: redondear(total),
      sbd,
      sdd,
      dias,
      pasos: [
        pasoSbd,
        paso(
          "Salario por un día de descanso semanal laborado",
          "SDD = SBD × 1.5",
          "SBD = " + usdPreciso(sbd) + "; 1.5 = salario del día más recargo mínimo del 50 %",
          usdPreciso(sbd) + " × 1.5",
          usdPreciso(sdd)
        ),
        paso(
          "Total por días de descanso semanal laborados",
          "Total = SDD × días de descanso laborados",
          "SDD = " + usdPreciso(sdd) + "; días = " + numero(dias),
          usdPreciso(sdd) + " × " + numero(dias),
          usd(total)
        )
      ],
      notas: [
        "Además del pago, el material establece que debe concederse un día de descanso compensatorio en la misma semana laboral o en la siguiente por cada día de descanso trabajado.",
        "El 50 % es el recargo mínimo; si el contrato establece un recargo mayor, el monto real será superior."
      ]
    };
  }

  function calcularHorasExtras({ salario, horasJornada = CONFIG.horasJornadaDiurna, diurnas = 0, nocturnas = 0 }) {
    const { sbd, paso: pasoSbd } = salarioDiario(salario);
    const h = sbd / horasJornada;
    const pasoHora = paso(
      "Remuneración por hora ordinaria",
      "H = SBD ÷ horas de la jornada ordinaria",
      "SBD = " + usdPreciso(sbd) + "; jornada = " + cantidad(horasJornada, "hora", "horas"),
      usdPreciso(sbd) + " ÷ " + numero(horasJornada),
      usdPreciso(h)
    );
    const valorDiurnas = h * diurnas * CONFIG.factorHoraExtra;
    const hn = h * CONFIG.factorNocturno;
    const valorNocturnas = hn * nocturnas * CONFIG.factorHoraExtra;
    const pasoNocturna = paso(
      "Valor de la hora nocturna",
      "HN = HD × 1.25",
      "HD = " + usdPreciso(h) + "; 1.25 = recargo nocturno del 25 %",
      usdPreciso(h) + " × 1.25",
      usdPreciso(hn)
    );
    return {
      sbd,
      h,
      hn,
      diurna: {
        valor: redondear(valorDiurnas),
        horas: diurnas,
        pasos: [
          pasoSbd,
          pasoHora,
          paso(
            "Horas extras diurnas",
            "HE = H × HL × 2",
            "H = " + usdPreciso(h) + "; HL = " + cantidad(diurnas, "hora", "horas") + "; 2 = recargo del 100 %",
            usdPreciso(h) + " × " + numero(diurnas) + " × 2",
            usd(valorDiurnas)
          )
        ]
      },
      nocturna: {
        valor: redondear(valorNocturnas),
        horas: nocturnas,
        pasos: [
          pasoSbd,
          pasoHora,
          pasoNocturna,
          paso(
            "Horas extras nocturnas",
            "HEN = HN × HL × 2",
            "HN = " + usdPreciso(hn) + "; HL = " + cantidad(nocturnas, "hora", "horas") + "; 2 = recargo del 100 %",
            usdPreciso(hn) + " × " + numero(nocturnas) + " × 2",
            usd(valorNocturnas)
          )
        ]
      },
      valor: redondear(valorDiurnas) + redondear(valorNocturnas),
      notas: [
        "El material da la hora ordinaria como dato. Para obtenerla desde el salario mensual se divide el salario diario entre las horas de la jornada del contrato, el mismo procedimiento que el material usa para el salario extraordinario por hora. Por defecto se usan 8 horas, el máximo de la jornada diurna (Art. 161).",
        "Para las horas extras nocturnas se combinan dos fórmulas del material: primero la hora nocturna (HN = HD × 1.25) y después el recargo del 100 % de las horas extras (× 2)."
      ]
    };
  }

  function calcularRenuncia({ salario, anios, meses = 0, preaviso = true, salarioMinimo = CONFIG.salarioMinimo }) {
    const cumpleAnios = anios >= CONFIG.aniosMinimosRenuncia;
    const requisitos = [
      {
        texto: "Tiempo mínimo de servicio continuo: 2 años. Tiene " + cantidad(anios, "año", "años") + (meses ? " y " + cantidad(meses, "mes", "meses") : "") + ".",
        cumple: cumpleAnios
      },
      {
        texto: "Renuncia presentada por escrito, con preaviso al patrono (15 días; 30 días en cargos de dirección, jefatura o trabajo especializado).",
        cumple: !!preaviso
      }
    ];
    const notas = [
      "La vacación y el aguinaldo, completos o proporcionales, no se pierden al renunciar.",
      "El patrono debe pagar la prestación a más tardar 15 días después de que la renuncia se haga efectiva."
    ];
    if (!cumpleAnios || !preaviso) {
      const motivos = [];
      if (!cumpleAnios) motivos.push("no cumple el mínimo de 2 años de servicio continuo");
      if (!preaviso) motivos.push("no informó la renuncia al patrono por escrito con el preaviso requerido");
      return {
        valor: 0,
        cumple: false,
        requisitos,
        mensaje: "No corresponde prestación por renuncia: " + motivos.join(" y ") + ".",
        pasos: [],
        notas
      };
    }
    const tope = salarioMinimo * CONFIG.vecesSalarioMinimoRenuncia;
    const base = Math.min(salario, tope);
    const { sbd, paso: pasoSbd } = salarioDiario(base);
    pasoSbd.datos = "SBM considerado = " + usd(base);
    const valor = sbd * CONFIG.diasPrestacionRenuncia * anios;
    if (meses > 0) {
      notas.unshift("El procedimiento del material multiplica por los años de servicio; los " + cantidad(meses, "mes", "meses") + " adicionales no se incluyen en esta prestación.");
    }
    return {
      valor: redondear(valor),
      cumple: true,
      requisitos,
      base,
      topeAplicado: salario > tope,
      mensaje: "Cumple los requisitos para recibir la prestación por renuncia voluntaria.",
      pasos: [
        paso(
          "Límite salarial",
          "Salario considerado = el menor entre SBM y 2 × salario mínimo del sector",
          "SBM = " + usd(salario) + "; salario mínimo = " + usd(salarioMinimo),
          "menor entre " + usd(salario) + " y 2 × " + usd(salarioMinimo) + " = " + usd(tope),
          usd(base) + (salario > tope ? " (se aplica el tope)" : " (no supera el tope)")
        ),
        pasoSbd,
        paso(
          "Prestación por renuncia voluntaria",
          "Prestación = SBD × 15 × años de servicio",
          "SBD = " + usdPreciso(sbd) + "; años de servicio = " + numero(anios),
          usdPreciso(sbd) + " × 15 × " + numero(anios),
          usd(valor)
        )
      ],
      notas
    };
  }

  function calcularDespido({ salario, anios, meses = 0, dias = 0, salarioMinimo = CONFIG.salarioMinimo }) {
    const tope = salarioMinimo * CONFIG.vecesSalarioMinimoDespido;
    const base = Math.min(salario, tope);
    const parteAnios = base * anios;
    const diasFraccion = meses * CONFIG.diasMesComercial + dias;
    const diaria = base / CONFIG.diasAnioComercial;
    const proporcional = diaria * diasFraccion;
    let total = parteAnios + proporcional;
    const minimo = (base / CONFIG.diasMesComercial) * CONFIG.diasMinimosIndemnizacion;
    const pasos = [
      paso(
        "Límite salarial",
        "Salario considerado = el menor entre SBM y 4 × salario mínimo",
        "SBM = " + usd(salario) + "; salario mínimo = " + usd(salarioMinimo),
        "menor entre " + usd(salario) + " y 4 × " + usd(salarioMinimo) + " = " + usd(tope),
        usd(base) + (salario > tope ? " (se aplica el tope)" : " (no supera el tope)")
      ),
      paso(
        "Indemnización por años completos",
        "30 días de salario por año = SBM × años",
        "SBM considerado = " + usd(base) + "; años = " + numero(anios),
        numero(anios) + " × " + usd(base),
        usd(parteAnios)
      ),
      paso(
        "Conversión de la fracción de año a días",
        "Días = meses × 30 + días",
        "meses = " + numero(meses) + "; días = " + numero(dias),
        numero(meses) + " × 30 + " + numero(dias),
        cantidad(diasFraccion, "día", "días")
      ),
      paso(
        "Indemnización diaria",
        "ID = SBM ÷ 360 (año comercial)",
        "SBM considerado = " + usd(base),
        usd(base) + " ÷ 360",
        usdPreciso(diaria)
      ),
      paso(
        "Indemnización proporcional",
        "Proporcional = ID × días de la fracción",
        "ID = " + usdPreciso(diaria) + "; días = " + numero(diasFraccion),
        "(" + usd(base) + " ÷ 360) × " + numero(diasFraccion),
        usd(proporcional)
      ),
      paso(
        "Total de indemnización",
        "Total = años completos + proporcional",
        "",
        usd(parteAnios) + " + " + usd(proporcional),
        usd(total)
      )
    ];
    const notas = [];
    let minimoAplicado = false;
    if (total < minimo) {
      minimoAplicado = true;
      pasos.push(paso(
        "Mínimo legal",
        "La indemnización no puede ser menor a 15 días de salario básico",
        "SBD = " + usdPreciso(base / CONFIG.diasMesComercial),
        "(" + usd(base) + " ÷ 30) × 15",
        usd(minimo) + " (se aplica el mínimo)"
      ));
      total = minimo;
    }
    notas.push("Cálculo con meses comerciales de 30 días y año comercial de 360 días, como en el ejemplo del material.");
    return {
      valor: redondear(total),
      base,
      topeAplicado: salario > tope,
      minimoAplicado,
      diasFraccion,
      pasos,
      notas
    };
  }

  function calcularVacacion({ salario, mesesPeriodo = 0, diasPeriodo = 0, pendienteCompleta = false, modo = "exacto" }) {
    const { sbd, paso: pasoSbd } = salarioDiario(salario);
    const pv = sbd * CONFIG.diasVacacion;
    const recargo = pv * CONFIG.recargoVacacion;
    const total = pv + recargo;
    const pasos = [
      pasoSbd,
      paso("Vacación de 15 días", "PV = SBD × 15", "SBD = " + usdPreciso(sbd), usdPreciso(sbd) + " × 15", usdPreciso(pv)),
      paso("Recargo del 30 %", "RV = PV × 30 %", "PV = " + usdPreciso(pv), usdPreciso(pv) + " × 30 %", usdPreciso(recargo)),
      paso("Total de vacaciones", "Total = PV + RV (equivale a SBD × 15 × 1.3)", "", usdPreciso(pv) + " + " + usdPreciso(recargo), usdPreciso(total))
    ];
    const diasTotales = mesesPeriodo * CONFIG.diasMesComercial + diasPeriodo;
    const mesesDecimal = diasTotales / CONFIG.diasMesComercial;
    let proporcional;
    if (modo === "material") {
      const factor = truncar(total / CONFIG.diasAnioComercial, 3);
      proporcional = factor * diasTotales;
      pasos.push(paso(
        "Factor diario de vacación",
        "Factor = Total de vacaciones ÷ 360, con 3 decimales como en el ejemplo del material",
        "Total = " + usdPreciso(total),
        usdPreciso(total) + " ÷ 360",
        "$" + factor.toFixed(3)
      ));
      pasos.push(paso(
        "Vacación proporcional",
        "Vacación proporcional = factor × días del período",
        "Período = " + textoPeriodo(mesesPeriodo, diasPeriodo) + " = " + cantidad(diasTotales, "día", "días"),
        "$" + factor.toFixed(3) + " × " + numero(diasTotales),
        usd(proporcional)
      ));
    } else {
      proporcional = total * mesesDecimal / 12;
      const mesesTexto = numero(mesesDecimal);
      pasos.push(paso(
        "Vacación proporcional",
        "Vacación proporcional = (Total de vacaciones × meses trabajados) ÷ 12",
        "Total = " + usdPreciso(total) + "; meses trabajados = " + mesesTexto + (diasPeriodo ? " (" + textoPeriodo(mesesPeriodo, diasPeriodo) + ", días ÷ 30)" : ""),
        "(" + usdPreciso(total) + " × " + mesesTexto + ") ÷ 12",
        usd(proporcional)
      ));
    }
    let valor = redondear(proporcional);
    if (pendienteCompleta) {
      valor = redondear(valor + redondear(total));
      pasos.push(paso(
        "Vacación completa pendiente",
        "Se suma el total de vacaciones del último año completo que no se gozó",
        "Proporcional = " + usd(proporcional) + "; completa = " + usd(total),
        usd(proporcional) + " + " + usd(total),
        usd(valor)
      ));
    }
    return {
      valor,
      total: redondear(total),
      proporcional: redondear(proporcional),
      pendienteCompleta,
      diasTotales,
      mesesPeriodo,
      diasPeriodo,
      pasos,
      notas: []
    };
  }

  function categoriaAguinaldo(antiguedadAnios) {
    for (const categoria of CONFIG.categoriasAguinaldo) {
      if (antiguedadAnios < categoria.maximo || (categoria.incluyeMaximo && antiguedadAnios === categoria.maximo)) {
        return categoria;
      }
    }
    return CONFIG.categoriasAguinaldo[CONFIG.categoriasAguinaldo.length - 1];
  }

  function calcularAguinaldo({ salario, antiguedadAnios, diasLaborados = 0, completo = false, modo = "exacto" }) {
    const { sbd, paso: pasoSbd } = salarioDiario(salario);
    const categoria = categoriaAguinaldo(antiguedadAnios);
    const pa = sbd * categoria.dias;
    const pasos = [
      pasoSbd,
      paso(
        "Aguinaldo completo según categoría",
        "PA = SBD × D",
        "SBD = " + usdPreciso(sbd) + "; D = " + categoria.dias + " días (antigüedad de " + numero(antiguedadAnios, 2) + " años: " + categoria.nombre + ")",
        usdPreciso(sbd) + " × " + categoria.dias,
        usdPreciso(pa)
      )
    ];
    if (completo) {
      return {
        valor: redondear(pa),
        completo: true,
        categoria,
        pa: redondear(pa),
        dias: CONFIG.diasAnioComercial,
        pasos,
        notas: ["Se paga el aguinaldo completo porque la relación terminó dentro del período de pago habilitado por la reforma de septiembre de 2026 (a partir del 1 de octubre) y el trabajador tiene al menos un año de servicio."]
      };
    }
    const dias = Math.min(diasLaborados, CONFIG.diasAnioComercial);
    let proporcional;
    if (modo === "material") {
      const factor = truncar(pa / CONFIG.diasAnioComercial, 3);
      proporcional = factor * dias;
      pasos.push(paso(
        "Aguinaldo proporcional diario",
        "Factor = PA ÷ 360, con 3 decimales como en el ejemplo del material",
        "PA = " + usdPreciso(pa),
        usdPreciso(pa) + " ÷ 360",
        "$" + factor.toFixed(3)
      ));
      pasos.push(paso(
        "Aguinaldo proporcional",
        "Aguinaldo proporcional = factor × días laborados desde el 12 de diciembre",
        "días laborados = " + numero(dias),
        "$" + factor.toFixed(3) + " × " + numero(dias),
        usd(proporcional)
      ));
    } else {
      const diaria = pa / CONFIG.diasAnioComercial;
      proporcional = diaria * dias;
      pasos.push(paso(
        "Aguinaldo proporcional diario",
        "APD = PA ÷ 360 (año comercial)",
        "PA = " + usdPreciso(pa),
        usdPreciso(pa) + " ÷ 360",
        usdPreciso(diaria)
      ));
      pasos.push(paso(
        "Aguinaldo proporcional",
        "Aguinaldo proporcional = APD × días laborados desde el 12 de diciembre",
        "APD = " + usdPreciso(diaria) + "; días laborados = " + numero(dias),
        "(" + usdPreciso(pa) + " ÷ 360) × " + numero(dias),
        usd(proporcional)
      ));
    }
    return {
      valor: redondear(proporcional),
      completo: false,
      categoria,
      pa: redondear(pa),
      dias,
      pasos,
      notas: []
    };
  }

  function calcularDescuentos({ base, tasaAFP = CONFIG.tasaAFP, tasaISSS = CONFIG.tasaISSS, nombreBase = "base" }) {
    const afp = redondear(base * tasaAFP);
    const isss = redondear(base * tasaISSS);
    const total = redondear(afp + isss);
    return {
      base: redondear(base),
      tasaAFP,
      tasaISSS,
      afp,
      isss,
      total,
      nombreBase,
      pasos: [
        paso("Descuento AFP", "AFP = base × " + porcentaje(tasaAFP), nombreBase + " = " + usd(base), usd(base) + " × " + porcentaje(tasaAFP), usd(afp)),
        paso("Descuento ISSS", "ISSS = base × " + porcentaje(tasaISSS), nombreBase + " = " + usd(base), usd(base) + " × " + porcentaje(tasaISSS), usd(isss)),
        paso("Total de descuentos", "Descuentos = AFP + ISSS", "", usd(afp) + " + " + usd(isss), usd(total))
      ]
    };
  }

  function parsearFecha(texto) {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto || "").trim());
    if (!coincidencia) return null;
    const fecha = { a: Number(coincidencia[1]), m: Number(coincidencia[2]), d: Number(coincidencia[3]) };
    const prueba = new Date(Date.UTC(fecha.a, fecha.m - 1, fecha.d));
    if (prueba.getUTCFullYear() !== fecha.a || prueba.getUTCMonth() !== fecha.m - 1 || prueba.getUTCDate() !== fecha.d) return null;
    if (fecha.a < 1900 || fecha.a > 2200) return null;
    return fecha;
  }

  function aMilisegundos(fecha) {
    return Date.UTC(fecha.a, fecha.m - 1, fecha.d);
  }

  function desdeMilisegundos(ms) {
    const x = new Date(ms);
    return { a: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
  }

  function sumarDias(fecha, dias) {
    return desdeMilisegundos(aMilisegundos(fecha) + dias * 86400000);
  }

  function compararFechas(a, b) {
    return aMilisegundos(a) - aMilisegundos(b);
  }

  function sumarAnios(fecha, anios) {
    const a = fecha.a + anios;
    const ultimoDia = new Date(Date.UTC(a, fecha.m, 0)).getUTCDate();
    return { a, m: fecha.m, d: Math.min(fecha.d, ultimoDia) };
  }

  function formatearFecha(fecha) {
    if (!fecha) return "";
    return String(fecha.d).padStart(2, "0") + "/" + String(fecha.m).padStart(2, "0") + "/" + fecha.a;
  }

  function diferenciaComercial(inicio, finInclusivo) {
    const fin = sumarDias(finInclusivo, 1);
    let anios = fin.a - inicio.a;
    let meses = fin.m - inicio.m;
    let dias = fin.d - inicio.d;
    if (dias < 0) {
      dias += CONFIG.diasMesComercial;
      meses -= 1;
    }
    if (dias >= CONFIG.diasMesComercial) {
      dias -= CONFIG.diasMesComercial;
      meses += 1;
    }
    if (meses < 0) {
      meses += 12;
      anios -= 1;
    }
    if (meses >= 12) {
      meses -= 12;
      anios += 1;
    }
    if (anios < 0) return { anios: 0, meses: 0, dias: 0, totalDias: 0 };
    return { anios, meses, dias, totalDias: anios * CONFIG.diasAnioComercial + meses * CONFIG.diasMesComercial + dias };
  }

  function analizarVacacion(inicio, fin, ultimaVacacion, sinVacaciones) {
    const antiguedad = diferenciaComercial(inicio, fin);
    if (antiguedad.anios < 1) {
      return { pendiente: false, aniversario: null, antiguedad };
    }
    const aniversario = sumarAnios(inicio, antiguedad.anios);
    if (sinVacaciones || !ultimaVacacion) {
      return { pendiente: true, aniversario, antiguedad };
    }
    return { pendiente: compararFechas(ultimaVacacion, aniversario) < 0, aniversario, antiguedad };
  }

  function analizarAguinaldo(inicio, fin, aplicarReforma) {
    const ref = CONFIG.fechaReferenciaAguinaldo;
    const referenciaAnio = { a: fin.a, m: ref.mes, d: ref.dia };
    let referencia = compararFechas(fin, referenciaAnio) >= 0 ? referenciaAnio : { a: fin.a - 1, m: ref.mes, d: ref.dia };
    let desdeInicio = false;
    if (compararFechas(inicio, referencia) > 0) {
      referencia = inicio;
      desdeInicio = true;
    }
    const periodo = diferenciaComercial(referencia, fin);
    const dias = Math.min(periodo.totalDias, CONFIG.diasAnioComercial);
    const antiguedad = diferenciaComercial(inicio, fin);
    const reforma = CONFIG.reformaAguinaldo;
    const vigente = compararFechas(fin, parsearFecha(reforma.vigenteDesde)) >= 0;
    const enVentana =
      compararFechas(fin, { a: fin.a, m: reforma.mesInicio, d: reforma.diaInicio }) >= 0 &&
      compararFechas(fin, { a: fin.a, m: reforma.mesFin, d: reforma.diaFin }) <= 0;
    const completo = !!aplicarReforma && vigente && enVentana && antiguedad.anios >= 1;
    return { referencia, desdeInicio, periodo, dias, completo, enVentana, vigente };
  }

  function minutosDe(texto) {
    const coincidencia = /^(\d{1,2}):(\d{2})$/.exec(String(texto || "").trim());
    if (!coincidencia) return null;
    const horas = Number(coincidencia[1]);
    const minutos = Number(coincidencia[2]);
    if (horas > 23 || minutos > 59) return null;
    return horas * 60 + minutos;
  }

  function solape(a1, a2, b1, b2) {
    return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  }

  function clasificarHoras(horaInicio, horaFin) {
    const inicio = minutosDe(horaInicio);
    const finOriginal = minutosDe(horaFin);
    if (inicio === null || finOriginal === null || inicio === finOriginal) return null;
    const fin = finOriginal > inicio ? finOriginal : finOriginal + 1440;
    const d1 = CONFIG.horaInicioDiurna * 60;
    const d2 = CONFIG.horaInicioNocturna * 60;
    const minutosDiurnos = solape(inicio, fin, d1, d2) + solape(inicio, fin, d1 + 1440, d2 + 1440);
    const total = fin - inicio;
    return {
      diurnas: minutosDiurnos / 60,
      nocturnas: (total - minutosDiurnos) / 60,
      total: total / 60,
      cruzaMedianoche: finOriginal <= inicio
    };
  }

  function calcularLiquidacion(d) {
    const avisos = [];
    const pasosAntiguedad = [];
    let antiguedad;
    let vacacionPendiente;
    let diasAguinaldo;
    let aguinaldoCompleto;

    if (d.modoAntiguedad === "fechas") {
      antiguedad = diferenciaComercial(d.fechaInicio, d.fechaFin);
      pasosAntiguedad.push(paso(
        "Tiempo de servicio",
        "Del primer al último día laborado, con meses comerciales de 30 días",
        "Inicio: " + formatearFecha(d.fechaInicio) + "; último día laborado: " + formatearFecha(d.fechaFin),
        "Conteo por años, meses y días",
        textoAntiguedad(antiguedad)
      ));
      const vac = analizarVacacion(d.fechaInicio, d.fechaFin, d.ultimaVacacion, d.sinVacaciones);
      vacacionPendiente = vac.pendiente;
      if (vac.aniversario) {
        pasosAntiguedad.push(paso(
          "Vacaciones del último año completo",
          "Se comparan las últimas vacaciones con el último aniversario de ingreso",
          "Último aniversario: " + formatearFecha(vac.aniversario) + "; últimas vacaciones: " + (d.sinVacaciones || !d.ultimaVacacion ? "no las ha gozado" : formatearFecha(d.ultimaVacacion)),
          vac.pendiente ? "Las últimas vacaciones son anteriores al aniversario" : "Las últimas vacaciones son posteriores al aniversario",
          vac.pendiente ? "Vacación completa pendiente de pago" : "Ya gozadas: solo corresponde la proporcional"
        ));
      }
      const ag = analizarAguinaldo(d.fechaInicio, d.fechaFin, d.aplicarReforma);
      diasAguinaldo = ag.dias;
      aguinaldoCompleto = ag.completo;
      pasosAntiguedad.push(paso(
        "Días para el aguinaldo",
        ag.desdeInicio ? "Días laborados desde la fecha de ingreso (meses de 30 días)" : "Días laborados desde el 12 de diciembre anterior (meses de 30 días)",
        "Desde " + formatearFecha(ag.referencia) + " hasta " + formatearFecha(d.fechaFin),
        numero(ag.periodo.anios * 12 + ag.periodo.meses) + " meses × 30 + " + numero(ag.periodo.dias) + " días",
        cantidad(ag.dias, "día", "días") + (ag.completo ? " (se paga completo por la reforma)" : "")
      ));
    } else {
      antiguedad = {
        anios: d.anios,
        meses: d.meses,
        dias: d.dias || 0,
        totalDias: d.anios * CONFIG.diasAnioComercial + d.meses * CONFIG.diasMesComercial + (d.dias || 0)
      };
      vacacionPendiente = !!d.vacacionPendiente && antiguedad.anios >= 1;
      diasAguinaldo = d.diasAguinaldo;
      aguinaldoCompleto = !!d.aguinaldoCompleto && antiguedad.anios >= 1;
      if (d.aguinaldoCompleto && antiguedad.anios < 1) {
        avisos.push("El aguinaldo completo requiere al menos un año de servicio; se calculó de forma proporcional.");
      }
    }

    const antiguedadAnios = antiguedad.anios + antiguedad.meses / 12 + antiguedad.dias / CONFIG.diasAnioComercial;
    const modo = d.modoRedondeo === "material" ? "material" : "exacto";

    const vacacion = calcularVacacion({
      salario: d.salario,
      mesesPeriodo: antiguedad.meses,
      diasPeriodo: antiguedad.dias,
      pendienteCompleta: vacacionPendiente,
      modo
    });
    const aguinaldo = calcularAguinaldo({
      salario: d.salario,
      antiguedadAnios,
      diasLaborados: diasAguinaldo,
      completo: aguinaldoCompleto,
      modo
    });
    const terminacion = d.causa === "renuncia"
      ? calcularRenuncia({ salario: d.salario, anios: antiguedad.anios, meses: antiguedad.meses, preaviso: d.preaviso, salarioMinimo: d.salarioMinimo })
      : calcularDespido({ salario: d.salario, anios: antiguedad.anios, meses: antiguedad.meses, dias: antiguedad.dias, salarioMinimo: d.salarioMinimo });

    const aplicaDiurnas = d.horasDiurnas !== null && d.horasDiurnas !== undefined;
    const aplicaNocturnas = d.horasNocturnas !== null && d.horasNocturnas !== undefined;
    const horas = calcularHorasExtras({
      salario: d.salario,
      horasJornada: d.horasJornada || CONFIG.horasJornadaDiurna,
      diurnas: aplicaDiurnas ? d.horasDiurnas : 0,
      nocturnas: aplicaNocturnas ? d.horasNocturnas : 0
    });
    const aplicaAsueto = d.diasAsueto !== null && d.diasAsueto !== undefined;
    const aplicaDescanso = d.diasDescanso !== null && d.diasDescanso !== undefined;
    const asueto = aplicaAsueto ? calcularAsueto({ salario: d.salario, dias: d.diasAsueto }) : null;
    const descanso = aplicaDescanso ? calcularDescanso({ salario: d.salario, dias: d.diasDescanso }) : null;

    const vacacionDetalle = textoPeriodo(antiguedad.meses, antiguedad.dias) + " del período en curso" + (vacacion.pendienteCompleta ? "; incluye " + usd(vacacion.total) + " de vacación completa pendiente" : "");

    const conceptos = [
      {
        clave: "vacacion",
        nombre: "Vacación proporcional",
        aplica: true,
        valor: vacacion.valor,
        detalle: vacacionDetalle,
        pasos: vacacion.pasos,
        notas: vacacion.notas
      },
      {
        clave: "aguinaldo",
        nombre: aguinaldo.completo ? "Aguinaldo completo" : "Aguinaldo proporcional",
        aplica: true,
        valor: aguinaldo.valor,
        detalle: aguinaldo.completo ? aguinaldo.categoria.dias + " días de salario (reforma 2026)" : cantidad(aguinaldo.dias, "día", "días") + " laborados; categoría de " + aguinaldo.categoria.dias + " días",
        pasos: aguinaldo.pasos,
        notas: aguinaldo.notas
      },
      {
        clave: "terminacion",
        nombre: d.causa === "renuncia" ? "Prestación por renuncia voluntaria" : "Indemnización por despido injustificado",
        aplica: true,
        valor: terminacion.valor,
        detalle: d.causa === "renuncia"
          ? (terminacion.cumple ? "15 días de salario por " + cantidad(antiguedad.anios, "año", "años") : "No cumple requisitos")
          : "30 días de salario por año y fracción proporcional",
        pasos: terminacion.pasos,
        notas: terminacion.notas,
        requisitos: terminacion.requisitos,
        mensaje: terminacion.mensaje
      },
      {
        clave: "hed",
        nombre: "Horas extras diurnas",
        aplica: aplicaDiurnas,
        valor: aplicaDiurnas ? horas.diurna.valor : 0,
        detalle: aplicaDiurnas ? cantidad(horas.diurna.horas, "hora", "horas") + " con recargo del 100 %" : "No aplica",
        pasos: aplicaDiurnas ? horas.diurna.pasos : [],
        notas: aplicaDiurnas ? [horas.notas[0]] : []
      },
      {
        clave: "hen",
        nombre: "Horas extras nocturnas",
        aplica: aplicaNocturnas,
        valor: aplicaNocturnas ? horas.nocturna.valor : 0,
        detalle: aplicaNocturnas ? cantidad(horas.nocturna.horas, "hora", "horas") + " a " + usdPreciso(horas.hn) + " la hora nocturna" : "No aplica",
        pasos: aplicaNocturnas ? horas.nocturna.pasos : [],
        notas: aplicaNocturnas ? horas.notas : []
      },
      {
        clave: "asueto",
        nombre: "Días de asueto laborados",
        aplica: aplicaAsueto,
        valor: aplicaAsueto ? asueto.valor : 0,
        detalle: aplicaAsueto ? cantidad(asueto.dias, "día", "días") + " a " + usdPreciso(asueto.se) : "No aplica",
        pasos: aplicaAsueto ? asueto.pasos : [],
        notas: aplicaAsueto ? asueto.notas : []
      },
      {
        clave: "descanso",
        nombre: "Días de descanso semanal laborados",
        aplica: aplicaDescanso,
        valor: aplicaDescanso ? descanso.valor : 0,
        detalle: aplicaDescanso ? cantidad(descanso.dias, "día", "días") + " a " + usdPreciso(descanso.sdd) : "No aplica",
        pasos: aplicaDescanso ? descanso.pasos : [],
        notas: aplicaDescanso ? descanso.notas : []
      }
    ];

    const total = redondear(conceptos.reduce((suma, c) => suma + (c.aplica ? c.valor : 0), 0));
    const pasoTotal = paso(
      "Total de la liquidación",
      "Total = suma de todos los conceptos",
      "",
      conceptos.filter(c => c.aplica).map(c => usd(c.valor)).join(" + "),
      usd(total)
    );

    let descuentos = null;
    if (d.descuentos && d.descuentos.aplicar) {
      const sobreTotal = d.descuentos.base === "total";
      descuentos = calcularDescuentos({
        base: sobreTotal ? total : terminacion.valor,
        tasaAFP: d.descuentos.tasaAFP,
        tasaISSS: d.descuentos.tasaISSS,
        nombreBase: sobreTotal ? "Total de la liquidación" : (d.causa === "renuncia" ? "Prestación por renuncia" : "Indemnización")
      });
    }

    if (modo === "material") {
      avisos.push("Precisión «como el material»: los factores diarios de vacación y aguinaldo se truncan a 3 decimales, igual que el ejemplo del Bloque 2. Para un resultado exacto, cambie la precisión a «exacta».");
    }

    return {
      antiguedad,
      antiguedadTexto: textoAntiguedad(antiguedad),
      antiguedadAnios,
      causa: d.causa,
      salario: d.salario,
      conceptos,
      total,
      pasoTotal,
      pasosAntiguedad,
      descuentos,
      liquido: descuentos ? redondear(total - descuentos.total) : total,
      avisos
    };
  }

  return {
    CONFIG,
    redondear,
    truncar,
    usd,
    usdPreciso,
    numero,
    porcentaje,
    cantidad,
    textoAntiguedad,
    textoPeriodo,
    calcularAsueto,
    calcularDescanso,
    calcularHorasExtras,
    calcularRenuncia,
    calcularDespido,
    calcularVacacion,
    calcularAguinaldo,
    categoriaAguinaldo,
    calcularDescuentos,
    calcularLiquidacion,
    parsearFecha,
    formatearFecha,
    compararFechas,
    sumarDias,
    sumarAnios,
    diferenciaComercial,
    analizarVacacion,
    analizarAguinaldo,
    clasificarHoras
  };
});
