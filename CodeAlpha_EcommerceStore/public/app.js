// ---------- Cart helpers (using localStorage) ----------
function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }
  saveCart(cart);
  alert(`${product.name} added to cart!`);
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== id);
  saveCart(cart);
}

function updateQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      saveCart(cart);
    }
  }
}

function cartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ---------- Homepage: load product grid ----------
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const res = await fetch('/api/products');
  const products = await res.json();

  grid.innerHTML = products.map((p) => `
    <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
      <img src="${p.image}" alt="${p.name}">
      <div class="info">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
      </div>
    </div>
  `).join('');
}

// ---------- Product detail page ----------
async function loadProductDetail() {
  const box = document.getElementById('productDetail');
  if (!box) return;

  const id = new URLSearchParams(window.location.search).get('id');
  const res = await fetch(`/api/products/${id}`);
  if (!res.ok) {
    box.innerHTML = '<p>Product not found.</p>';
    return;
  }
  const p = await res.json();

  box.innerHTML = `
    <img src="${p.image}" alt="${p.name}">
    <div>
      <h2>${p.name}</h2>
      <p style="margin:14px 0; color:#555;">${p.description}</p>
      <p class="price" style="font-size:22px;">₹${p.price}</p>
      <p style="margin:8px 0; color:#888;">In stock: ${p.stock}</p>
      <button onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
    </div>
  `;
}

// ---------- Cart page ----------
function renderCart() {
  const container = document.getElementById('cartItems');
  if (!container) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    document.getElementById('totalBox').style.display = 'none';
    return;
  }

  container.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-left">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <strong>${item.name}</strong><br>
          ₹${item.price} x ${item.quantity}
        </div>
      </div>
      <div class="qty-controls">
        <button onclick="updateQuantity(${item.id}, -1); renderCart();">-</button>
        ${item.quantity}
        <button onclick="updateQuantity(${item.id}, 1); renderCart();">+</button>
        <button onclick="removeFromCart(${item.id}); renderCart();" style="background:#c0392b;">Remove</button>
      </div>
    </div>
  `).join('');

  document.getElementById('totalBox').style.display = 'block';
  document.getElementById('totalAmount').textContent = `₹${cartTotal()}`;
}

// ---------- Checkout / Order processing ----------
async function placeOrder(e) {
  e.preventDefault();
  const customerName = document.getElementById('custName').value;
  const email = document.getElementById('custEmail').value;
  const cart = getCart();

  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName,
      email,
      items: cart,
      totalAmount: cartTotal()
    })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Order placed successfully! Order ID: ' + data.order.id);
    localStorage.removeItem('cart');
    window.location.href = 'index.html';
  } else {
    alert(data.message || 'Something went wrong.');
  }
}

// ---------- Auth ----------
async function registerUser(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  document.getElementById('authMsg').textContent = data.message;
  if (res.ok) window.location.href = 'login.html';
}

async function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'index.html';
  } else {
    document.getElementById('authMsg').textContent = data.message;
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadProductDetail();
  renderCart();
});
