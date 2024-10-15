const mapId = document.getElementById("map");
const mapSvg = document.querySelector(".map__svg");
const list = document.querySelector(".map__list");
const svg = document.getElementById("mapa_nuble");
const selectedSvgContainer = document.getElementById("selected-svg-container");
const button = document.getElementById("reload");

async function loadData() {
  try {
    const response = await fetch("media/json/data.json");
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}

function filterData(data, comuna) {
  return data.filter((item) => item.PART_TCOMUNA === comuna);
}

function createTableHTML(titulo, filteredData) {
  // Calcular la suma total de los valores de item.COUNT
  const totalCount = filteredData.reduce((sum, item) => sum + item.COUNT, 0);

  // Generar el contenido de la tabla
  const table =
    filteredData.length > 0
      ? `
        <thead>
            <tr>
                <th>INICIATIVA</th>
                <th>ACCIÓN</th>
                <th>BENEFICIARIOS</th>
            </tr>
        </thead>
        <tbody>
            ${filteredData
              .map(
                (item) => `
                    <tr>
                        <td>${item.INICIATIVA_NOMBRE}</td>
                        <td>${item.ACCION_NOMBRE}</td>
                        <td>${item.COUNT}</td>
                    </tr>
                `
              )
              .join("")}
            <tr>
                <td colspan="2"><strong class="total">Total</strong></td>
                <td><strong class="total">${totalCount}</strong></td>
            </tr>
        </tbody>
        `
      : `
        <tbody>
            <tr>
                <td class="no-data" colspan="3">No hay datos para esta comuna</td>
            </tr>
        </tbody>
        `;

  return `
        <caption>${titulo}</caption>
        ${table}
    `;
}

async function createTable(titulo, comuna) {
  const data = await loadData();
  const filteredData = filterData(data, comuna);
  const table = document.createElement("table");

  table.innerHTML = createTableHTML(titulo, filteredData);
  if (!document.querySelector(".selected-svg-container table")) {
    selectedSvgContainer.appendChild(table);

    table.classList.remove("show");
    setTimeout(() => {
      table.classList.add("show");
    }, 30);
  }
}

function handleSelection(id) {
  const pathElement = svg.querySelector(`#${id} path`);
  if (pathElement) {
    // Remueve la clase active de todos los paths
    const allPaths = svg.querySelectorAll("path");
    allPaths.forEach((path) => path.classList.remove("active_path"));

    // Agrega la clase active al path seleccionado
    pathElement.classList.add("active_path");

    // Obtiene el path seleccionado
    const selectedPath = pathElement.getAttribute("d");

    // Crea un nuevo SVG con el path seleccionado
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.setAttribute("viewBox", "0 0 598.78 451.08");
    newSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const newPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    newPath.setAttribute("class", "cls-2");
    newPath.setAttribute("d", selectedPath);

    newSvg.appendChild(newPath);

    // Limpia el contenedor y agrega el nuevo SVG
    selectedSvgContainer.innerHTML = "";
    selectedSvgContainer.appendChild(newSvg);

    // Obtener el data-name y data-title del path
    const dataTitle = pathElement.getAttribute("data-title");
    const dataName = pathElement.getAttribute("data-name");
    // Crear la tabla
    createTable(dataTitle, dataName);

    // Aplicar estilos
    mapId.classList.add("path_active");
    mapSvg.classList.add("path_active");
    list.classList.add("map__list--mini");
    button.classList.add("path_active");
    document.querySelectorAll(".svg_nombre").forEach((element) => {
      element.classList.add("hidden");
    });
    document.querySelector(".total-general").classList.add("hidden");
    selectedSvgContainer.classList.add("path_active");

    newPath.classList.remove("show");

    setTimeout(() => {
      newPath.classList.add("show");
    }, 30);
  }
}

function handleSvgClick(event) {
  const target = event.target;
  if (target.tagName === "path") {
    handleSelection(target.parentElement.id);
  } else if (target.tagName === "tspan") {
    handleSelection(target.parentElement.id.replace("text_", "provincia_"));
  }
}

function handleListClick(event) {
  const target = event.target;
  if (target.tagName === "A") {
    handleSelection(target.id.replace("lista-", "provincia_"));
  }
}

function handleButtonClick() {
  mapId.classList.remove("path_active");
  mapSvg.classList.remove("path_active");
  list.classList.remove("map__list--mini");
  button.classList.remove("path_active");
  selectedSvgContainer.classList.remove("path_active");

  document.querySelectorAll(".svg_nombre").forEach((element) => {
    element.classList.remove("hidden");
  });
  document.querySelector(".total-general").classList.remove("hidden");
  // Remueve la clase active de todos los paths
  const allPaths = svg.querySelectorAll("path");
  allPaths.forEach((path) => path.classList.remove("active_path"));
}

svg.addEventListener("click", handleSvgClick);
list.addEventListener("click", handleListClick);
button.addEventListener("click", handleButtonClick);

/////////////////////////

function total(filteredData) {
  // Calcular la suma total de los valores de item.COUNT
  return filteredData.reduce((sum, item) => sum + item.COUNT, 0);
}

async function calculateTotalForComunas(comunas) {
  const data = await loadData();

  let totalSum = 0;
  let comunaTotals = [];

  for (const [key, value] of Object.entries(comunas)) {
    const filteredData = filterData(data, key);
    const comunaTotal = total(filteredData);
    totalSum += comunaTotal;
    comunaTotals.push({ comuna: value, total: comunaTotal });
  }

  // Ordenar por el total en orden ascendente
  comunaTotals.sort((a, b) => a.total - b.total);

  // Obtener las 3 comunas con menos COUNT
  const threeLeast = comunaTotals.slice(0, 3);

  // Mostrar las 3 comunas con menos COUNT en la tabla
  const tbody = document.querySelector(".total-general table tbody");
  tbody.innerHTML = ""; // Limpiar el tbody antes de añadir nuevas filas

  threeLeast.forEach((item) => {
    const row = document.createElement("tr");

    const comunaCell = document.createElement("td");
    comunaCell.textContent = item.comuna;
    row.appendChild(comunaCell);

    const countCell = document.createElement("td");
    countCell.textContent = item.total;
    row.appendChild(countCell);

    tbody.appendChild(row);
  });

  console.log("Las 3 comunas con menos COUNT:", threeLeast);

  return totalSum;
}

// Lista de comunas
const comunas = {
  "SAN FABIAN": "San Fabián",
  COIHUECO: "Coihueco",
  PINTO: "Pinto",
  "SAN CARLOS": "San Carlos",
  YUNGAY: "Yungay",
  "EL CARMEN": "El Carmen",
  COBQUECURA: "Cobquecura",
  QUIRIHUE: "Quirihue",
  PEMUCO: "Pemuco",
  "SAN NICOLAS": "San Nicolás",
  NIQUEN: "Ñiquén",
  CHILLAN: "Chillán",
  BULNES: "Bulnes",
  QUILLON: "Quillón",
  NINHUE: "Ninhue",
  COELEMU: "Coelemu",
  "SAN IGNACIO": "San Ignacio",
  TREHUACO: "Trehuaco",
  "CHILLAN VIEJO": "Chillán Viejo",
  PORTEZUELO: "Portezuelo",
  RANQUIL: "Ránquil",
};

calculateTotalForComunas(comunas).then((total) => {
  const totalGeneral = document.querySelector(".total-general p");
  totalGeneral.innerHTML = total;
});
