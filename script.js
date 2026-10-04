// Variables globales
let selectedCategory = "Todo";
let selectedColor = null;

// Función para limpiar todos los filtros en un solo click
function resetFilters() {
  selectedCategory = "Todo";
  selectedColor = null;

  // Reset botones
  document.querySelectorAll(".filters button, .colors button").forEach(btn => btn.classList.remove("active"));
  document.getElementById("btn-todo").classList.add("active");

  // Reset fondo
  document.body.classList.remove("rojo", "verde", "azul");

  applyFilters();
}

// Función para seleccionar categoría con toggle
function toggleCategory(category) {
  const btnId = "btn-" + category.toLowerCase();
  const btn = document.getElementById(btnId);

  // Si ya está seleccionada, desactiva
  if (selectedCategory === category) {
    selectedCategory = "Todo";
    btn.classList.remove("active");
    document.getElementById("btn-todo").classList.add("active");
  } else {
    // Activa nueva categoría
    selectedCategory = category;
    document.querySelectorAll(".filters button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
  }

  applyFilters();
}

// Función para seleccionar color con toggle
function toggleColor(color) {
  const btnId = "btn-" + color.toLowerCase();
  const btn = document.getElementById(btnId);

  if (selectedColor === color) {
    selectedColor = null;
    if (btn) btn.classList.remove("active");
    document.body.classList.remove("rojo", "verde", "azul");
  } else {
    selectedColor = color;
    document.querySelectorAll(".colors button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    document.body.classList.remove("rojo", "verde", "azul");
    if (color === "Rojo") document.body.classList.add("rojo");
    if (color === "Verde") document.body.classList.add("verde");
    if (color === "Azul") document.body.classList.add("azul");
  }

  applyFilters();
}

// Aplicar filtros
function applyFilters() {
  const products = document.querySelectorAll(".product-card");
  let visibleCount = 0;

  products.forEach(p => {
    const category = p.getAttribute("data-category");
    const color = p.getAttribute("data-color");

    const matchCategory = (selectedCategory === "Todo" || category === selectedCategory);
    const matchColor = (!selectedColor || color === selectedColor);

    if (matchCategory && matchColor) {
      p.style.display = "block";
      visibleCount++;
    } else {
      p.style.display = "none";
    }
  });

  // Mostrar mensaje si no hay productos visibles
  const msg = document.getElementById("no-products-message");
  if (visibleCount === 0) {
    msg.style.display = "block";
  } else {
    msg.style.display = "none";
  }
}

// Modal
function openModal(title, desc, price, color, img) {
  document.getElementById('modal-title').innerText = title;
  document.getElementById('modal-desc').innerText = desc;
  document.getElementById('modal-price').innerText = price;
  document.getElementById('modal-img').src = img;

  // Pintar fondo del modal según color con degradado
  const modalContent = document.getElementById('modal-content');
  modalContent.classList.remove("rojo", "verde", "azul");
  if (color === "Rojo") modalContent.classList.add("rojo");
  if (color === "Verde") modalContent.classList.add("verde");
  if (color === "Azul") modalContent.classList.add("azul");

  document.getElementById('modal').style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('fadeOut');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('fadeOut');
  }, 500);
}

window.onclick = function(event) {
  const modal = document.getElementById('modal');
  if (event.target === modal) {
    closeModal();
  }
}
