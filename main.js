import maplibregl from "https://cdn.jsdelivr.net/npm/maplibre-gl@5.13.0/+esm"





// Inicializar mapa
const map = new maplibregl.Map({
  container: "map",
  style: "https://api.maptiler.com/maps/bright-v2/style.json?key=PMfXSWvsTW8aYOeZ2BrM",
  center: [-76.5249, 3.4516],
  zoom: 14,
  pitch: 0,
  bearing: 0,
})

// Variables globales
let currentSelectedBridge = null

// Agregar controles al mapa
map.addControl(new maplibregl.NavigationControl(), "top-right")
map.addControl(new maplibregl.FullscreenControl(), "top-right")

// Cuando el mapa está cargado, agregar marcadores
map.on("load", () => {

  renderBridgesList(bridgesData)
  addBridgeMarkers()
})

// Datos reales cargados desde puentes_unidos.json
let bridgesData = [];

async function loadRealData() {
  const response = await fetch("https://raw.githubusercontent.com/drozox/geovisor-de-puentes/refs/heads/main/public/puentes_unidos.json");
  const rawData = await response.json();

  bridgesData = rawData.map((p, i) => {
    // Extraer coordenadas del campo SHAPE "(lon, lat)"
    let coords = [0, 0];

    if (p.SHAPE) {
      const match = p.SHAPE.match(/\((-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\)/);
      if (match) {
        coords = [parseFloat(match[1]), parseFloat(match[3])];
      }
    } else if (p.X && p.Y) {
      coords = [parseFloat(p.X), parseFloat(p.Y)];
    }

    // Función para filtrar campos vacíos
    const hasValue = (v) =>
      v !== null && v !== undefined && v !== "" &&
      !(typeof v === "object" && Object.keys(v).length === 0);

    // Crear copia filtrada del raw con solo campos que tienen valor
    const filteredRaw = Object.fromEntries(
      Object.entries(p).filter(([k, v]) => hasValue(v))
    );

    // Construir objeto base
    let bridge = {
      id: i + 1,
      name: p.nombre?.trim() || "Sin nombre",
      type: p.tipo_puente_gen || "No definido",
      coordinates: coords,
      state: p.estado_super || "Sin estado",
      built_year: p.CreationDate ? p.CreationDate.split(" ")[0] : "N/A",
      length: p.longitud_total_m ? p.longitud_total_m + " m" : "N/A",
      width: p.ancho_tablero_m ? p.ancho_tablero_m + " m" : "N/A",
      description: `Puente ubicado en ${p.via || "vía desconocida"}. Inspector: ${p.inspector || "N/A"}`,
      raw: filteredRaw
    };

    // Filtrar también campos vacíos dentro del propio objeto construido
    bridge = Object.fromEntries(
      Object.entries(bridge).filter(([k, v]) => hasValue(v))
    );

    return bridge;
  });

  renderBridgesList(bridgesData);
  addBridgeMarkers();
}


map.on("load", async () => {
  await loadRealData();
});


// Renderizar lista de puentes
function renderBridgesList(bridges) {
  const list = document.getElementById("bridgesList")
  list.innerHTML = ""

  bridges.forEach((bridge) => {
    const item = document.createElement("div")
    item.className = "bridge-item"
    if (currentSelectedBridge && currentSelectedBridge.id === bridge.id) {
      item.classList.add("active")
    }

    item.innerHTML = `
      <div class="bridge-item-name">${bridge.name}</div>
      <div class="bridge-item-type">${bridge.type}</div>
    `

    item.addEventListener("click", () => selectBridge(bridge))
    list.appendChild(item)
  })
}

// Seleccionar puente
function selectBridge(bridge) {
  currentSelectedBridge = bridge

  // Actualizar lista
  renderBridgesList(bridgesData)

  // Mostrar detalles
  showBridgeDetail(bridge)

  // Centrar mapa en el puente
  map.flyTo({
    center: bridge.coordinates,
    zoom: 16,
    duration: 1000,
  })
}

// Mostrar detalles del puente
function showBridgeDetail(bridge) {
  const sidebarRight = document.querySelector(".sidebar-right");
  const detailContainer = document.getElementById("bridgeDetail");

  let stateColor = "#22c55e";
  if (bridge.state === "Mantenimiento") stateColor = "#f59e0b";
  if (bridge.state === "Cerrado") stateColor = "#ef4444";

  // Función para formatear claves del raw
  const formatLabel = (key) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const extractDriveImageURL = (url) => {
    if (!url || typeof url !== "string") return url;

    // Patrones para detectar ID de Drive
    const patterns = [
      /\/file\/d\/([^\/]+)/,       // https://drive.google.com/file/d/ID/view
      /id=([^&]+)/,                // ...id=ID&...
      /\/thumbnail\?id=([^&]+)/,   // ...thumbnail?id=ID
      /uc\?id=([^&]+)/,            // ...uc?id=ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const id = match[1];
        return `https://drive.google.com/uc?export=view&id=${id}`;
      }
    }

    return url;
  };


  // Generar HTML dinámico para datos "raw"
  const extraFields = Object.entries(bridge.raw)
    .filter(([key, value]) => {
      if (value === null || value === undefined || value === "") return false;
      return true;
    })

    .map(([key, value]) => {



      // Manejo especial para mostrar las fotos como imágenes
      // Manejo especial para mostrar las fotos como enlaces clickeables
if (key === "fotos") {
  const fotosHTML = Object.entries(value)
    .map(([categoria, arr]) => {
      return `
        <div class="detail-row">
          <div class="detail-label">${formatLabel(categoria)}</div>
          <div class="detail-value fotos-grid">
            ${arr
              .map(f => {
                const url = extractDriveImageURL(f.drive);
                return `
                  <div class="foto-item">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="foto-link">
                      ${url}
                    </a>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  return fotosHTML;
}





      // Mostrar objetos de fotos de forma más clara
      if (typeof value === "object" && !Array.isArray(value)) {
        return `
          <div class="detail-row">
            <div class="detail-label">${formatLabel(key)}</div>
            <div class="detail-value">
              <pre>${JSON.stringify(value, null, 2)}</pre>
            </div>
          </div>
        `;
      }

      return `
        <div class="detail-row">
          <div class="detail-label">${formatLabel(key)}</div>
          <div class="detail-value">${value}</div>
        </div>
      `;
    })
    .join("");

  // HTML principal
  detailContainer.innerHTML = `
    <h3>${bridge.name}</h3>

    <div class="detail-row">
      <div class="detail-label">Tipo de Puente</div>
      <div class="detail-value">${bridge.type}</div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Estado</div>
      <div class="detail-value">
        <span class="detail-badge"
          style="
            background-color: rgba(${stateColor === "#22c55e" ? "34, 197, 94" : stateColor === "#f59e0b" ? "245, 158, 11" : "239, 68, 68"}, 0.2);
            color: ${stateColor};
          ">
          ${bridge.state}
        </span>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Año de Construcción</div>
      <div class="detail-value">${bridge.built_year}</div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Longitud</div>
      <div class="detail-value">${bridge.length}</div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Ancho</div>
      <div class="detail-value">${bridge.width}</div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Coordenadas</div>
      <div class="detail-value">${bridge.coordinates[0].toFixed(4)}, ${bridge.coordinates[1].toFixed(4)}</div>
    </div>

    <div class="detail-row">
      <div class="detail-label">Descripción</div>
      <div class="detail-value">${bridge.description}</div>
    </div>

    <hr/>

    <h4>Detalles Adicionales</h4>
    ${extraFields}
  `;

  sidebarRight.classList.remove("hidden");
}


// Búsqueda de puentes
document.getElementById("searchBridges").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase()
  const filtered = bridgesData.filter(
    (bridge) => bridge.name.toLowerCase().includes(searchTerm) || bridge.type.toLowerCase().includes(searchTerm),
  )
  renderBridgesList(filtered)
})

// Cerrar panel de detalles
document.getElementById("closeBridgeDetail").addEventListener("click", () => {
  document.querySelector(".sidebar-right").classList.add("hidden")
  currentSelectedBridge = null
  renderBridgesList(bridgesData)
})

// Toggle sidebar (para móvil)
document.getElementById("toggleSidebar").addEventListener("click", () => {
  document.querySelector(".sidebar-left").classList.toggle("hidden")
})
function addBridgeMarkers() {
  bridgesData.forEach((bridge) => {
    // Contenedor del marcador
    const el = document.createElement("div");
    el.className = "marker";

    // SVG visible y sin problemas de encoding
    el.innerHTML = `
      <svg viewBox="0 0 24 24" width="28" height="28">
        <circle cx="12" cy="12" r="10" fill="#00d4ff" stroke="#0095aa" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `;

    // Estilos seguros
    el.style.width = "32px";
    el.style.height = "32px";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.cursor = "pointer";
    el.style.pointerEvents = "auto";
    el.style.zIndex = "1000";

    // Popup
    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
  <div style="color: white; font-weight: 600;">
    <strong>${bridge.name}</strong><br/>
    <small style="color: #e5e5e5;">${bridge.type}</small>
  </div>
`);

    // Marcador
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(bridge.coordinates)
      .setPopup(popup)
      .addTo(map);

    // Click en el marcador
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      marker.togglePopup();   // abre/cierra popup
      selectBridge(bridge);   // centra y muestra detalles
    });

    // Guardar referencia
    bridge.marker = marker;
  });
}


