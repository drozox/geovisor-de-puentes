# Geovisor de Puentes Santiago de Cali

Mapa interactivo con información detallada de puentes en Santiago de Cali.

## Características

- 🗺️ Mapa interactivo con MapLibre GL
- 🔍 Búsqueda y filtrado de puentes
- 📍 Marcadores geolocalizados
- 📊 Información detallada por puente
- 📱 Diseño responsive
- 🎨 Interfaz moderna y oscura

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Vista previa del build
npm run preview
```

## Despliegue en Vercel

1. Conecta tu repositorio de GitHub a [Vercel](https://vercel.com)
2. Vercel detectará automáticamente la configuración de Vite
3. El proyecto se desplegará automáticamente en cada push a la rama principal

## Tecnologías

- **Vite** - Build tool y servidor de desarrollo
- **MapLibre GL** - Librería de mapas
- **Vanilla JavaScript** - Sin frameworks
- **CSS3** - Estilos modernos

## Estructura

```
├── index.html          # HTML principal
├── main.js             # Lógica principal de la aplicación
├── styles.css          # Estilos globales
├── vite.config.js      # Configuración de Vite
├── vercel.json         # Configuración de Vercel
├── package.json        # Dependencias del proyecto
└── puentes_json/       # Datos de puentes (JSON)
```

## API Key MapTiler

El proyecto utiliza una API key de MapTiler. Para producción, considera:
- Restringir la clave a tu dominio
- Usar variables de entorno
- Monitorear el uso de la API

## Licencia

MIT
