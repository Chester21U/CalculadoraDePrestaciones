(function () {
  "use strict";

  const C = window.Calculos;
  const T = window.Contenido;
  const NOMBRE_APP = "Calculadora de Prestaciones Laborales";
  const RESULTADOS = {
    "form-liquidacion": "res-liquidacion",
    "form-renuncia": "res-renuncia",
    "form-despido": "res-despido",
    "form-asueto": "res-asueto",
    "form-descanso": "res-descanso",
    "form-horas": "res-horas"
  };
  const marcadores = {};
  const origenesDialogo = new WeakMap();

  const $ = (selector, raiz = document) => raiz.querySelector(selector);
  const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));

  function esc(texto) {
    return String(texto === null || texto === undefined ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function movimientoReducido() {
    return !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function desplazarA(elemento, bloque) {
    if (!elemento || typeof elemento.scrollIntoView !== "function") return;
    elemento.scrollIntoView({ behavior: movimientoReducido() ? "auto" : "smooth", block: bloque || "start" });
  }

  function enfocar(elemento) {
    if (!elemento) return;
    try {
      elemento.focus({ preventScroll: true });
    } catch (e) {
      elemento.focus();
    }
  }

  function fechaHoy() {
    const hoy = new Date();
    return C.formatearFecha({ a: hoy.getFullYear(), m: hoy.getMonth() + 1, d: hoy.getDate() });
  }

  const vistas = $$("[data-vista]");
  const nombresVista = vistas.map(v => v.dataset.vista);
  const botonMenu = $("[data-menu]");
  let primeraCarga = true;

  function vistaSolicitada() {
    let nombre = location.hash.replace(/^#/, "");
    try {
      nombre = decodeURIComponent(nombre);
    } catch (e) {
      nombre = "";
    }
    return nombresVista.includes(nombre) ? nombre : "inicio";
  }

  function mostrarVista() {
    const nombre = vistaSolicitada();
    const vista = vistas.find(v => v.dataset.vista === nombre);
    vistas.forEach(v => {
      v.hidden = v !== vista;
    });
    $$(".menu a").forEach(enlace => {
      if (enlace.getAttribute("href") === "#" + nombre) {
        enlace.setAttribute("aria-current", "page");
      } else {
        enlace.removeAttribute("aria-current");
      }
    });
    const titulo = vista ? $("h1", vista) : null;
    document.title = nombre === "inicio" || !titulo
      ? NOMBRE_APP + " | El Salvador"
      : titulo.textContent.trim() + " | " + NOMBRE_APP;
    cerrarMenu(false);
    if (!primeraCarga) {
      if (typeof window.scrollTo === "function") {
        try {
          window.scrollTo(0, 0);
        } catch (e) {
          document.documentElement.scrollTop = 0;
        }
      }
      enfocar(titulo);
    }
    primeraCarga = false;
  }

  function abrirMenu() {
    document.body.classList.add("menu-abierto");
    botonMenu.setAttribute("aria-expanded", "true");
    enfocar($("#menu a"));
  }

  function cerrarMenu(devolverFoco) {
    if (!document.body.classList.contains("menu-abierto")) return;
    document.body.classList.remove("menu-abierto");
    botonMenu.setAttribute("aria-expanded", "false");
    if (devolverFoco) enfocar(botonMenu);
  }

  function nodoError(input) {
    return input.id ? document.getElementById(input.id + "-error") : null;
  }

  function enlazarDescripcion(elemento, id, agregar) {
    const actuales = (elemento.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean).filter(x => x !== id);
    if (agregar) actuales.push(id);
    if (actuales.length) {
      elemento.setAttribute("aria-describedby", actuales.join(" "));
    } else {
      elemento.removeAttribute("aria-describedby");
    }
  }

  function mostrarError(input, mensaje) {
    input.setAttribute("aria-invalid", "true");
    delete input.dataset.aviso;
    const nodo = nodoError(input);
    if (nodo) {
      nodo.textContent = mensaje;
      nodo.hidden = false;
      enlazarDescripcion(input, nodo.id, true);
    }
  }

  function limpiarError(input) {
    input.removeAttribute("aria-invalid");
    delete input.dataset.aviso;
    const nodo = nodoError(input);
    if (nodo) {
      nodo.textContent = "";
      nodo.hidden = true;
      enlazarDescripcion(input, nodo.id, false);
    }
  }

  function grupoRadios(form, nombre) {
    return $$('input[type="radio"]', form).filter(r => r.name === nombre);
  }

  function errorGrupo(form, nombre, mensaje) {
    const nodo = document.getElementById(form.id + "-" + nombre + "-error");
    const radios = grupoRadios(form, nombre);
    const contenedor = radios.length ? radios[0].closest('[role="radiogroup"]') : null;
    if (nodo) {
      nodo.textContent = mensaje;
      nodo.hidden = false;
    }
    if (contenedor) {
      contenedor.setAttribute("aria-invalid", "true");
      if (nodo) enlazarDescripcion(contenedor, nodo.id, true);
    }
    return radios[0] || null;
  }

  function limpiarGrupo(form, nombre) {
    const nodo = document.getElementById(form.id + "-" + nombre + "-error");
    const radios = grupoRadios(form, nombre);
    const contenedor = radios.length ? radios[0].closest('[role="radiogroup"]') : null;
    if (nodo) {
      nodo.textContent = "";
      nodo.hidden = true;
    }
    if (contenedor) {
      contenedor.removeAttribute("aria-invalid");
      if (nodo) enlazarDescripcion(contenedor, nodo.id, false);
    }
  }

  function limpiarNumero(texto, tipo) {
    const aviso = {};
    let limpio = "";
    let punto = false;
    let decimales = 0;
    for (const caracter of texto) {
      if (caracter >= "0" && caracter <= "9") {
        if (punto) {
          if (decimales >= 2) {
            aviso.decimales = true;
            continue;
          }
          decimales += 1;
        }
        limpio += caracter;
      } else if (caracter === "." && tipo !== "entero" && !punto) {
        punto = true;
        limpio += caracter;
      } else if (caracter === "-") {
        aviso.negativo = true;
      } else if (caracter === ",") {
        aviso.coma = true;
      } else if (caracter === ".") {
        aviso.punto = true;
      } else if (/\s/.test(caracter)) {
        aviso.espacio = true;
      } else {
        aviso.letras = true;
      }
    }
    return { limpio, aviso };
  }

  function mensajeLimpieza(aviso, tipo) {
    if (aviso.negativo) return "No se admiten valores negativos.";
    if (aviso.letras) return "Solo se admiten números en este campo.";
    if (aviso.coma) return tipo === "entero" ? "Escriba solo números enteros, sin comas." : "Use punto (.) para los decimales, sin comas.";
    if (aviso.punto) return tipo === "entero" ? "Este campo solo admite números enteros." : "El número solo puede llevar un punto decimal.";
    if (aviso.decimales) return "Se admiten hasta 2 decimales.";
    return "";
  }

  function sanearEntrada(input) {
    const tipo = input.dataset.tipo;
    if (tipo !== "dinero" && tipo !== "decimal" && tipo !== "entero") return;
    const original = input.value;
    const { limpio, aviso } = limpiarNumero(original, tipo);
    if (limpio !== original) {
      let cursor = limpio.length;
      if (typeof input.selectionStart === "number") {
        cursor = Math.min(limpio.length, limpiarNumero(original.slice(0, input.selectionStart), tipo).limpio.length);
      }
      input.value = limpio;
      try {
        input.setSelectionRange(cursor, cursor);
      } catch (e) {
        cursor = 0;
      }
      const mensaje = mensajeLimpieza(aviso, tipo);
      if (mensaje) {
        mostrarAviso(input, mensaje);
        return;
      }
    }
    if (input.getAttribute("aria-invalid") === "true") limpiarError(input);
  }

  function mostrarAviso(input, mensaje) {
    const nodo = nodoError(input);
    if (!nodo) return;
    input.removeAttribute("aria-invalid");
    input.dataset.aviso = "1";
    nodo.textContent = mensaje;
    nodo.hidden = false;
    enlazarDescripcion(input, nodo.id, true);
  }

  function estaActivo(elemento) {
    return !elemento.disabled && !elemento.closest("[hidden]");
  }

  function validarCampo(input) {
    const tipo = input.dataset.tipo;
    const texto = input.value.trim();
    const mensaje = input.dataset.msg || "Revise este campo.";
    if (tipo === "fecha" && input.validity && input.validity.badInput) {
      return { ok: false, mensaje: "Ingrese una fecha válida." };
    }
    if (!texto) {
      if (input.required) return { ok: false, mensaje: input.dataset.msgVacio || mensaje };
      return { ok: true, valor: null };
    }
    if (tipo === "fecha") {
      const fecha = C.parsearFecha(texto);
      return fecha ? { ok: true, valor: fecha } : { ok: false, mensaje: "Ingrese una fecha válida." };
    }
    const patron = tipo === "entero" ? /^\d+$/ : /^(\d+(\.\d{0,2})?|\.\d{1,2})$/;
    if (!patron.test(texto)) return { ok: false, mensaje };
    const valor = Number(texto);
    if (!Number.isFinite(valor)) return { ok: false, mensaje };
    const minimo = input.dataset.min !== undefined ? Number(input.dataset.min) : -Infinity;
    const maximo = input.dataset.max !== undefined ? Number(input.dataset.max) : Infinity;
    if (valor < minimo || valor > maximo) return { ok: false, mensaje };
    return { ok: true, valor };
  }

  function validarFormulario(form) {
    const valores = {};
    const errores = [];
    $$("[data-tipo]", form).forEach(input => {
      if (!estaActivo(input)) {
        limpiarError(input);
        return;
      }
      const resultado = validarCampo(input);
      if (resultado.ok) {
        limpiarError(input);
        valores[input.name] = resultado.valor;
      } else {
        mostrarError(input, resultado.mensaje);
        errores.push(input);
      }
    });
    return { valores, errores };
  }

  function enfocarError(elemento) {
    if (!elemento) return;
    const detalles = elemento.closest("details");
    if (detalles) detalles.open = true;
    desplazarA(elemento.closest(".campo") || elemento, "center");
    enfocar(elemento);
  }

  function valorControl(form, nombre) {
    const control = form.elements[nombre];
    if (!control) return "";
    if (!control.tagName) return control.value || "";
    if (control.type === "checkbox") return control.checked ? "on" : "off";
    if (control.type === "radio") return control.checked ? control.value : "";
    return control.value;
  }

  function sincronizar(form) {
    $$("[data-mostrar-si]", form).forEach(elemento => {
      const [nombre, esperado] = elemento.dataset.mostrarSi.split("=");
      const visible = valorControl(form, nombre) === esperado;
      if (elemento.hidden !== !visible) elemento.hidden = !visible;
      if (!visible) {
        $$("[aria-invalid]", elemento).forEach(x => x.removeAttribute("aria-invalid"));
        $$(".error", elemento).forEach(x => {
          x.hidden = true;
          x.textContent = "";
        });
      }
    });
    const sinVacaciones = form.elements.sinVacaciones;
    const fechaVacaciones = $("#liq-vacaciones", form);
    if (sinVacaciones && fechaVacaciones) {
      fechaVacaciones.disabled = sinVacaciones.checked;
      if (sinVacaciones.checked) limpiarError(fechaVacaciones);
    }
  }

  function actualizarAntiguedad() {
    const salida = $("#liq-antiguedad");
    if (!salida) return;
    const inicio = C.parsearFecha($("#liq-inicio").value);
    const fin = C.parsearFecha($("#liq-fin").value);
    if (!inicio || !fin || C.compararFechas(fin, inicio) < 0) {
      salida.hidden = true;
      salida.textContent = "";
      return;
    }
    const antiguedad = C.diferenciaComercial(inicio, fin);
    const reforma = $("#form-liquidacion").elements.aplicarReforma;
    const aguinaldo = C.analizarAguinaldo(inicio, fin, reforma ? reforma.checked : true);
    salida.textContent = "Antigüedad: " + C.textoAntiguedad(antiguedad) + ". Aguinaldo: " +
      (aguinaldo.completo ? "completo por la reforma de 2026." : C.cantidad(aguinaldo.dias, "día laborado", "días laborados") + " desde el " + C.formatearFecha(aguinaldo.referencia) + ".");
    salida.hidden = false;
  }

  function cabeceraHoja(titulo, meta) {
    return '<header class="hoja__cabecera"><div><h2 tabindex="-1">' + esc(titulo) + "</h2>" +
      (meta ? '<p class="hoja__meta">' + esc(meta) + "</p>" : "") +
      '</div><p class="hoja__fecha">Calculado el ' + esc(fechaHoy()) + "</p></header>";
  }

  function estadoHtml(correcto, titulo, texto) {
    return '<div class="estado ' + (correcto ? "estado--ok" : "estado--no") + '" role="status"><div><strong>' + esc(titulo) + "</strong>" + esc(texto) + "</div></div>";
  }

  function requisitosHtml(requisitos) {
    if (!requisitos || !requisitos.length) return "";
    return '<ul class="requisitos">' + requisitos.map(r =>
      '<li class="' + (r.cumple ? "cumple" : "no-cumple") + '"><span><span class="visualmente-oculto">' + (r.cumple ? "Cumple: " : "No cumple: ") + "</span>" + esc(r.texto) + "</span></li>"
    ).join("") + "</ul>";
  }

  function lineasHtml(lineas) {
    if (!lineas || !lineas.length) return "";
    return '<ul class="lineas">' + lineas.map(l =>
      '<li class="linea' + (l.resta ? " linea--resta" : "") + '"><span class="linea__nombre">' + esc(l.nombre) +
      (l.detalle ? "<small>" + esc(l.detalle) + "</small>" : "") +
      '</span><span class="linea__guia" aria-hidden="true"></span><span class="linea__valor">' + esc(l.valor) + "</span></li>"
    ).join("") + "</ul>";
  }

  function totalHtml(nombre, valor, secundario) {
    return '<div class="total' + (secundario ? " total--secundario" : "") + '"><span class="total__nombre">' + esc(nombre) +
      '</span><span class="total__valor">' + esc(C.usd(valor)) + "</span></div>";
  }

  function notasHtml(notas, clase) {
    if (!notas || !notas.length) return "";
    return '<div class="notas">' + notas.map(n => '<p class="nota' + (clase ? " " + clase : "") + '">' + esc(n) + "</p>").join("") + "</div>";
  }

  function pasosHtml(pasos) {
    if (!pasos || !pasos.length) return "";
    return '<ol class="pasos">' + pasos.map(p =>
      '<li class="paso"><p class="paso__titulo">' + esc(p.titulo) + '</p><dl class="paso__datos">' +
      '<dt>Fórmula</dt><dd class="paso__formula">' + esc(p.formula) + "</dd>" +
      (p.datos ? "<dt>Datos utilizados</dt><dd>" + esc(p.datos) + "</dd>" : "") +
      "<dt>Operación</dt><dd>" + esc(p.operacion) + "</dd>" +
      '<dt>Resultado</dt><dd class="paso__resultado">' + esc(p.resultado) + "</dd></dl></li>"
    ).join("") + "</ol>";
  }

  function conceptoHtml(titulo, monto, pasos, notas, texto) {
    return '<div class="desglose__concepto"><h4 class="desglose__titulo">' + esc(titulo) +
      (monto !== null && monto !== undefined ? " <span>" + esc(monto) + "</span>" : "") + "</h4>" +
      (texto ? '<p class="desglose__texto">' + esc(texto) + "</p>" : "") +
      pasosHtml(pasos) + notasHtml(notas) + "</div>";
  }

  function accionesHtml(idDesglose, abierto, formulas) {
    return '<div class="hoja__acciones no-imprimir">' +
      '<button type="button" class="boton boton--secundario" data-desglose aria-controls="' + idDesglose + '" aria-expanded="' + (abierto ? "true" : "false") + '">' +
      (abierto ? "Ocultar cómo se calculó" : "Ver cómo se calculó") + "</button>" +
      '<button type="button" class="boton boton--texto" data-abrir-formulas="' + esc(formulas) + '">Ver fórmulas</button>' +
      '<button type="button" class="boton boton--texto" data-imprimir>Imprimir resultados</button>' +
      "</div>";
  }

  function hojaModulo(o) {
    const idDesglose = "desglose-" + o.id;
    return '<article class="hoja">' +
      cabeceraHoja(o.titulo, o.meta) +
      (o.estado || "") +
      requisitosHtml(o.requisitos) +
      lineasHtml(o.lineas) +
      totalHtml(o.totalNombre, o.total) +
      (o.extra || "") +
      accionesHtml(idDesglose, true, o.formulas) +
      '<section class="desglose" id="' + idDesglose + '" aria-label="Cómo se calculó"><h3>Cómo se calculó</h3>' +
      (o.pasos && o.pasos.length ? pasosHtml(o.pasos) : '<p class="desglose__texto">' + esc(o.sinPasos || "No hay operaciones que mostrar.") + "</p>") +
      "</section>" +
      notasHtml(o.notas) +
      "</article>";
  }

  function pintar(idContenedor, html) {
    const contenedor = document.getElementById(idContenedor);
    contenedor.innerHTML = html;
    const titulo = $("h2", contenedor);
    const caja = contenedor.getBoundingClientRect ? contenedor.getBoundingClientRect() : null;
    const alto = window.innerHeight || 800;
    if (caja && (caja.top < 0 || caja.top > alto * 0.5)) desplazarA(contenedor, "start");
    enfocar(titulo);
  }

  function pasoSimple(titulo, formula, datos, operacion, resultado) {
    return { titulo, formula, datos, operacion, resultado };
  }

  function calcularAsuetoModulo(form) {
    const { valores, errores } = validarFormulario(form);
    if (errores.length) return enfocarError(errores[0]);
    const r = C.calcularAsueto({ salario: valores.salario, dias: valores.dias });
    const notas = r.notas.slice();
    const campo = $("#asu-dias");
    if (campo.dataset.seleccion && Number(campo.dataset.total) === valores.dias) {
      notas.unshift("Asuetos seleccionados: " + campo.dataset.seleccion + ".");
    }
    pintar("res-asueto", hojaModulo({
      id: "asueto",
      titulo: "Días de asueto laborados",
      meta: "Salario mensual " + C.usd(valores.salario) + " · " + C.cantidad(valores.dias, "día de asueto", "días de asueto"),
      lineas: [
        { nombre: "Salario básico diario", detalle: "SBD = SBM ÷ 30", valor: C.usdPreciso(r.sbd) },
        { nombre: "Salario por un día de asueto", detalle: "SE = SBD × 2 (recargo del 100 %)", valor: C.usdPreciso(r.se) },
        { nombre: "Días de asueto laborados", valor: C.numero(r.dias) }
      ],
      totalNombre: "Total por días de asueto",
      total: r.valor,
      pasos: r.pasos,
      notas,
      formulas: "sbd,se"
    }));
  }

  function calcularDescansoModulo(form) {
    const { valores, errores } = validarFormulario(form);
    if (errores.length) return enfocarError(errores[0]);
    const r = C.calcularDescanso({ salario: valores.salario, dias: valores.dias });
    pintar("res-descanso", hojaModulo({
      id: "descanso",
      titulo: "Días de descanso semanal laborados",
      meta: "Salario mensual " + C.usd(valores.salario) + " · " + C.cantidad(valores.dias, "día de descanso", "días de descanso"),
      lineas: [
        { nombre: "Salario básico diario", detalle: "SBD = SBM ÷ 30", valor: C.usdPreciso(r.sbd) },
        { nombre: "Salario por un día de descanso", detalle: "SDD = SBD × 1.5 (recargo mínimo del 50 %)", valor: C.usdPreciso(r.sdd) },
        { nombre: "Días de descanso laborados", valor: C.numero(r.dias) }
      ],
      totalNombre: "Total por días de descanso semanal",
      total: r.valor,
      pasos: r.pasos,
      notas: r.notas,
      formulas: "sbd,sdd"
    }));
  }

  function calcularHorasModulo(form) {
    const { valores, errores } = validarFormulario(form);
    const diurnas = valores.diurnas || 0;
    const nocturnas = valores.nocturnas || 0;
    const campoDiurnas = $("#hx-diurnas");
    if (!errores.length && diurnas === 0 && nocturnas === 0) {
      mostrarError(campoDiurnas, "Ingrese al menos una hora extra diurna o nocturna.");
      errores.push(campoDiurnas);
    }
    if (errores.length) return enfocarError(errores[0]);
    const r = C.calcularHorasExtras({ salario: valores.salario, horasJornada: valores.horasJornada, diurnas, nocturnas });
    const pasos = [r.diurna.pasos[0], r.diurna.pasos[1]];
    if (diurnas > 0) pasos.push(r.diurna.pasos[2]);
    if (nocturnas > 0) pasos.push(r.nocturna.pasos[2], r.nocturna.pasos[3]);
    if (diurnas > 0 && nocturnas > 0) {
      pasos.push(pasoSimple(
        "Total de horas extras",
        "Total = HE diurnas + HE nocturnas",
        "",
        C.usd(r.diurna.valor) + " + " + C.usd(r.nocturna.valor),
        C.usd(r.valor)
      ));
    }
    const lineas = [
      { nombre: "Salario básico diario", detalle: "SBD = SBM ÷ 30", valor: C.usdPreciso(r.sbd) },
      { nombre: "Hora ordinaria diurna", detalle: "H = SBD ÷ " + C.cantidad(valores.horasJornada, "hora", "horas"), valor: C.usdPreciso(r.h) }
    ];
    if (nocturnas > 0) lineas.push({ nombre: "Hora nocturna", detalle: "HN = HD × 1.25 (recargo nocturno del 25 %)", valor: C.usdPreciso(r.hn) });
    lineas.push({
      nombre: "Horas extras diurnas",
      detalle: diurnas > 0 ? C.cantidad(diurnas, "hora", "horas") + " × " + C.usdPreciso(r.h) + " × 2" : "Sin horas diurnas",
      valor: C.usd(r.diurna.valor)
    });
    lineas.push({
      nombre: "Horas extras nocturnas",
      detalle: nocturnas > 0 ? C.cantidad(nocturnas, "hora", "horas") + " × " + C.usdPreciso(r.hn) + " × 2" : "Sin horas nocturnas",
      valor: C.usd(r.nocturna.valor)
    });
    pintar("res-horas", hojaModulo({
      id: "horas",
      titulo: "Horas extras",
      meta: "Salario mensual " + C.usd(valores.salario) + " · jornada de " + C.cantidad(valores.horasJornada, "hora", "horas"),
      lineas,
      totalNombre: "Total por horas extras",
      total: r.valor,
      pasos,
      notas: nocturnas > 0 ? r.notas : [r.notas[0]],
      formulas: "sbd,h,he,hn,hen"
    }));
  }

  function calcularRenunciaModulo(form) {
    const { valores, errores } = validarFormulario(form);
    const preaviso = valorControl(form, "preaviso");
    if (!preaviso) errores.push(errorGrupo(form, "preaviso", "Indique si informó la renuncia al patrono por escrito."));
    if (errores.length) return enfocarError(errores[0]);
    const meses = valores.meses || 0;
    const r = C.calcularRenuncia({
      salario: valores.salario,
      anios: valores.anios,
      meses,
      preaviso: preaviso === "si",
      salarioMinimo: valores.salarioMinimo
    });
    const lineas = r.cumple ? [
      { nombre: "Salario considerado", detalle: r.topeAplicado ? "Se aplica el tope de 2 salarios mínimos" : "No supera 2 salarios mínimos (" + C.usd(valores.salarioMinimo * 2) + ")", valor: C.usd(r.base) },
      { nombre: "Salario básico diario", detalle: "SBD = salario considerado ÷ 30", valor: C.usdPreciso(r.base / C.CONFIG.diasMesComercial) },
      { nombre: "Años de servicio", detalle: "Prestación = SBD × 15 × años", valor: C.numero(valores.anios) }
    ] : [];
    pintar("res-renuncia", hojaModulo({
      id: "renuncia",
      titulo: "Prestación por renuncia voluntaria",
      meta: "Salario mensual " + C.usd(valores.salario) + " · " + C.cantidad(valores.anios, "año", "años") + (meses ? " y " + C.cantidad(meses, "mes", "meses") : "") + " de servicio",
      estado: estadoHtml(r.cumple, r.cumple ? "Cumple los requisitos" : "No cumple los requisitos", r.cumple ? r.mensaje.replace("Cumple los requisitos para recibir", "Tiene derecho a") : r.mensaje),
      requisitos: r.requisitos,
      lineas,
      totalNombre: "Prestación por renuncia",
      total: r.valor,
      pasos: r.pasos,
      sinPasos: r.mensaje + " El monto es $0.00.",
      notas: r.notas,
      formulas: "sbd,renuncia"
    }));
  }

  function calcularDespidoModulo(form) {
    const { valores, errores } = validarFormulario(form);
    const dias = valores.dias || 0;
    if (!errores.length && valores.anios === 0 && valores.meses === 0 && dias === 0) {
      const campo = $("#des-anios");
      mostrarError(campo, "La antigüedad debe ser mayor que cero.");
      errores.push(campo);
    }
    if (errores.length) return enfocarError(errores[0]);
    const r = C.calcularDespido({
      salario: valores.salario,
      anios: valores.anios,
      meses: valores.meses,
      dias,
      salarioMinimo: valores.salarioMinimo
    });
    const lineas = [
      { nombre: "Salario considerado", detalle: r.topeAplicado ? "Se aplica el tope de 4 salarios mínimos" : "No supera 4 salarios mínimos (" + C.usd(valores.salarioMinimo * 4) + ")", valor: C.usd(r.base) },
      { nombre: "Por años completos", detalle: C.cantidad(valores.anios, "año", "años") + " × " + C.usd(r.base), valor: C.usd(r.base * valores.anios) },
      { nombre: "Proporcional de la fracción", detalle: C.cantidad(r.diasFraccion, "día", "días") + " × (" + C.usd(r.base) + " ÷ 360)", valor: C.usd(r.base / C.CONFIG.diasAnioComercial * r.diasFraccion) }
    ];
    if (r.minimoAplicado) lineas.push({ nombre: "Mínimo legal aplicado", detalle: "15 días de salario básico", valor: C.usd(r.valor) });
    let extra = "";
    let pasos = r.pasos.slice();
    const notas = r.notas.slice();
    if (form.elements.descuentos && form.elements.descuentos.checked) {
      const d = C.calcularDescuentos({ base: r.valor, nombreBase: "Indemnización" });
      const liquido = C.redondear(r.valor - d.total);
      extra = lineasHtml([
        { nombre: "(−) AFP " + C.porcentaje(d.tasaAFP), detalle: "Sobre la indemnización", valor: "−" + C.usd(d.afp), resta: true },
        { nombre: "(−) ISSS " + C.porcentaje(d.tasaISSS), detalle: "Sobre la indemnización", valor: "−" + C.usd(d.isss), resta: true }
      ]) + totalHtml("Indemnización líquida", liquido, true);
      pasos = pasos.concat(d.pasos, [pasoSimple("Indemnización líquida", "Líquido = indemnización − descuentos", "", C.usd(r.valor) + " − " + C.usd(d.total), C.usd(liquido))]);
      notas.push("Los descuentos de AFP e ISSS son una indicación de clase; sus porcentajes no aparecen en el material. Confirme con el docente la base sobre la que se aplican.");
    }
    pintar("res-despido", hojaModulo({
      id: "despido",
      titulo: "Indemnización por despido injustificado",
      meta: "Salario mensual " + C.usd(valores.salario) + " · " + C.textoAntiguedad({ anios: valores.anios, meses: valores.meses, dias }) + " de servicio",
      lineas,
      totalNombre: "Total de indemnización",
      total: r.valor,
      extra,
      pasos,
      notas,
      formulas: "sbd,despido,descuentos"
    }));
  }

  function calcularLiquidacionModulo(form) {
    const { valores, errores } = validarFormulario(form);
    const modo = valorControl(form, "modo") || "fechas";
    const causa = valorControl(form, "causa");
    const preaviso = valorControl(form, "preaviso");
    const falla = (id, mensaje) => {
      const campo = document.getElementById(id);
      mostrarError(campo, mensaje);
      errores.push(campo);
    };

    if (modo === "fechas" && valores.fechaInicio && valores.fechaFin) {
      if (C.compararFechas(valores.fechaFin, valores.fechaInicio) < 0) {
        falla("liq-fin", "El último día laborado no puede ser anterior a la fecha de inicio.");
      } else {
        const sinVacaciones = form.elements.sinVacaciones.checked;
        const vacacion = valores.ultimaVacacion;
        if (vacacion && (C.compararFechas(vacacion, valores.fechaInicio) < 0 || C.compararFechas(vacacion, valores.fechaFin) > 0)) {
          falla("liq-vacaciones", "La fecha de las últimas vacaciones debe estar entre el inicio y el último día laborado.");
        } else if (!vacacion && !sinVacaciones && C.diferenciaComercial(valores.fechaInicio, valores.fechaFin).anios >= 1) {
          falla("liq-vacaciones", "Indique cuándo iniciaron sus últimas vacaciones o marque que no las ha gozado.");
        }
      }
    }
    if (modo === "manual" && typeof valores.anios === "number" && typeof valores.meses === "number") {
      const totalDias = valores.anios * C.CONFIG.diasAnioComercial + valores.meses * C.CONFIG.diasMesComercial + (valores.dias || 0);
      if (totalDias === 0) {
        falla("liq-anios", "La antigüedad debe ser mayor que cero.");
      } else if (typeof valores.diasAguinaldo === "number" && valores.diasAguinaldo > totalDias) {
        falla("liq-dias-aguinaldo", "Los días para el aguinaldo no pueden superar el tiempo de servicio (" + C.cantidad(totalDias, "día", "días") + ").");
      }
    }
    if (!causa) {
      errores.push(errorGrupo(form, "causa", "Seleccione la causa de finalización de la relación laboral."));
    } else if (causa === "renuncia" && !preaviso) {
      errores.push(errorGrupo(form, "preaviso", "Indique si informó la renuncia al patrono por escrito."));
    }
    if (errores.length) {
      const ordenados = errores.filter(Boolean).sort((a, b) => (a.compareDocumentPosition(b) & 2) ? 1 : -1);
      return enfocarError(ordenados[0]);
    }

    const aplica = nombre => valorControl(form, nombre) === "si";
    const conDescuentos = form.elements.descuentos.checked;
    const datos = {
      salario: valores.salario,
      salarioMinimo: valores.salarioMinimo,
      modoAntiguedad: modo,
      fechaInicio: valores.fechaInicio,
      fechaFin: valores.fechaFin,
      ultimaVacacion: valores.ultimaVacacion || null,
      sinVacaciones: form.elements.sinVacaciones.checked,
      anios: valores.anios,
      meses: valores.meses,
      dias: valores.dias || 0,
      vacacionPendiente: form.elements.vacacionPendiente.value === "si",
      diasAguinaldo: valores.diasAguinaldo,
      aguinaldoCompleto: form.elements.aguinaldoCompleto.checked && form.elements.aplicarReforma.checked,
      causa,
      preaviso: preaviso === "si",
      horasJornada: valores.horasJornada,
      horasDiurnas: aplica("aplicaHed") ? valores.horasDiurnas : null,
      horasNocturnas: aplica("aplicaHen") ? valores.horasNocturnas : null,
      diasAsueto: aplica("aplicaAsueto") ? valores.diasAsueto : null,
      diasDescanso: aplica("aplicaDescanso") ? valores.diasDescanso : null,
      aplicarReforma: form.elements.aplicarReforma.checked,
      modoRedondeo: valorControl(form, "modoRedondeo"),
      descuentos: {
        aplicar: conDescuentos,
        base: form.elements.baseDescuento.value,
        tasaAFP: conDescuentos ? valores.tasaAFP / 100 : C.CONFIG.tasaAFP,
        tasaISSS: conDescuentos ? valores.tasaISSS / 100 : C.CONFIG.tasaISSS
      }
    };
    const r = C.calcularLiquidacion(datos);
    pintar("res-liquidacion", hojaLiquidacion(r, datos));
  }

  function hojaLiquidacion(r, d) {
    const titulo = d.causa === "renuncia" ? "Liquidación por renuncia voluntaria" : "Liquidación por despido injustificado";
    const periodo = d.modoAntiguedad === "fechas"
      ? " · del " + C.formatearFecha(d.fechaInicio) + " al " + C.formatearFecha(d.fechaFin)
      : " · antigüedad ingresada manualmente";
    const meta = "Salario mensual " + C.usd(d.salario) + " · " + r.antiguedadTexto + periodo;
    const terminacion = r.conceptos.find(c => c.clave === "terminacion");

    let estado = "";
    if (d.causa === "renuncia") {
      const cumple = terminacion.requisitos && terminacion.requisitos.every(x => x.cumple);
      estado = estadoHtml(cumple, cumple ? "Cumple los requisitos de la renuncia voluntaria" : "No corresponde prestación por renuncia", cumple ? " La vacación y el aguinaldo también se pagan." : " " + terminacion.mensaje.replace("No corresponde prestación por renuncia: ", "Motivo: ") + " La vacación y el aguinaldo sí se pagan.") +
        requisitosHtml(terminacion.requisitos);
    }

    const tarjetas = '<ul class="tarjetas">' + r.conceptos.map(c =>
      '<li class="tarjeta' + (c.clave === "terminacion" ? " tarjeta--destacada" : "") + (c.aplica ? "" : " tarjeta--inactiva") + '">' +
      '<span class="tarjeta__nombre">' + esc(c.nombre) + "</span>" +
      '<span class="tarjeta__monto">' + (c.aplica ? esc(C.usd(c.valor)) : "No aplica") + "</span>" +
      '<span class="tarjeta__detalle">' + esc(c.aplica ? c.detalle : "Suma $0.00 al total") + "</span></li>"
    ).join("") + "</ul>";

    let descuentos = "";
    let desgloseDescuentos = "";
    if (r.descuentos) {
      const x = r.descuentos;
      descuentos = lineasHtml([
        { nombre: "(−) AFP " + C.porcentaje(x.tasaAFP), detalle: "Sobre: " + x.nombreBase + " (" + C.usd(x.base) + ")", valor: "−" + C.usd(x.afp), resta: true },
        { nombre: "(−) ISSS " + C.porcentaje(x.tasaISSS), detalle: "Sobre: " + x.nombreBase + " (" + C.usd(x.base) + ")", valor: "−" + C.usd(x.isss), resta: true }
      ]) + totalHtml("Líquido a recibir", r.liquido, true);
      desgloseDescuentos = conceptoHtml("Descuentos AFP e ISSS (indicación de clase)", "−" + C.usd(x.total), x.pasos.concat([
        pasoSimple("Líquido a recibir", "Líquido = total de la liquidación − descuentos", "", C.usd(r.total) + " − " + C.usd(x.total), C.usd(r.liquido))
      ]), ["Las tasas de AFP (7.25 %) e ISSS (3 %) no aparecen en el material; provienen de la indicación de clase de restarlas a la indemnización. Son editables en «Opciones de cálculo»."]);
    }

    const aplicables = r.conceptos.filter(c => c.aplica);
    const noAplican = r.conceptos.filter(c => !c.aplica);
    const desglose =
      '<section class="desglose" id="desglose-liquidacion" aria-label="Cómo se calculó" hidden><h3>Cómo se calculó</h3>' +
      (r.pasosAntiguedad.length ? conceptoHtml("Tiempo de servicio y períodos", r.antiguedadTexto, r.pasosAntiguedad) : "") +
      aplicables.map(c => conceptoHtml(c.nombre, C.usd(c.valor), c.pasos, c.notas, c.pasos.length ? "" : c.mensaje)).join("") +
      (noAplican.length ? conceptoHtml("Conceptos marcados como «No aplica»", "$0.00", [], [], noAplican.map(c => c.nombre).join(", ") + ". No se calculan y suman $0.00 al total.") : "") +
      conceptoHtml("Total de la liquidación", C.usd(r.total), [r.pasoTotal]) +
      desgloseDescuentos +
      "</section>";

    return '<article class="hoja">' +
      cabeceraHoja(titulo, meta) +
      estado +
      tarjetas +
      totalHtml("Total de liquidación", r.total) +
      descuentos +
      notasHtml(r.avisos, "nota--info") +
      accionesHtml("desglose-liquidacion", false, "sbd,rv,vp,pa,ap,despido,renuncia,he,hen,se,sdd,total,descuentos") +
      desglose +
      "</article>";
  }

  function formulaHtml(f, conId) {
    return '<article class="formula"' + (conId ? ' id="formula-' + esc(f.id) + '"' : "") + ">" +
      "<h3>" + esc(f.nombre) + "</h3>" +
      '<p class="formula__expresion">' + esc(f.expresion) + "</p>" +
      '<p class="formula__explicacion">' + esc(f.explicacion) + "</p>" +
      '<dl class="formula__variables">' + f.variables.map(v => "<dt>" + esc(v[0]) + "</dt><dd>" + esc(v[1]) + "</dd>").join("") + "</dl>" +
      '<p class="formula__fuente"><span class="origen origen--' + esc(f.origen) + '">' + esc(T.ORIGENES[f.origen] || f.origen) + "</span>" + esc(f.fuente) + "</p>" +
      "</article>";
  }

  function formulaPorId(id) {
    return T.FORMULAS.find(f => f.id === id);
  }

  function pintarCatalogos() {
    const catalogo = $("#catalogo-formulas");
    if (catalogo) {
      catalogo.innerHTML = T.GRUPOS_FORMULAS.map(g =>
        '<section class="catalogo"><h2>' + esc(g.titulo) + '</h2><div class="formulas">' +
        g.ids.map(formulaPorId).filter(Boolean).map(f => formulaHtml(f, true)).join("") +
        "</div></section>"
      ).join("");
    }
    const criterios = $("#lista-criterios");
    if (criterios) criterios.innerHTML = T.CRITERIOS.map(c => "<li>" + esc(c) + "</li>").join("");
    const legal = $("#catalogo-legal");
    if (legal) {
      legal.innerHTML = T.BASE_LEGAL.map(n =>
        '<section class="norma"><header class="norma__cabecera"><h2>' + esc(n.norma) + "</h2><p>" + esc(n.referencia) + "</p></header>" +
        n.articulos.map(a =>
          '<article class="articulo"><p class="articulo__numero">' + esc(a.art) + "</p><div>" +
          '<h3 class="articulo__tema">' + esc(a.tema) + "</h3>" +
          '<p class="articulo__texto">' + esc(a.regula) + "</p>" +
          (a.nota ? '<p class="articulo__nota">' + esc(a.nota) + "</p>" : "") +
          '<p class="articulo__origen"><span class="origen origen--' + esc(a.origen) + '">' + esc(T.ORIGENES[a.origen] || a.origen) + "</span></p>" +
          "</div></article>"
        ).join("") +
        "</section>"
      ).join("");
    }
    const fuentes = $("#lista-fuentes");
    if (fuentes) fuentes.innerHTML = T.FUENTES.map(f => "<li>" + esc(f) + "</li>").join("");
  }

  function abrirDialogo(dialogo, origen) {
    origenesDialogo.set(dialogo, origen || document.activeElement);
    if (typeof dialogo.showModal === "function") {
      if (!dialogo.open) dialogo.showModal();
    } else {
      dialogo.setAttribute("open", "");
    }
  }

  function cerrarDialogo(dialogo) {
    if (typeof dialogo.close === "function" && dialogo.open) {
      dialogo.close();
    } else if (dialogo.hasAttribute("open")) {
      dialogo.removeAttribute("open");
      devolverFocoDialogo(dialogo);
    }
  }

  function devolverFocoDialogo(dialogo) {
    const origen = origenesDialogo.get(dialogo);
    origenesDialogo.delete(dialogo);
    if (origen && origen.isConnected && typeof origen.focus === "function" && !origen.closest("[hidden]") && !origen.disabled) {
      enfocar(origen);
    }
  }

  function abrirFormulas(boton) {
    const ids = (boton.dataset.abrirFormulas || "").split(",").map(x => x.trim()).filter(Boolean);
    const lista = ids.map(formulaPorId).filter(Boolean);
    $("#dlg-formulas-cuerpo").innerHTML = '<div class="formulas">' + lista.map(f => formulaHtml(f, false)).join("") + "</div>";
    abrirDialogo($("#dlg-formulas"), boton);
    const cuerpo = $("#dlg-formulas-cuerpo");
    cuerpo.scrollTop = 0;
  }

  let objetivoAsuetos = null;

  function pintarAsuetos() {
    const lista = $("#lista-asuetos");
    lista.innerHTML = T.ASUETOS.map(a =>
      "<li>" +
      '<label class="asueto"><input type="checkbox" data-asueto="' + esc(a.id) + '">' +
      '<span><span class="asueto__fecha">' + esc(a.fecha) + '</span><span class="asueto__motivo">' + esc(a.motivo) + "</span></span></label>" +
      '<label class="asueto__veces">Veces <input type="text" inputmode="numeric" autocomplete="off" maxlength="2" value="1" disabled data-veces="' + esc(a.id) + '" aria-label="Veces que trabajó ' + esc(a.fecha) + '"></label>' +
      "</li>"
    ).join("");
  }

  function contarAsuetos() {
    let total = 0;
    let invalido = false;
    const elegidos = [];
    $$("[data-asueto]").forEach(casilla => {
      if (!casilla.checked) return;
      const veces = $('[data-veces="' + casilla.dataset.asueto + '"]');
      const n = /^\d+$/.test(veces.value) ? Number(veces.value) : 0;
      if (n < 1 || n > 50) invalido = true;
      total += n;
      const asueto = T.ASUETOS.find(a => a.id === casilla.dataset.asueto);
      elegidos.push(asueto.fecha + (n > 1 ? " (" + n + " veces)" : ""));
    });
    $("#asuetos-cuenta").textContent = total === 1 ? "1 día seleccionado" : total + " días seleccionados";
    return { total, invalido, elegidos };
  }

  function abrirAsuetos(boton) {
    objetivoAsuetos = document.getElementById(boton.dataset.abrirAsuetos);
    $$("[data-asueto]").forEach(c => {
      c.checked = false;
    });
    $$("[data-veces]").forEach(v => {
      v.value = "1";
      v.disabled = true;
      v.removeAttribute("aria-invalid");
    });
    const error = $("#asuetos-error");
    error.hidden = true;
    error.textContent = "";
    contarAsuetos();
    abrirDialogo($("#dlg-asuetos"), boton);
  }

  function aplicarAsuetos() {
    const { total, invalido, elegidos } = contarAsuetos();
    const error = $("#asuetos-error");
    let mensaje = "";
    if (!elegidos.length) mensaje = "Seleccione al menos un asueto trabajado.";
    else if (invalido) mensaje = "Indique cuántas veces trabajó cada asueto marcado (de 1 a 50).";
    if (mensaje) {
      error.textContent = mensaje;
      error.hidden = false;
      return;
    }
    const objetivo = objetivoAsuetos;
    if (objetivo) {
      const form = objetivo.form;
      if (form && form.id === "form-liquidacion") {
        const si = $("#liq-asu-si");
        si.checked = true;
        limpiarGrupo(form, "aplicaAsueto");
        sincronizar(form);
      }
      objetivo.value = String(total);
      objetivo.dataset.seleccion = elegidos.join(", ");
      objetivo.dataset.total = String(total);
      limpiarError(objetivo);
    }
    const dialogo = $("#dlg-asuetos");
    origenesDialogo.set(dialogo, objetivo);
    cerrarDialogo(dialogo);
  }

  let objetivoHoras = null;

  const ICONO_QUITAR = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function nuevaFilaHoras() {
    const fila = document.createElement("div");
    fila.className = "registro__fila";
    fila.innerHTML =
      '<label>Fecha<input type="date" data-campo="fecha"></label>' +
      '<label>Hora de inicio<input type="time" data-campo="desde"></label>' +
      '<label>Hora final<input type="time" data-campo="hasta"></label>' +
      '<p class="registro__resultado">Indique el horario trabajado.</p>' +
      '<button type="button" class="registro__quitar" data-quitar-fila aria-label="Quitar este día">' + ICONO_QUITAR + "</button>";
    return fila;
  }

  function leerFila(fila) {
    const fecha = $('[data-campo="fecha"]', fila);
    const desde = $('[data-campo="desde"]', fila);
    const hasta = $('[data-campo="hasta"]', fila);
    const horas = C.clasificarHoras(desde.value, hasta.value);
    return { fecha, desde, hasta, horas, fechaValida: !!C.parsearFecha(fecha.value) };
  }

  function actualizarFila(fila) {
    const datos = leerFila(fila);
    const salida = $(".registro__resultado", fila);
    if (!datos.horas) {
      salida.textContent = datos.desde.value && datos.hasta.value ? "La hora final debe ser distinta de la inicial." : "Indique el horario trabajado.";
      return datos;
    }
    salida.innerHTML = "<strong>" + esc(C.numero(datos.horas.diurnas, 2)) + " h</strong> diurnas · <strong>" + esc(C.numero(datos.horas.nocturnas, 2)) + " h</strong> nocturnas" +
      (datos.horas.cruzaMedianoche ? "<br>Termina al día siguiente" : "");
    return datos;
  }

  function resumenHoras() {
    let diurnas = 0;
    let nocturnas = 0;
    $$(".registro__fila", $("#registro-horas")).forEach(fila => {
      const datos = actualizarFila(fila);
      if (datos.horas) {
        diurnas += datos.horas.diurnas;
        nocturnas += datos.horas.nocturnas;
      }
    });
    diurnas = C.redondear(diurnas);
    nocturnas = C.redondear(nocturnas);
    $("#horas-resumen").textContent = C.cantidad(diurnas, "hora diurna", "horas diurnas") + " y " + C.cantidad(nocturnas, "hora nocturna", "horas nocturnas");
    return { diurnas, nocturnas };
  }

  function abrirHoras(boton) {
    objetivoHoras = boton;
    const registro = $("#registro-horas");
    registro.innerHTML = "";
    registro.appendChild(nuevaFilaHoras());
    const error = $("#horas-error");
    error.hidden = true;
    error.textContent = "";
    resumenHoras();
    abrirDialogo($("#dlg-horas"), boton);
  }

  function aplicarHoras() {
    const error = $("#horas-error");
    let incompletas = false;
    $$(".registro__fila", $("#registro-horas")).forEach(fila => {
      const datos = leerFila(fila);
      [datos.fecha, datos.desde, datos.hasta].forEach(x => x.removeAttribute("aria-invalid"));
      if (!datos.fechaValida) {
        datos.fecha.setAttribute("aria-invalid", "true");
        incompletas = true;
      }
      if (!datos.horas) {
        datos.desde.setAttribute("aria-invalid", "true");
        datos.hasta.setAttribute("aria-invalid", "true");
        incompletas = true;
      }
    });
    if (incompletas) {
      error.textContent = "Revise los días marcados: indique la fecha, la hora de inicio y una hora final distinta.";
      error.hidden = false;
      return;
    }
    const { diurnas, nocturnas } = resumenHoras();
    const boton = objetivoHoras;
    const campoDiurnas = document.getElementById(boton.dataset.objetivoDiurnas);
    const campoNocturnas = document.getElementById(boton.dataset.objetivoNocturnas);
    const form = campoDiurnas.form;
    const asignar = (campo, valor, radioAplica) => {
      if (radioAplica) {
        const opcion = grupoRadios(form, radioAplica).find(r => r.value === (valor > 0 ? "si" : "no"));
        if (opcion) opcion.checked = true;
      }
      campo.value = valor > 0 ? String(valor) : (radioAplica ? "" : "0");
      limpiarError(campo);
    };
    asignar(campoDiurnas, diurnas, boton.dataset.aplicaDiurnas);
    asignar(campoNocturnas, nocturnas, boton.dataset.aplicaNocturnas);
    sincronizar(form);
    const dialogo = $("#dlg-horas");
    origenesDialogo.set(dialogo, diurnas > 0 || !boton.dataset.aplicaDiurnas ? campoDiurnas : campoNocturnas);
    cerrarDialogo(dialogo);
  }

  function restablecer(form) {
    $$("[data-tipo]", form).forEach(input => {
      limpiarError(input);
      delete input.dataset.seleccion;
      delete input.dataset.total;
    });
    $$(".error", form).forEach(nodo => {
      nodo.hidden = true;
      nodo.textContent = "";
    });
    $$("[aria-invalid]", form).forEach(x => x.removeAttribute("aria-invalid"));
    $$("details", form).forEach(d => {
      d.open = false;
    });
    sincronizar(form);
    if (form.id === "form-liquidacion") actualizarAntiguedad();
    const idResultado = RESULTADOS[form.id];
    if (idResultado && marcadores[idResultado] !== undefined) {
      document.getElementById(idResultado).innerHTML = marcadores[idResultado];
    }
  }

  function cargarEjemplo() {
    const form = $("#form-liquidacion");
    form.reset();
    setTimeout(() => {
      $("#liq-modo-fechas").checked = true;
      $("#liq-salario").value = "600.00";
      $("#liq-inicio").value = "2015-01-01";
      $("#liq-fin").value = "2021-09-30";
      $("#liq-vacaciones").value = "2021-04-01";
      $("#liq-sin-vacaciones").checked = false;
      $("#liq-minimo").value = "408.80";
      $("#liq-causa-despido").checked = true;
      ["liq-hed-no", "liq-hen-no", "liq-asu-no", "liq-des-no"].forEach(id => {
        document.getElementById(id).checked = true;
      });
      $("#liq-precision-material").checked = true;
      $("#liq-descuentos").checked = false;
      const opciones = $("details.opciones", form);
      if (opciones) opciones.open = true;
      sincronizar(form);
      actualizarAntiguedad();
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    }, 0);
  }

  function alternarDesglose(boton) {
    const destino = document.getElementById(boton.getAttribute("aria-controls"));
    if (!destino) return;
    const mostrar = destino.hidden;
    destino.hidden = !mostrar;
    boton.setAttribute("aria-expanded", mostrar ? "true" : "false");
    boton.textContent = mostrar ? "Ocultar cómo se calculó" : "Ver cómo se calculó";
    if (mostrar) desplazarA(destino, "start");
  }

  const MANEJADORES = {
    "form-liquidacion": calcularLiquidacionModulo,
    "form-renuncia": calcularRenunciaModulo,
    "form-despido": calcularDespidoModulo,
    "form-asueto": calcularAsuetoModulo,
    "form-descanso": calcularDescansoModulo,
    "form-horas": calcularHorasModulo
  };

  function iniciar() {
    Object.keys(RESULTADOS).forEach(idForm => {
      const contenedor = document.getElementById(RESULTADOS[idForm]);
      if (contenedor) marcadores[RESULTADOS[idForm]] = contenedor.innerHTML;
    });

    pintarCatalogos();
    pintarAsuetos();

    Object.keys(MANEJADORES).forEach(id => {
      const form = document.getElementById(id);
      if (!form) return;
      form.addEventListener("submit", evento => {
        evento.preventDefault();
        MANEJADORES[id](form);
      });
      form.addEventListener("reset", () => {
        setTimeout(() => restablecer(form), 0);
      });
      form.addEventListener("change", evento => {
        const objetivo = evento.target;
        if (objetivo.type === "radio") limpiarGrupo(form, objetivo.name);
        sincronizar(form);
        if (form.id === "form-liquidacion") actualizarAntiguedad();
      });
      sincronizar(form);
    });

    document.addEventListener("input", evento => {
      const objetivo = evento.target;
      if (objetivo.matches && objetivo.matches("[data-tipo]")) {
        sanearEntrada(objetivo);
        if (objetivo.dataset.seleccion) {
          delete objetivo.dataset.seleccion;
          delete objetivo.dataset.total;
        }
        if (objetivo.dataset.tipo === "fecha") {
          if (objetivo.getAttribute("aria-invalid") === "true") limpiarError(objetivo);
          if (objetivo.closest("#form-liquidacion")) actualizarAntiguedad();
        }
      }
      if (objetivo.matches && objetivo.matches("[data-veces]")) {
        const limpio = objetivo.value.replace(/\D/g, "");
        if (limpio !== objetivo.value) objetivo.value = limpio;
        contarAsuetos();
      }
      if (objetivo.closest && objetivo.closest("#registro-horas")) {
        objetivo.removeAttribute("aria-invalid");
        resumenHoras();
      }
    });

    document.addEventListener("focusout", evento => {
      const objetivo = evento.target;
      if (!objetivo.matches || !objetivo.matches("[data-tipo]") || !estaActivo(objetivo)) return;
      if (!objetivo.value.trim()) {
        if (objetivo.dataset.aviso) limpiarError(objetivo);
        return;
      }
      const resultado = validarCampo(objetivo);
      if (!resultado.ok) {
        mostrarError(objetivo, resultado.mensaje);
        return;
      }
      limpiarError(objetivo);
      if (objetivo.dataset.tipo === "dinero") objetivo.value = resultado.valor.toFixed(2);
    });

    document.addEventListener("change", evento => {
      const objetivo = evento.target;
      if (objetivo.matches && objetivo.matches("[data-asueto]")) {
        const veces = $('[data-veces="' + objetivo.dataset.asueto + '"]');
        veces.disabled = !objetivo.checked;
        if (!objetivo.checked) veces.value = "1";
        $("#asuetos-error").hidden = true;
        contarAsuetos();
      }
    });

    document.addEventListener("click", evento => {
      const objetivo = evento.target;
      if (!objetivo.closest) return;
      const accion = objetivo.closest("[data-menu], [data-cerrar-menu], [data-saltar], [data-abrir-formulas], [data-abrir-asuetos], [data-abrir-horas], [data-cerrar-dialogo], [data-imprimir], [data-desglose], [data-ejemplo], [data-quitar-fila], #asuetos-aplicar, #horas-aplicar, #horas-agregar");
      if (!accion) return;
      if (accion.matches("[data-menu]")) {
        if (document.body.classList.contains("menu-abierto")) cerrarMenu(true);
        else abrirMenu();
      } else if (accion.matches("[data-cerrar-menu]")) {
        cerrarMenu(true);
      } else if (accion.matches("[data-saltar]")) {
        evento.preventDefault();
        const vista = vistas.find(v => !v.hidden);
        enfocar((vista && $("h1", vista)) || $("#contenido"));
      } else if (accion.matches("[data-abrir-formulas]")) {
        abrirFormulas(accion);
      } else if (accion.matches("[data-abrir-asuetos]")) {
        abrirAsuetos(accion);
      } else if (accion.matches("[data-abrir-horas]")) {
        abrirHoras(accion);
      } else if (accion.matches("[data-cerrar-dialogo]")) {
        const dialogo = accion.closest("dialog");
        if (dialogo) cerrarDialogo(dialogo);
      } else if (accion.matches("[data-imprimir]")) {
        window.print();
      } else if (accion.matches("[data-desglose]")) {
        alternarDesglose(accion);
      } else if (accion.matches("[data-ejemplo]")) {
        cargarEjemplo();
      } else if (accion.matches("[data-quitar-fila]")) {
        const registro = $("#registro-horas");
        const fila = accion.closest(".registro__fila");
        if ($$(".registro__fila", registro).length > 1) {
          fila.remove();
          enfocar($("#horas-agregar"));
        } else {
          $$("input", fila).forEach(i => {
            i.value = "";
            i.removeAttribute("aria-invalid");
          });
        }
        resumenHoras();
      } else if (accion.matches("#horas-agregar")) {
        const fila = nuevaFilaHoras();
        $("#registro-horas").appendChild(fila);
        resumenHoras();
        enfocar($("input", fila));
      } else if (accion.matches("#asuetos-aplicar")) {
        aplicarAsuetos();
      } else if (accion.matches("#horas-aplicar")) {
        aplicarHoras();
      }
    });

    $$("dialog").forEach(dialogo => {
      dialogo.addEventListener("close", () => devolverFocoDialogo(dialogo));
      dialogo.addEventListener("click", evento => {
        if (evento.target !== dialogo || !dialogo.getBoundingClientRect) return;
        const caja = dialogo.getBoundingClientRect();
        const fuera = evento.clientX < caja.left || evento.clientX > caja.right || evento.clientY < caja.top || evento.clientY > caja.bottom;
        if (fuera) cerrarDialogo(dialogo);
      });
    });

    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape" && document.body.classList.contains("menu-abierto")) cerrarMenu(true);
    });

    window.addEventListener("hashchange", mostrarVista);
    mostrarVista();
    actualizarAntiguedad();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
