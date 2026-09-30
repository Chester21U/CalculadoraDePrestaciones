window.Contenido = {
  ASUETOS: [
    { id: "anio-nuevo", fecha: "1 de enero", motivo: "Año nuevo" },
    { id: "jueves-santo", fecha: "Jueves Santo", motivo: "Semana Santa" },
    { id: "viernes-santo", fecha: "Viernes Santo", motivo: "Semana Santa" },
    { id: "sabado-santo", fecha: "Sábado Santo", motivo: "Semana Santa" },
    { id: "dia-trabajo", fecha: "1 de mayo", motivo: "Día del trabajo" },
    { id: "dia-madres", fecha: "10 de mayo", motivo: "Día de las madres" },
    { id: "dia-padre", fecha: "17 de junio", motivo: "Día del padre" },
    { id: "agosto-3", fecha: "3 de agosto", motivo: "Fiestas agostinas, ciudad de San Salvador" },
    { id: "agosto-5", fecha: "5 de agosto", motivo: "Fiestas agostinas, ciudad de San Salvador" },
    { id: "agosto-6", fecha: "6 de agosto", motivo: "Día del Divino Salvador del Mundo" },
    { id: "patronales", fecha: "Fiestas patronales", motivo: "Día principal, en los demás municipios" },
    { id: "independencia", fecha: "15 de septiembre", motivo: "Independencia de El Salvador" },
    { id: "difuntos", fecha: "2 de noviembre", motivo: "Día de los difuntos" },
    { id: "navidad", fecha: "25 de diciembre", motivo: "Navidad" }
  ],

  ORIGENES: {
    material: "Del material",
    derivada: "Derivada del material",
    clase: "Indicación de clase",
    externa: "Fuente externa"
  },

  GRUPOS_FORMULAS: [
    { titulo: "Salario base y horas", ids: ["sbd", "h", "hn"] },
    { titulo: "Jornadas extraordinarias y días especiales", ids: ["he", "hen", "se", "sdd"] },
    { titulo: "Vacación y aguinaldo", ids: ["rv", "vp", "pa", "ap"] },
    { titulo: "Terminación de la relación laboral", ids: ["renuncia", "despido"] },
    { titulo: "Total y descuentos", ids: ["total", "descuentos"] }
  ],

  FORMULAS: [
    {
      id: "sbd",
      nombre: "Salario básico diario",
      expresion: "SBD = SBM ÷ 30",
      explicacion: "Convierte el salario mensual en salario de un día. Es la base de casi todos los cálculos.",
      variables: [
        ["SBD", "Salario básico u ordinario diario."],
        ["SBM", "Salario básico u ordinario mensual."],
        ["30", "Días del mes comercial (constante)."]
      ],
      origen: "material",
      fuente: "Material, apartado 3.2: ejemplo de asueto con salario de $600 → SBD = $20.00."
    },
    {
      id: "h",
      nombre: "Remuneración por hora ordinaria",
      expresion: "H = SBD ÷ horas de la jornada ordinaria",
      explicacion: "El material da la hora ordinaria como dato ($3.00). Para obtenerla desde el salario mensual se divide el salario diario entre las horas de la jornada del contrato, el mismo procedimiento que el material usa para el salario extraordinario por hora en asueto.",
      variables: [
        ["H", "Remuneración por hora ordinaria (hora diurna, HD)."],
        ["SBD", "Salario básico diario."],
        ["Horas", "Horas de la jornada del contrato. Por defecto 8, máximo de la jornada diurna (Art. 161)."]
      ],
      origen: "derivada",
      fuente: "Material, apartado 3.2 (SE ÷ número de horas laborales según el contrato) y Art. 161 del Código de Trabajo."
    },
    {
      id: "hn",
      nombre: "Hora nocturna",
      expresion: "HN = HD × 1.25",
      explicacion: "La hora trabajada entre las 7:00 p. m. y las 6:00 a. m. se paga con un recargo del 25 % sobre la hora diurna.",
      variables: [
        ["HN", "Remuneración por hora nocturna."],
        ["HD", "Remuneración por hora diurna."],
        ["1.25", "Constante para adicionar 25 %."]
      ],
      origen: "material",
      fuente: "Material, jornada nocturna: HN = $2.00 × 1.25 = $2.50."
    },
    {
      id: "he",
      nombre: "Horas extras diurnas",
      expresion: "HE = H × HL × 2",
      explicacion: "Las horas extraordinarias se pagan con un recargo del 100 % del salario básico por hora.",
      variables: [
        ["HE", "Remuneración total por horas extras."],
        ["H", "Remuneración por cada hora de jornada ordinaria."],
        ["HL", "Número de horas extras laboradas."],
        ["2", "Constante para adicionar recargo del 100 %."]
      ],
      origen: "material",
      fuente: "Material, horas extraordinarias: HE = $3.00 × 2 × 2 = $12.00."
    },
    {
      id: "hen",
      nombre: "Horas extras nocturnas",
      expresion: "HEN = HN × HL × 2",
      explicacion: "Combina las dos fórmulas del material: primero se obtiene la hora nocturna (HN = HD × 1.25) y luego se aplica el recargo del 100 % de las horas extras.",
      variables: [
        ["HEN", "Remuneración total por horas extras nocturnas."],
        ["HN", "Valor de la hora nocturna."],
        ["HL", "Número de horas extras nocturnas."],
        ["2", "Recargo del 100 % de horas extras."]
      ],
      origen: "derivada",
      fuente: "Combinación de HN = HD × 1.25 y HE = H × HL × 2, ambas del material. El material no presenta un ejemplo numérico de esta combinación."
    },
    {
      id: "se",
      nombre: "Día de asueto laborado",
      expresion: "SE = SBD × 2",
      explicacion: "Quien trabaja en un día de asueto recibe el salario ordinario más un recargo del 100 %.",
      variables: [
        ["SE", "Salario extraordinario por laborar en día de asueto."],
        ["SBD", "Salario básico diario."],
        ["2", "Constante para adicionar un recargo del 100 %."]
      ],
      origen: "material",
      fuente: "Material, apartado 3.2: SE = $20 × 2 = $40."
    },
    {
      id: "sdd",
      nombre: "Día de descanso semanal laborado",
      expresion: "SDD = SBD × 1.5",
      explicacion: "Trabajar el día de descanso semanal da derecho al salario de ese día más un recargo mínimo del 50 %, y a un día de descanso compensatorio.",
      variables: [
        ["SDD", "Salario por laborar en día de descanso semanal."],
        ["SBD", "Salario básico diario."],
        ["1.5", "Constante para adicionar 50 % de recargo."]
      ],
      origen: "material",
      fuente: "Material, descanso semanal: SDD = $15 × 1.5 = $22.50."
    },
    {
      id: "rv",
      nombre: "Vacación completa",
      expresion: "RV = SBD × 15 × 1.3",
      explicacion: "Quince días de salario más el 30 % adicional. El material también lo presenta en dos pasos: PV = SBD × 15 y recargo = PV × 30 %.",
      variables: [
        ["RV", "Remuneración por período vacacional."],
        ["SBD", "Salario básico diario."],
        ["15", "Días de vacación."],
        ["1.3", "Constante para adicionar 30 %."]
      ],
      origen: "material",
      fuente: "Material, vacaciones: RV = $30 × 15 × 1.3 = $585."
    },
    {
      id: "vp",
      nombre: "Vacación proporcional",
      expresion: "VP = (Total de vacaciones × meses trabajados) ÷ 12",
      explicacion: "Se usa cuando el trabajador no completó el año de servicio. Si además hay días sueltos, se expresan como fracción de mes (días ÷ 30).",
      variables: [
        ["VP", "Vacación proporcional."],
        ["Total de vacaciones", "PV más el recargo del 30 %."],
        ["Meses trabajados", "Meses del período vacacional en curso."],
        ["12", "Meses del año."]
      ],
      origen: "material",
      fuente: "Material, cálculo de vacaciones proporcionales."
    },
    {
      id: "pa",
      nombre: "Aguinaldo completo",
      expresion: "PA = SBD × D",
      explicacion: "El número de días depende de la antigüedad: menos de 3 años, 15 días; de 3 a 10 años, 19 días; más de 10 años, 21 días.",
      variables: [
        ["PA", "Prestación por aguinaldo."],
        ["SBD", "Salario básico diario."],
        ["D", "Días según categoría (15, 19 o 21)."]
      ],
      origen: "material",
      fuente: "Material, aguinaldo: PA = $21 × 15 = $315."
    },
    {
      id: "ap",
      nombre: "Aguinaldo proporcional",
      expresion: "AP = (PA ÷ 360) × días laborados",
      explicacion: "Se divide el aguinaldo completo entre el año comercial y se multiplica por los días laborados desde el 12 de diciembre anterior (o desde el ingreso, si es posterior).",
      variables: [
        ["AP", "Aguinaldo proporcional."],
        ["PA", "Aguinaldo completo."],
        ["360", "Año comercial."],
        ["Días laborados", "Meses completos × 30 más los días sueltos."]
      ],
      origen: "material",
      fuente: "Material, caso Roberto Herrera: $380 ÷ 360 × 289 días."
    },
    {
      id: "renuncia",
      nombre: "Prestación por renuncia voluntaria",
      expresion: "Prestación = SBD × 15 × años de servicio",
      explicacion: "Requiere al menos 2 años de servicio continuo y renuncia por escrito con preaviso. Ningún salario se considera mayor a 2 veces el salario mínimo del sector.",
      variables: [
        ["SBD", "Salario básico diario, con el tope de 2 salarios mínimos."],
        ["15", "Días de salario por cada año de servicio."],
        ["Años", "Años de servicio continuo."]
      ],
      origen: "material",
      fuente: "Ley Reguladora de la Prestación Económica por Renuncia Voluntaria, Arts. 2 y 4, según el material."
    },
    {
      id: "despido",
      nombre: "Indemnización por despido injustificado",
      expresion: "I = SBM × años + (SBM ÷ 360) × días de la fracción",
      explicacion: "Treinta días de salario por cada año de servicio y proporcionalmente por las fracciones. No puede ser menor a 15 días de salario y ningún salario se considera mayor a 4 salarios mínimos.",
      variables: [
        ["I", "Indemnización."],
        ["SBM", "Salario básico mensual, con el tope de 4 salarios mínimos. Equivale a 30 días de salario."],
        ["Días de la fracción", "Meses restantes × 30 más los días sueltos."],
        ["360", "Año comercial."]
      ],
      origen: "material",
      fuente: "Código de Trabajo, Art. 58, y caso Roberto Herrera del material: 6 × $600 + $600 ÷ 360 × 270 = $4,050."
    },
    {
      id: "total",
      nombre: "Total de la liquidación",
      expresion: "Total = VP + AP + I (o prestación) + HE + HEN + SE + SDD",
      explicacion: "Suma automática de todos los conceptos que aplican. Los conceptos marcados como «No aplica» suman $0.00.",
      variables: [
        ["VP, AP", "Vacación y aguinaldo."],
        ["I", "Indemnización o prestación por renuncia, según la causa."],
        ["HE, HEN", "Horas extras diurnas y nocturnas."],
        ["SE, SDD", "Asuetos y descansos semanales laborados."]
      ],
      origen: "material",
      fuente: "Material, último paso del caso Roberto Herrera (sumatoria de prestaciones) e instrucciones de la actividad."
    },
    {
      id: "descuentos",
      nombre: "Descuentos de AFP e ISSS",
      expresion: "Descuento = base × (7.25 % + 3 %)",
      explicacion: "En la pizarra de clase se indicó restar AFP e ISSS al total de la indemnización. Las tasas no aparecen en el material: se usan las cotizaciones vigentes del trabajador y pueden editarse o desactivarse.",
      variables: [
        ["Base", "Indemnización o prestación por renuncia (por defecto), o el total de la liquidación."],
        ["7.25 %", "Cotización del trabajador al sistema de pensiones (AFP)."],
        ["3 %", "Cotización del trabajador al ISSS."]
      ],
      origen: "clase",
      fuente: "Pizarra de clase. Tasas de referencia de fuentes externas; conviene confirmarlas con el docente."
    }
  ],

  CRITERIOS: [
    "Se usan meses comerciales de 30 días y año comercial de 360 días, como en el material y en la mayoría de Juzgados de lo Laboral.",
    "Los cálculos se hacen con todos los decimales y cada concepto se redondea a dos decimales al final. El total es la suma de los conceptos ya redondeados.",
    "El ejemplo del material trunca los factores diarios de vacación ($1.083) y aguinaldo ($1.055) a tres decimales; por eso su total es $4,647.31 y el exacto es $4,647.56. La calculadora completa permite elegir cualquiera de las dos precisiones.",
    "Con fechas, el tiempo de servicio se cuenta del primer al último día laborado, ambos incluidos, igual que en el caso Roberto Herrera (1/1/2015 al 30/9/2021 = 6 años y 9 meses).",
    "La vacación completa pendiente se suma cuando las últimas vacaciones son anteriores al último aniversario de ingreso. Como la ley prohíbe acumularlas, solo se considera un año pendiente.",
    "En el aguinaldo, exactamente 10 años se ubica en la categoría de 19 días, siguiendo la redacción del material («entre tres y diez años»).",
    "La prestación por renuncia se calcula por años completos de servicio, según el procedimiento del material.",
    "Salario mínimo por defecto: $408.80, sector comercio, industria y servicios, vigente desde el 1 de junio de 2025. Puede editarse en cada formulario."
  ],

  BASE_LEGAL: [
    {
      norma: "Código de Trabajo de El Salvador",
      referencia: "Decreto Legislativo N.º 15 (1972)",
      articulos: [
        { art: "Art. 58", tema: "Indemnización por despido injustificado", regula: "Treinta días de salario básico por cada año de servicio y proporcionalmente por las fracciones de año. Nunca menos de quince días de salario; para el cálculo, ningún salario se considera mayor a cuatro veces el salario mínimo legal vigente.", origen: "material" },
        { art: "Art. 161", tema: "Jornada de trabajo", regula: "Jornada diurna entre las 6:00 a. m. y las 7:00 p. m., con máximo de 8 horas diarias y 44 semanales; permite dividir la jornada con autorización del Ministerio de Trabajo.", origen: "material" },
        { art: "Art. 166", tema: "Descanso dentro de la jornada", regula: "Treinta minutos para tomar alimentos y descansar, contabilizados dentro de la jornada.", origen: "material" },
        { art: "Art. 167", tema: "Descanso entre jornadas", regula: "Mínimo de ocho horas de descanso entre una jornada y la siguiente.", origen: "material" },
        { art: "Arts. 171 y 174", tema: "Descanso semanal", regula: "Un día de descanso semanal remunerado con salario básico; se pierde esa remuneración por faltas injustificadas.", origen: "material" },
        { art: "Arts. 177 y 190", tema: "Vacaciones", regula: "Quince días de vacaciones remuneradas después de un año de trabajo continuo, con un recargo del 30 % sobre el salario ordinario.", origen: "material" },
        { art: "Art. 193", tema: "Trabajo en días de asueto", regula: "Excepciones que permiten laborar en asueto. Quien trabaja ese día devenga el salario ordinario más un recargo del 100 %.", origen: "material" },
        { art: "Art. 196", tema: "Aguinaldo", regula: "El aguinaldo es una prima que el patrono otorga a sus trabajadores por cada año de trabajo.", origen: "material" },
        { art: "Sin número en el material", tema: "Pago del aguinaldo", regula: "Se paga íntegro a quien al 12 de diciembre tiene un año completo de trabajo y de forma proporcional a quien no lo ha cumplido. Categorías: menos de 3 años, 15 días; de 3 a 10 años, 19 días; más de 10 años, 21 días.", origen: "material" },
        { art: "Arts. 197, 200 y 202", tema: "Reforma al aguinaldo (septiembre de 2026)", regula: "Habilita el pago del aguinaldo desde el 1 de octubre y fija el 12 de diciembre como referencia para el aguinaldo proporcional. En la pizarra se indicó que, si la terminación ocurre a partir del 1 de octubre de 2026, el aguinaldo es completo.", origen: "externa", nota: "Aprobada por la Asamblea Legislativa el 23 de septiembre de 2026 (Infobae, 23/09/2026). No está en el material; verifique su publicación en el Diario Oficial." },
        { art: "Sin número en el material", tema: "Horas extraordinarias", regula: "Las horas extras, pactadas de manera ocasional, se remuneran con un recargo del 100 % del salario básico por hora.", origen: "material" },
        { art: "Sin número en el material", tema: "Jornada nocturna", regula: "Entre las 7:00 p. m. y las 6:00 a. m., con máximo de 7 horas diarias y 39 semanales. La hora nocturna lleva un recargo del 25 % sobre la diurna.", origen: "material" },
        { art: "Sin número en el material", tema: "Descanso semanal laborado", regula: "Salario básico del día más un recargo mínimo del 50 % y un día de descanso compensatorio en la misma semana o en la siguiente.", origen: "material" },
        { art: "Reforma de noviembre de 2019", tema: "Pérdida del aguinaldo", regula: "Ningún trabajador pierde el aguinaldo por causas disciplinarias o inasistencias. Si el despido injustificado ocurre antes del 12 de diciembre, se paga el aguinaldo proporcional.", origen: "material" }
      ]
    },
    {
      norma: "Ley Reguladora de la Prestación Económica por Renuncia Voluntaria",
      referencia: "Decreto Legislativo N.º 592 (2014)",
      articulos: [
        { art: "Arts. 2 y 4", tema: "Requisitos", regula: "Preaviso por escrito de 15 días (30 días en cargos de dirección, jefatura o trabajo especializado); renuncia escrita con copia del DUI, en hojas del Ministerio de Trabajo, ante Juez de lo Laboral o en documento privado autenticado; mínimo de dos años de servicio continuo con el mismo patrono.", origen: "material" },
        { art: "Arts. 2 y 4", tema: "Prestación económica", regula: "Quince días de salario básico por cada año de servicio, sin que ningún salario supere dos veces el salario mínimo del sector. Se paga dentro de los 15 días siguientes a la renuncia. La vacación y el aguinaldo, completos o proporcionales, no se pierden.", origen: "material" }
      ]
    },
    {
      norma: "Constitución de la República de El Salvador",
      referencia: "1983",
      articulos: [
        { art: "Sin número en el material", tema: "Límites de la jornada", regula: "Establece los límites de la jornada diurna y nocturna; ningún contrato puede acordar lo contrario.", origen: "material" }
      ]
    },
    {
      norma: "Datos de referencia fuera del material",
      referencia: "Usados como valores editables",
      articulos: [
        { art: "Salario mínimo", tema: "Tope de renuncia y despido", regula: "$408.80 mensuales para comercio, industria y servicios, vigentes desde el 1 de junio de 2025. Se usa para los topes de 2 y 4 salarios mínimos.", origen: "externa", nota: "Tarifas publicadas en el Diario Oficial el 23 de mayo de 2025 (alerta tributaria EY)." },
        { art: "AFP e ISSS", tema: "Descuentos indicados en clase", regula: "Cotizaciones del trabajador: 7.25 % para AFP y 3 % para ISSS. La pizarra indica restarlas al total de la indemnización.", origen: "clase", nota: "Las tasas no aparecen en el material; confirme con el docente la base sobre la que se aplican." },
        { art: "Ley Especial Quincena Veinticinco", tema: "Ingreso complementario de enero", regula: "Equivale al 50 % del salario mensual para salarios de hasta $1,500. Se menciona en el material pero no forma parte de la liquidación.", origen: "material" }
      ]
    }
  ],

  FUENTES: [
    "Universidad Gerardo Barrios. Material de estudio de Derecho Empresarial e Informático: jornadas de trabajo; 3.2 Asuetos, vacaciones y aguinaldos; prestación por renuncia; indemnización por despido injustificado.",
    "Universidad Gerardo Barrios. Laboratorio 2: Calculando prestaciones laborales (instrucciones de la actividad).",
    "Apuntes de la pizarra de clase (criterios de la aplicación).",
    "Código de Trabajo de El Salvador, Decreto N.º 15 (1972).",
    "Ley Reguladora de la Prestación Económica por Renuncia Voluntaria, Decreto N.º 592 (2014).",
    "Infobae (23 de septiembre de 2026). Asamblea Legislativa aprueba que el aguinaldo pueda pagarse desde el 1 de octubre.",
    "EY (2025). El Salvador: salario mínimo, alerta tributaria."
  ]
};
