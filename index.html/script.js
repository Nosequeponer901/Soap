// Variables generales
let juegoActual = null;
let nombreJugador = '';
let timerInterval = null;

// Snake variables
const gridSize = 20;
let snake = [];
let dx = gridSize;
let dy = 0;
let food = { x: 0, y: 0 };
let snakeInterval = null;
let snakeScore = 0;

// Negocio variables
let negocioDinero = 0;
let negociosCantidad = 0;

// Tiro variables
let tiroX = 300;
let tiroY = 200;
let tiroScore = 0;
let tiroInterval = null;
let tiroCtx = null;

// Monedas y skins
const skins = [
  { id: 'green', color: 'green', costo: 0 },
  { id: 'orange', color: 'orange', costo: 5 },
  { id: 'purple', color: 'purple', costo: 10 },
  { id: 'pink', color: 'pink', costo: 15 },
  { id: 'multicolor', color: 'multicolor', costo: 20 }
];

let monedas = 0;
let skinActual = 'green'; // por defecto

// Ranking local (array de objetos {nombre, juego, puntaje})
let ranking = JSON.parse(localStorage.getItem('ranking')) || [];

window.onload = () => {
  monedas = parseInt(localStorage.getItem('monedas')) || 0;
  skinActual = localStorage.getItem('skin') || 'green';
  actualizarMonedasUI();
  mostrarRanking();
};

// Funciones UI
function esconderTodo() {
  document.getElementById('menu').classList.add('oculto');
  document.getElementById('nombreJugadorDiv').classList.add('oculto');
  document.getElementById('snakeGame').classList.add('oculto');
  document.getElementById('negocioGame').classList.add('oculto');
  document.getElementById('tiroGame').classList.add('oculto');
  document.getElementById('ranking').classList.add('oculto');
  document.getElementById('tienda').classList.add('oculto');
}

function volverMenu() {
  detenerTodos();
  esconderTodo();
  document.getElementById('menu').classList.remove('oculto');
}

function seleccionarJuego(juego) {
  juegoActual = juego;
  esconderTodo();
  document.getElementById('nombreJugadorDiv').classList.remove('oculto');
}

function iniciarJuego() {
  const input = document.getElementById('nombreJugadorInput');
  if (!input.value.trim()) {
    alert('Por favor escribí tu nombre');
    return;
  }
  nombreJugador = input.value.trim();
  input.value = '';
  esconderTodo();

  if (juegoActual === 'snake') {
    document.getElementById('snakeGame').classList.remove('oculto');
    iniciarSnake();
  } else if (juegoActual === 'negocio') {
    document.getElementById('negocioGame').classList.remove('oculto');
    iniciarNegocio();
  } else if (juegoActual === 'tiro') {
    document.getElementById('tiroGame').classList.remove('oculto');
    iniciarTiro();
  }

  iniciarTimer(120); // 2 minutos
}

function detenerTodos() {
  detenerSnake();
  detenerTiro();
  clearInterval(timerInterval);
}

function iniciarTimer(segundos) {
  let restante = segundos;
  timerInterval = setInterval(() => {
    restante--;
    if (restante <= 0) {
      clearInterval(timerInterval);
      alert('Se terminó el tiempo!');
      terminarJuego();
    }
  }, 1000);
}

function terminarJuego() {
  detenerTodos();

  // Puntaje final depende del juego
  let puntosFinales = 0;
  if (juegoActual === 'snake') puntosFinales = snakeScore;
  else if (juegoActual === 'negocio') puntosFinales = negocioDinero;
  else if (juegoActual === 'tiro') puntosFinales = tiroScore;

  alert(`Juego terminado! Puntaje: ${puntosFinales}`);

  // Guardar ranking
  ranking.push({ nombre: nombreJugador, juego: juegoActual, puntaje: puntosFinales });
  ranking.sort((a,b) => b.puntaje - a.puntaje);
  ranking = ranking.slice(0,10);
  localStorage.setItem('ranking', JSON.stringify(ranking));

  // Sumar monedas: 1 moneda cada 3 puntos
  const nuevasMonedas = Math.floor(puntosFinales / 3);
  monedas += nuevasMonedas;
  localStorage.setItem('monedas', monedas);
  actualizarMonedasUI();

  volverMenu();
}

function mostrarRanking() {
  esconderTodo();
  document.getElementById('ranking').classList.remove('oculto');

  const tbody = document.getElementById('tablaRanking');
  tbody.innerHTML = '';

  ranking.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${r.nombre}</td><td>${r.juego}</td><td>${r.puntaje}</td>`;
    tbody.appendChild(tr);
  });
}

function mostrarTienda() {
  esconderTodo();
  document.getElementById('tienda').classList.remove('oculto');
  actualizarMonedasUI();
  mostrarSkins();
}

function actualizarMonedasUI() {
  document.getElementById('monedasTotales').textContent = monedas;
}

// TIENDA
function mostrarSkins() {
  const cont = document.getElementById('skinsContainer');
  cont.innerHTML = '';
  skins.forEach(skin => {
    const div = document.createElement('div');
    div.classList.add('skin');
    div.style.background = skin.color === 'multicolor' 
      ? 'linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)' 
      : skin.color;
    div.textContent = '';
    if (skin.costo > 0 && !tieneSkin(skin.id)) {
      div.classList.add('no-comprada');
      div.setAttribute('data-costo', skin.costo);
    } else {
      div.classList.add('comprada');
    }
    if (skin.id === skinActual) {
      div.style.borderColor = 'yellow';
    }
    div.title = skin.id.charAt(0).toUpperCase() + skin.id.slice(1);
    div.onclick = () => comprarSkin(skin.id);
    cont.appendChild(div);
  });
}

function tieneSkin(id) {
  const skinsCompradas = JSON.parse(localStorage.getItem('skinsCompradas')) || ['green'];
  return skinsCompradas.includes(id);
}

function comprarSkin(id) {
  const skin = skins.find(s => s.id === id);
  if (!skin) return;

  if (tieneSkin(id)) {
    // Cambiar skin activa
    skinActual = id;
    localStorage.setItem('skin', skinActual);
    mostrarSkins();
    alert(`Skin ${id} activada!`);
    return;
  }

  if (monedas >= skin.costo) {
    monedas -= skin.costo;
    localStorage.setItem('monedas', monedas);
    const skinsCompradas = JSON.parse(localStorage.getItem('skinsCompradas')) || ['green'];
    skinsCompradas.push(id);
    localStorage.setItem('skinsCompradas', JSON.stringify(skinsCompradas));
    skinActual = id;
    localStorage.setItem('skin', skinActual);
    mostrarSkins();
    actualizarMonedasUI();
    alert(`Skin ${id} comprada y activada!`);
  } else {
    alert('No tenés suficientes monedas');
  }
}

// SNAKE
function iniciarSnake() {
  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  snake = [{ x: 240, y: 240 }];
  dx = gridSize;
  dy = 0;
  snakeScore = 0;
  colocarComida();

  document.addEventListener('keydown', cambiarDireccion);
  if (snakeInterval) clearInterval(snakeInterval);
  snakeInterval = setInterval(() => {
    moverSnake(ctx);
  }, 100);
  actualizarPuntajeSnake();
}

function detenerSnake() {
  if (snakeInterval) clearInterval(snakeInterval);
  document.removeEventListener('keydown', cambiarDireccion);
}

function colocarComida() {
  food.x = Math.floor(Math.random() * (600 / gridSize)) * gridSize;
  food.y = Math.floor(Math.random() * (400 / gridSize)) * gridSize;
}

function moverSnake(ctx) {
  const cabeza = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Colisiones con paredes
  if (cabeza.x < 0 || cabeza.x >= 600 || cabeza.y < 0 || cabeza.y >= 400) {
    terminarJuego();
    return;
  }
  // Colisiones con cuerpo
  for (let segmento of snake) {
    if (cabeza.x === segmento.x && cabeza.y === segmento.y) {
      terminarJuego();
      return;
    }
  }

  snake.unshift(cabeza);

  // Comer comida
  if (cabeza.x === food.x && cabeza.y === food.y) {
    snakeScore++;
    colocarComida();
    actualizarPuntajeSnake();
  } else {
    snake.pop();
  }

  dibujarSnake(ctx);
}

function dibujarSnake(ctx) {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 600, 400);

  // Dibujar comida
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x, food.y, gridSize, gridSize);

  // Dibujar snake
  for (let i = 0; i < snake.length; i++) {
    let s = snake[i];
    ctx.fillStyle = (i === 0) ? 'yellow' : skinActual;
    ctx.fillRect(s.x, s.y, gridSize, gridSize);
  }
}

function cambiarDireccion(event) {
  const tecla = event.key;
  if (tecla === 'ArrowUp' && dy === 0) {
    dx = 0; dy = -gridSize;
  } else if (tecla === 'ArrowDown' && dy === 0) {
    dx = 0; dy = gridSize;
  } else if (tecla === 'ArrowLeft' && dx === 0) {
    dx = -gridSize; dy = 0;
  } else if (tecla === 'ArrowRight' && dx === 0) {
    dx = gridSize; dy = 0;
  }
}

function actualizarPuntajeSnake() {
  document.getElementById('snakeScore').textContent = snakeScore;
}

// NEGOCIO
function iniciarNegocio() {
  negocioDinero = 0;
  negociosCantidad = 0;
  actualizarNegocioUI();
}

function incrementarDinero() {
  negocioDinero += 10;
  actualizarNegocioUI();
}

function comprarNegocio() {
  if (negocioDinero >= 50) {
    negocioDinero -= 50;
    negociosCantidad++;
    actualizarNegocioUI();
  } else {
    alert('No tenés suficiente dinero para comprar un negocio');
  }
}

function actualizarNegocioUI() {
  document.getElementById('negocioDinero').textContent = negocioDinero;
  document.getElementById('negociosCantidad').textContent = negociosCantidad;
}

// TIRO AL BLANCO
function iniciarTiro() {
  tiroScore = 0;
  tiroX = 300;
  tiroY = 200;
  const canvas = document.getElementById('tiroCanvas');
  tiroCtx = canvas.getContext('2d');

  canvas.addEventListener('click', disparar);

  if (tiroInterval) clearInterval(tiroInterval);
  tiroInterval = setInterval(() => {
    moverBlanco();
  }, 30);

  dibujarTiro();
  actualizarPuntajeTiro();
}

function detenerTiro() {
  const canvas = document.getElementById('tiroCanvas');
  canvas.removeEventListener('click', disparar);
  if (tiroInterval) clearInterval(tiroInterval);
}

function moverBlanco() {
  // Movimiento circular
  const time = Date.now() / 500;
  tiroX = 300 + 100 * Math.cos(time);
  tiroY = 200 + 100 * Math.sin(time);
  dibujarTiro();
}

function dibujarTiro() {
  tiroCtx.fillStyle = 'black';
  tiroCtx.fillRect(0, 0, 600, 400);

  // Dibujar blanco
  tiroCtx.beginPath();
  tiroCtx.arc(tiroX, tiroY, 20, 0, 2 * Math.PI);
  tiroCtx.fillStyle = skinActual;
  tiroCtx.fill();
  tiroCtx.strokeStyle = 'white';
  tiroCtx.stroke();
}

function disparar(event) {
  const rect = event.target.getBoundingClientRect();
  const xClick = event.clientX - rect.left;
  const yClick = event.clientY - rect.top;

  const distancia = Math.sqrt((xClick - tiroX) ** 2 + (yClick - tiroY) ** 2);

  if (distancia <= 20) {
    tiroScore++;
    actualizarPuntajeTiro();
  }
}

function actualizarPuntajeTiro() {
  document.getElementById('tiroScore').textContent = tiroScore;
}
