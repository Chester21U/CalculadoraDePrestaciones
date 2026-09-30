const C = require("../js/calculos.js");

let aprobadas = 0;
let fallidas = 0;

function igual(nombre, obtenido, esperado) {
  const ok = typeof esperado === "number" ? Math.abs(obtenido - esperado) < 0.005 : obtenido === esperado;
  if (ok) {
    aprobadas += 1;
    console.log("  ✔ " + nombre + " = " + obtenido);
  } else {
    fallidas += 1;
    console.log("  ✘ " + nombre + ": se esperaba " + esperado + " y se obtuvo " + obtenido);
  }
}

function grupo(titulo, fn) {
  console.log("\n" + titulo);
  fn();
}

const f = C.parsearFecha;

grupo("Caso 1. Renuncia voluntaria: $600, 4 años", () => {
  const r = C.calcularRenuncia({ salario: 600, anios: 4, meses: 0, preaviso: true });
  igual("cumple requisitos", r.cumple, true);
  igual("prestación ($20 × 15 × 4)", r.valor, 1200);
});

grupo("Renuncia sin requisitos", () => {
  igual("1 año 11 meses no cumple", C.calcularRenuncia({ salario: 600, anios: 1, meses: 11, preaviso: true }).valor, 0);
  igual("sin preaviso no genera nada", C.calcularRenuncia({ salario: 600, anios: 5, preaviso: false }).valor, 0);
  igual("exactamente 2 años sí cumple", C.calcularRenuncia({ salario: 600, anios: 2, preaviso: true }).valor, 600);
});

grupo("Renuncia con tope de 2 salarios mínimos ($408.80)", () => {
  const r = C.calcularRenuncia({ salario: 1000, anios: 3, preaviso: true });
  igual("salario considerado", r.base, 817.6);
  igual("prestación (817.60 ÷ 30 × 15 × 3)", r.valor, 1226.4);
});

grupo("Caso 2. Despido injustificado: $600, 6 años y 9 meses (ejemplo del material)", () => {
  const r = C.calcularDespido({ salario: 600, anios: 6, meses: 9 });
  igual("días de la fracción (9 × 30)", r.diasFraccion, 270);
  igual("indemnización total", r.valor, 4050);
});

grupo("Despido con tope de 4 salarios mínimos y mínimo de 15 días", () => {
  igual("$3,000 × 2 años con tope $1,635.20", C.calcularDespido({ salario: 3000, anios: 2 }).valor, 3270.4);
  const corto = C.calcularDespido({ salario: 600, anios: 0, meses: 0, dias: 5 });
  igual("5 días de servicio se eleva al mínimo de 15 días", corto.valor, 300);
  igual("se marca el mínimo aplicado", corto.minimoAplicado, true);
});

grupo("Caso 3. Asueto: $600, 2 días", () => {
  const r = C.calcularAsueto({ salario: 600, dias: 2 });
  igual("SBD", r.sbd, 20);
  igual("SE = SBD × 2", r.se, 40);
  igual("total", r.valor, 80);
});

grupo("Caso 4. Descanso semanal: $450, 2 días", () => {
  const r = C.calcularDescanso({ salario: 450, dias: 2 });
  igual("SBD", r.sbd, 15);
  igual("SDD = SBD × 1.5", r.sdd, 22.5);
  igual("total", r.valor, 45);
});

grupo("Horas extras (ejemplos del material)", () => {
  const r = C.calcularHorasExtras({ salario: 720, horasJornada: 8, diurnas: 2, nocturnas: 2 });
  igual("hora ordinaria de $720 ÷ 30 ÷ 8", r.h, 3);
  igual("HE = $3 × 2 × 2", r.diurna.valor, 12);
  igual("HN = $3 × 1.25", r.hn, 3.75);
  igual("HEN = $3.75 × 2 × 2", r.nocturna.valor, 15);
  const n = C.calcularHorasExtras({ salario: 480, nocturnas: 1 });
  igual("HN = $2.00 × 1.25 (ejemplo del material)", n.hn, 2.5);
});

grupo("Vacaciones y aguinaldo (ejemplos del material)", () => {
  igual("RV = $30 × 15 × 1.3", C.calcularVacacion({ salario: 900, mesesPeriodo: 12 }).total, 585);
  igual("vacación completa con $10 diarios", C.calcularVacacion({ salario: 300, mesesPeriodo: 12 }).total, 195);
  igual("PA = $21 × 15", C.calcularAguinaldo({ salario: 630, antiguedadAnios: 2, completo: true }).valor, 315);
  igual("$10 diarios, 2 años", C.calcularAguinaldo({ salario: 300, antiguedadAnios: 2, completo: true }).valor, 150);
  igual("$10 diarios, 5 años", C.calcularAguinaldo({ salario: 300, antiguedadAnios: 5, completo: true }).valor, 190);
  igual("$10 diarios, más de 10 años", C.calcularAguinaldo({ salario: 300, antiguedadAnios: 11, completo: true }).valor, 210);
  igual("categoría con exactamente 3 años", C.categoriaAguinaldo(3).dias, 19);
  igual("categoría con exactamente 10 años", C.categoriaAguinaldo(10).dias, 19);
});

grupo("Conteo comercial de fechas", () => {
  const a = C.diferenciaComercial(f("2015-01-01"), f("2021-09-30"));
  igual("antigüedad del ejemplo: años", a.anios, 6);
  igual("antigüedad del ejemplo: meses", a.meses, 9);
  igual("antigüedad del ejemplo: días", a.dias, 0);
  igual("días de aguinaldo del 12/12/2020 al 30/09/2021", C.diferenciaComercial(f("2020-12-12"), f("2021-09-30")).totalDias, 289);
  igual("fecha inválida 31/02", C.parsearFecha("2026-02-31"), null);
});

grupo("Clasificación de horas extras por hora de inicio y fin", () => {
  const a = C.clasificarHoras("17:00", "21:00");
  igual("17:00 a 21:00 diurnas", a.diurnas, 2);
  igual("17:00 a 21:00 nocturnas", a.nocturnas, 2);
  const b = C.clasificarHoras("22:00", "02:00");
  igual("22:00 a 02:00 nocturnas (cruza medianoche)", b.nocturnas, 4);
  const c = C.clasificarHoras("05:00", "07:00");
  igual("05:00 a 07:00 diurnas", c.diurnas, 1);
  igual("05:00 a 07:00 nocturnas", c.nocturnas, 1);
});

const casoMaterial = {
  salario: 600,
  salarioMinimo: 408.8,
  modoAntiguedad: "fechas",
  fechaInicio: f("2015-01-01"),
  fechaFin: f("2021-09-30"),
  ultimaVacacion: f("2021-04-01"),
  sinVacaciones: false,
  causa: "despido",
  horasJornada: 8,
  horasDiurnas: null,
  horasNocturnas: null,
  diasAsueto: null,
  diasDescanso: null,
  aplicarReforma: true
};

grupo("Liquidación del caso Roberto Herrera, precisión exacta", () => {
  const r = C.calcularLiquidacion({ ...casoMaterial, modoRedondeo: "exacto" });
  const v = clave => r.conceptos.find(c => c.clave === clave).valor;
  igual("indemnización", v("terminacion"), 4050);
  igual("vacación proporcional (390 × 9 ÷ 12)", v("vacacion"), 292.5);
  igual("aguinaldo proporcional (380 ÷ 360 × 289)", v("aguinaldo"), 305.06);
  igual("total exacto", r.total, 4647.56);
});

grupo("Liquidación del caso Roberto Herrera, precisión como el material", () => {
  const r = C.calcularLiquidacion({ ...casoMaterial, modoRedondeo: "material" });
  const v = clave => r.conceptos.find(c => c.clave === clave).valor;
  igual("vacación proporcional ($1.083 × 270)", v("vacacion"), 292.41);
  igual("aguinaldo proporcional ($1.055 × 289)", v("aguinaldo"), 304.9);
  igual("total del material", r.total, 4647.31);
});

grupo("Caso 5. Liquidación completa con todos los conceptos", () => {
  const r = C.calcularLiquidacion({
    salario: 750,
    salarioMinimo: 408.8,
    modoAntiguedad: "manual",
    anios: 4,
    meses: 5,
    dias: 0,
    vacacionPendiente: false,
    diasAguinaldo: 150,
    aguinaldoCompleto: false,
    causa: "despido",
    horasJornada: 8,
    horasDiurnas: 6,
    horasNocturnas: 3,
    diasAsueto: 2,
    diasDescanso: 1,
    modoRedondeo: "exacto",
    descuentos: { aplicar: true, base: "indemnizacion", tasaAFP: 0.0725, tasaISSS: 0.03 }
  });
  const v = clave => r.conceptos.find(c => c.clave === clave).valor;
  igual("vacación: 25 × 15 × 1.3 = 487.50; × 5 ÷ 12", v("vacacion"), 203.13);
  igual("aguinaldo: 25 × 19 = 475; ÷ 360 × 150", v("aguinaldo"), 197.92);
  igual("indemnización: 750 × 4 + 750 ÷ 360 × 150", v("terminacion"), 3312.5);
  igual("horas diurnas: 3.125 × 6 × 2", v("hed"), 37.5);
  igual("horas nocturnas: 3.90625 × 3 × 2", v("hen"), 23.44);
  igual("asueto: 50 × 2", v("asueto"), 100);
  igual("descanso: 37.50 × 1", v("descanso"), 37.5);
  igual("total", r.total, 3911.99);
  igual("AFP 7.25 % de la indemnización", r.descuentos.afp, 240.16);
  igual("ISSS 3 % de la indemnización", r.descuentos.isss, 99.38);
  igual("líquido a recibir", r.liquido, 3572.45);
});

grupo("Reforma de aguinaldo (septiembre 2026)", () => {
  const base = { ...casoMaterial, fechaInicio: f("2020-03-01"), ultimaVacacion: f("2026-04-01"), modoRedondeo: "exacto" };
  const despues = C.calcularLiquidacion({ ...base, fechaFin: f("2026-10-15") });
  igual("terminación 15/10/2026 paga aguinaldo completo (20 × 19)", despues.conceptos[1].valor, 380);
  const antes = C.calcularLiquidacion({ ...base, fechaFin: f("2026-09-30") });
  igual("terminación 30/09/2026 sigue siendo proporcional", antes.conceptos[1].nombre, "Aguinaldo proporcional");
  const sinReforma = C.calcularLiquidacion({ ...base, fechaFin: f("2026-10-15"), aplicarReforma: false });
  igual("con la reforma desactivada vuelve a ser proporcional", sinReforma.conceptos[1].nombre, "Aguinaldo proporcional");
});

grupo("Vacación completa pendiente", () => {
  const r = C.calcularLiquidacion({ ...casoMaterial, sinVacaciones: true, ultimaVacacion: null, modoRedondeo: "exacto" });
  igual("vacación proporcional más completa pendiente (292.50 + 390)", r.conceptos[0].valor, 682.5);
});

console.log("\nResultado: " + aprobadas + " pruebas aprobadas, " + fallidas + " fallidas.");
process.exit(fallidas ? 1 : 0);
