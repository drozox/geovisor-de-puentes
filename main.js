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

  // Diccionario de traducción
  const stateMapping = {
    'B': 'Bueno',
    'R': 'Regular',
    'M': 'Malo'
  };

  bridgesData = rawData.map((p, i) => {
    // ... (mantener lógica de coordenadas igual)
    let coords = [0, 0];
    if (p.SHAPE) {
      const match = p.SHAPE.match(/\((-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\)/);
      if (match) coords = [parseFloat(match[1]), parseFloat(match[3])];
    } else if (p.X && p.Y) {
      coords = [parseFloat(p.X), parseFloat(p.Y)];
    }

    // Traducir el estado
    const rawState = p.estado_super ? p.estado_super.trim().toUpperCase() : "";
    const translatedState = stateMapping[rawState] || rawState || "Sin estado";

    let bridge = {
      id: i + 1,
      name: p.nombre?.trim() || "Sin nombre",
      type: p.tipo_puente_gen || "No definido",
      coordinates: coords,
      state: translatedState, // <--- Aquí ya guarda "Bueno", "Regular" o "Malo"
      built_year: p.CreationDate ? p.CreationDate.split(" ")[0] : "N/A",
      length: p.longitud_total_m ? p.longitud_total_m + " m" : "N/A",
      width: p.ancho_tablero_m ? p.ancho_tablero_m + " m" : "N/A",
      description: `Puente ubicado en ${p.via || "vía desconocida"}.`,
      raw: p
    };
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
  currentSelectedBridge = bridge;

  // 1. Resetear todos los marcadores al color original (Azul)
  document.querySelectorAll('.bridge-path').forEach(path => {
    path.setAttribute('fill', '#00d4ff');
  });

  // 2. Pintar el marcador seleccionado de Naranja
  const activeMarker = document.querySelector(`#marker-${bridge.id} .bridge-path`);
  if (activeMarker) {
    activeMarker.setAttribute('fill', '#ffa200ff'); // Naranja
  }

  // Actualizar lista y mostrar detalles (tu código actual)
  renderBridgesList(bridgesData);
  showBridgeDetail(bridge);

  map.flyTo({
    center: bridge.coordinates,
    zoom: 16,
    duration: 1000,
  });
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
    const el = document.createElement("div");
    el.className = "marker";
    el.id = `marker-${bridge.id}`; // ID único para cada marcador

    const colorDefecto = "#29bcdab4"; // Azul Cian

    // stroke="#000000" añade el borde negro
    // stroke-width="15" ajusta el grosor (proporcional al viewBox de 455)
    // stroke-linejoin="round" para que las esquinas del borde sean suaves
    el.innerHTML = `
      <svg viewBox="0 0 455 455" width="25" height="25" xmlns="http://www.w3.org/2000/svg">
        <path 
          class="bridge-path"
          fill="${colorDefecto}" 
          stroke="#000000" 
          stroke-width="15" 
          stroke-linejoin="round"
          d="M455,114.25v-30H0v30h30v40H0v216.5h65.993c0,0,0-59.767,0-59.767c0-35.435,28.768-64.161,64.256-64.161 c35.488,0,64.256,28.726,64.256,64.161L194.5,370.75h65.996v-59.767c0-35.435,28.768-64.161,64.256-64.161 s64.256,28.726,64.256,64.161c0,0,0,59.767,0,59.767H455v-216.5h-30v-40H455z M212.5,154.25H60v-40h152.5V154.25z M395,154.25H242.5 v-40H395V154.25z"
        />
      </svg>
    `;

    el.style.width = "35px";
    el.style.height = "35px";
    el.style.cursor = "pointer";
    el.style.filter = "drop-shadow(0px 3px 2px rgba(0,0,0,0.3))";

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(bridge.coordinates)
      .addTo(map);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selectBridge(bridge);
    });

    bridge.marker = marker;
  });
}