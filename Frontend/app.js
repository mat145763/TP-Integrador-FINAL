// Ajustar el puerto según Properties/launchSettings.json
const API_BASE_URL = "https://localhost:7000/api";

// =========================================================
// UTILIDADES DE FEEDBACK Y COMUNICACIÓN HTTP
// =========================================================
function mostrarCarga(cargando) {
    const indicador = document.getElementById("indicador-carga");
    indicador.hidden = !cargando;
}

function mostrarMensaje(texto, esError = false) {
    const msg = document.getElementById("mensaje-estado");
    msg.textContent = (esError ? "[ERROR] " : "[ÉXITO] ") + texto;
    msg.hidden = false;
    msg.focus();
}

async function fetchAPI(endpoint, opciones = {}) {
    mostrarCarga(true);
    try {
        const respuesta = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                "Content-Type": "application/json",
                ...opciones.headers
            },
            ...opciones
        });

        const textoRespuesta = await respuesta.text();
        const datos = textoRespuesta ? JSON.parse(textoRespuesta) : null;

        if (!respuesta.ok) {
            const detalleError = datos?.mensaje || datos?.title || textoRespuesta || `Error HTTP ${respuesta.status}`;
            throw new Error(detalleError);
        }

        return datos;
    } catch (error) {
        mostrarMensaje(error.message, true);
        throw error;
    } finally {
        mostrarCarga(false);
    }
}

// =========================================================
// GESTIÓN DE SUPERHÉROES
// =========================================================
async function cargarHeroes() {
    try {
        // Ajustar ruta según tu HeroeController.cs
        const heroes = await fetchAPI("/Heroe");
        const tbody = document.getElementById("tbody-heroes");
        const vacio = document.getElementById("vacio-heroes");
        const selectGestion = document.getElementById("select-heroe-gestion");

        tbody.innerHTML = "";
        selectGestion.innerHTML = '<option value="">-- Seleccione un héroe --</option>';

        if (!heroes || heroes.length === 0) {
            vacio.hidden = false;
            return;
        }
        vacio.hidden = true;

        heroes.forEach(heroe => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${heroe.id}</td>
                <td>${heroe.nombreHeroe || heroe.nombre}</td>
                <td>${heroe.puntuacion ?? "-"}</td>
                <td>${heroe.estado}</td>
                <td>
                    <button type="button" onclick="verDetalleHeroe(${heroe.id})">Ver Detalle</button>
                    <button type="button" onclick="prepararEdicionHeroe(${heroe.id})">Editar</button>
                    ${heroe.estado === "Herido" 
                        ? `<button type="button" onclick="recuperarHeroe(${heroe.id})">Recuperar</button>` 
                        : ""}
                </td>
            `;
            tbody.appendChild(tr);

            const opt = document.createElement("option");
            opt.value = heroe.id;
            opt.textContent = `${heroe.nombreHeroe || heroe.nombre} (${heroe.estado})`;
            selectGestion.appendChild(opt);
        });
    } catch (e) {
        // El error ya se muestra en fetchAPI
    }
}

async function verDetalleHeroe(id) {
    try {
        const heroe = await fetchAPI(`/Heroe/${id}`);
        const contenedor = document.getElementById("contenido-detalle-heroe");
        contenedor.innerHTML = `
            <p><strong>ID:</strong> ${heroe.id}</p>
            <p><strong>Nombre:</strong> ${heroe.nombreHeroe || heroe.nombre}</p>
            <p><strong>Identidad Secreta:</strong> ${heroe.identidadSecreta}</p>
            <p><strong>Base:</strong> ${heroe.baseOperaciones}</p>
            <p><strong>Puntuación:</strong> ${heroe.puntuacion} estrellas</p>
            <p><strong>Estado:</strong> ${heroe.estado}</p>
        `;
        document.getElementById("detalle-heroe").hidden = false;
    } catch (e) {}
}

async function prepararEdicionHeroe(id) {
    try {
        const heroe = await fetchAPI(`/Heroe/${id}`);
        document.getElementById("heroe-id").value = heroe.id;
        document.getElementById("heroe-nombre").value = heroe.nombreHeroe || heroe.nombre;
        document.getElementById("heroe-identidad").value = heroe.identidadSecreta;
        document.getElementById("heroe-base").value = heroe.baseOperaciones;
        document.getElementById("heroe-estrellas").value = heroe.puntuacion;
        document.getElementById("btn-cancelar-edicion-heroe").hidden = false;
        document.getElementById("heroe-nombre").focus();
    } catch (e) {}
}

async function recuperarHeroe(id) {
    if (!confirm("¿Confirmar que el superhéroe completó su recuperación?")) return;
    try {
        // Ajustar ruta si tu endpoint de recuperación tiene otro nombre
        await fetchAPI(`/Heroe/${id}/recuperar`, { method: "PATCH" });
        mostrarMensaje("El superhéroe ahora se encuentra Disponible.");
        cargarHeroes();
    } catch (e) {}
}

document.getElementById("form-heroe").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("heroe-id").value;
    const payload = {
        nombreHeroe: document.getElementById("heroe-nombre").value,
        identidadSecreta: document.getElementById("heroe-identidad").value,
        baseOperaciones: document.getElementById("heroe-base").value,
        puntuacion: parseInt(document.getElementById("heroe-estrellas").value, 10)
    };

    try {
        if (id) {
            await fetchAPI(`/Heroe/${id}`, { method: "PUT", body: JSON.stringify(payload) });
            mostrarMensaje("Superhéroe actualizado correctamente.");
        } else {
            await fetchAPI("/Heroe", { method: "POST", body: JSON.stringify(payload) });
            mostrarMensaje("Superhéroe registrado correctamente.");
        }
        e.target.reset();
        document.getElementById("heroe-id").value = "";
        document.getElementById("btn-cancelar-edicion-heroe").hidden = true;
        cargarHeroes();
    } catch (err) {}
});

document.getElementById("btn-cancelar-edicion-heroe").addEventListener("click", () => {
    document.getElementById("form-heroe").reset();
    document.getElementById("heroe-id").value = "";
    document.getElementById("btn-cancelar-edicion-heroe").hidden = true;
});

document.getElementById("btn-cerrar-detalle-heroe").addEventListener("click", () => {
    document.getElementById("detalle-heroe").hidden = true;
});

// =========================================================
// GESTIÓN DE EQUIPOS
// =========================================================
async function cargarEquipos() {
    try {
        // Ajustar ruta según EquipoController.cs
        const equipos = await fetchAPI("/Equipo");
        const tbody = document.getElementById("tbody-equipos");
        const vacio = document.getElementById("vacio-equipos");
        const selectGestion = document.getElementById("select-equipo-gestion");
        const selectAsignar = document.getElementById("select-equipo-asignar");

        tbody.innerHTML = "";
        selectGestion.innerHTML = '<option value="">-- Seleccione un equipo --</option>';
        selectAsignar.innerHTML = '<option value="">-- Seleccione un equipo --</option>';

        if (!equipos || equipos.length === 0) {
            vacio.hidden = false;
            return;
        }
        vacio.hidden = true;

        equipos.forEach(eq => {
            const integrantesTexto = eq.integrantes?.map(h => h.nombreHeroe || h.nombre).join(", ") || "Sin integrantes";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${eq.id}</td>
                <td>${eq.nombre}</td>
                <td>${eq.estado}</td>
                <td>${eq.capacidad ?? "-"}</td>
                <td>${integrantesTexto}</td>
            `;
            tbody.appendChild(tr);

            const optGestion = document.createElement("option");
            optGestion.value = eq.id;
            optGestion.textContent = `${eq.nombre} (${eq.estado})`;
            selectGestion.appendChild(optGestion);

            if (eq.estado === "Disponible") {
                const optAsignar = document.createElement("option");
                optAsignar.value = eq.id;
                optAsignar.textContent = `${eq.nombre} - Cap: ${eq.capacidad ?? "?"}`;
                selectAsignar.appendChild(optAsignar);
            }
        });
    } catch (e) {}
}

document.getElementById("form-equipo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = { nombre: document.getElementById("equipo-nombre").value };
    try {
        await fetchAPI("/Equipo", { method: "POST", body: JSON.stringify(payload) });
        mostrarMensaje("Equipo creado correctamente.");
        e.target.reset();
        cargarEquipos();
    } catch (err) {}
});

document.getElementById("btn-agregar-heroe-equipo").addEventListener("click", async () => {
    const equipoId = document.getElementById("select-equipo-gestion").value;
    const heroeId = document.getElementById("select-heroe-gestion").value;
    if (!equipoId || !heroeId) return mostrarMensaje("Seleccioná un equipo y un héroe.", true);

    try {
        // Ajustar ruta según tu EquipoController.cs
        await fetchAPI(`/Equipo/${equipoId}/heroes/${heroeId}`, { method: "POST" });
        mostrarMensaje("Héroe agregado al equipo.");
        cargarEquipos();
    } catch (e) {}
});

document.getElementById("btn-quitar-heroe-equipo").addEventListener("click", async () => {
    const equipoId = document.getElementById("select-equipo-gestion").value;
    const heroeId = document.getElementById("select-heroe-gestion").value;
    if (!equipoId || !heroeId) return mostrarMensaje("Seleccioná un equipo y un héroe.", true);
    if (!confirm("¿Seguro que querés quitar a este héroe del equipo?")) return;

    try {
        await fetchAPI(`/Equipo/${equipoId}/heroes/${heroeId}`, { method: "DELETE" });
        mostrarMensaje("Héroe quitado del equipo.");
        cargarEquipos();
    } catch (e) {}
});

// =========================================================
// GESTIÓN DE INCIDENTES
// =========================================================
async function cargarIncidentes() {
    const estado = document.getElementById("filtro-estado-incidente").value;
    const ruta = estado ? `/Incidente/estado/${estado}` : "/Incidente";
    try {
        const incidentes = await fetchAPI(ruta);
        const tbody = document.getElementById("tbody-incidentes");
        const vacio = document.getElementById("vacio-incidentes");

        tbody.innerHTML = "";
        if (!incidentes || incidentes.length === 0) {
            vacio.hidden = false;
            return;
        }
        vacio.hidden = true;

        incidentes.forEach(inc => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${inc.id}</td>
                <td>${inc.descripcion}</td>
                <td>${inc.tipo}</td>
                <td>${inc.prioridad}</td>
                <td>${inc.dificultad}</td>
                <td>${inc.estado}</td>
                <td>
                    <button type="button" onclick="verDetalleIncidente(${inc.id})">Gestionar / Ver</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {}
}

async function verDetalleIncidente(id) {
    try {
        const inc = await fetchAPI(`/Incidente/${id}`);
        document.getElementById("det-inc-id").textContent = inc.id;
        document.getElementById("contenido-detalle-incidente").innerHTML = `
            <p><strong>Descripción:</strong> ${inc.descripcion}</p>
            <p><strong>Reportante:</strong> ${inc.nombreReportante} (${inc.telefono})</p>
            <p><strong>Coordenadas:</strong> ${inc.latitud}, ${inc.longitud}</p>
            <p><strong>Dificultad:</strong> ${inc.dificultad} | <strong>Prioridad:</strong> ${inc.prioridad}</p>
            <p><strong>Estado actual:</strong> ${inc.estado}</p>
        `;
        document.getElementById("detalle-incidente").hidden = false;
        document.getElementById("detalle-incidente").dataset.incidenteId = inc.id;
    } catch (e) {}
}

document.getElementById("form-incidente").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        descripcion: document.getElementById("inc-descripcion").value,
        nombreReportante: document.getElementById("inc-reportante").value,
        telefono: document.getElementById("inc-telefono").value,
        latitud: parseFloat(document.getElementById("inc-latitud").value),
        longitud: parseFloat(document.getElementById("inc-longitud").value),
        tipo: document.getElementById("inc-tipo").value,
        prioridad: parseInt(document.getElementById("inc-prioridad").value, 10),
        dificultad: parseInt(document.getElementById("inc-dificultad").value, 10),
        esEmergenciaGeneral: document.getElementById("inc-emergencia-general").checked
    };

    try {
        await fetchAPI("/Incidente", { method: "POST", body: JSON.stringify(payload) });
        mostrarMensaje("Incidente registrado correctamente.");
        e.target.reset();
        cargarIncidentes();
    } catch (err) {}
});

document.getElementById("form-asignar-equipo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const incidenteId = document.getElementById("detalle-incidente").dataset.incidenteId;
    const equipoId = document.getElementById("select-equipo-asignar").value;
    if (!incidenteId || !equipoId) return;

    try {
        // Ajustar ruta según IncidenteController.cs
        await fetchAPI(`/Incidente/${incidenteId}/asignar/${equipoId}`, { method: "POST" });
        mostrarMensaje("Equipo asignado al incidente.");
        cargarIncidentes();
        cargarEquipos();
        cargarHeroes();
    } catch (err) {}
});

document.getElementById("form-estado-incidente").addEventListener("submit", async (e) => {
    e.preventDefault();
    const incidenteId = document.getElementById("detalle-incidente").dataset.incidenteId;
    const nuevoEstado = document.getElementById("select-nuevo-estado").value;
    if (!confirm(`¿Confirmar el cambio de estado del incidente a "${nuevoEstado}"?`)) return;

    try {
        await fetchAPI(`/Incidente/${incidenteId}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ estado: nuevoEstado })
        });
        mostrarMensaje(`Estado actualizado a ${nuevoEstado}.`);
        cargarIncidentes();
        cargarEquipos();
        cargarHeroes();
    } catch (err) {}
});

document.getElementById("btn-cerrar-detalle-incidente").addEventListener("click", () => {
    document.getElementById("detalle-incidente").hidden = true;
});

// =========================================================
// ZONAS DE OPERACIÓN
// =========================================================
async function cargarZonas() {
    try {
        // Ajustar ruta según CentralController.cs o ZonaController
        const zonas = await fetchAPI("/Central/zonas");
        const lista = document.getElementById("lista-zonas");
        const vacio = document.getElementById("vacio-zonas");

        lista.innerHTML = "";
        if (!zonas || zonas.length === 0) {
            vacio.hidden = false;
            return;
        }
        vacio.hidden = true;

        zonas.forEach(z => {
            const li = document.createElement("li");
            const equipos = z.equipos?.map(e => e.nombre).join(", ") || "Ninguno";
            li.textContent = `Zona: ${z.nombre} — Equipos habituales: ${equipos}`;
            lista.appendChild(li);
        });
    } catch (e) {}
}

// =========================================================
// INICIALIZACIÓN
// =========================================================
document.getElementById("btn-cargar-incidentes").addEventListener("click", cargarIncidentes);
document.getElementById("filtro-estado-incidente").addEventListener("change", cargarIncidentes);
document.getElementById("btn-cargar-heroes").addEventListener("click", cargarHeroes);
document.getElementById("btn-cargar-equipos").addEventListener("click", cargarEquipos);
document.getElementById("btn-cargar-zonas").addEventListener("click", cargarZonas);

window.addEventListener("DOMContentLoaded", () => {
    cargarIncidentes();
    cargarHeroes();
    cargarEquipos();
    cargarZonas();
});