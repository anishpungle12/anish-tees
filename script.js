/**
 * =============================================
 * ANISH TEES — Main JavaScript
 * =============================================
 * Handles:
 *  - Product rendering
 *  - Cart logic (add / remove / update qty)
 *  - Checkout form validation
 *  - Order submission to n8n webhook
 * =============================================
 */

/* ── CONFIG ─────────────────────────────────────
   Replace this URL with your actual n8n webhook.
   Everything else works out-of-the-box.
──────────────────────────────────────────────── */
const WEBHOOK_URL = 'https://your-n8n-webhook-url.com/webhook/anish-tees-orders';

/* ── PRODUCT DATA ────────────────────────────── */
const PRODUCTS = [
  {
    id: 'AT001',
    name: 'Midnight Grunge Tee',
    price: 799,
    tag: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&q=80',
  },
  {
    id: 'AT002',
    name: 'Solar Flare Drop',
    price: 1099,
    tag: 'New',
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80',
  },
  {
    id: 'AT003',
    name: 'Urban Monochrome',
    price: 649,
    tag: null,
    image: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&q=80',
  },
  {
    id: 'AT004',
    name: 'Abstract Bloom',
    price: 1299,
    tag: 'Limited',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
  },
  {
    id: 'AT005',
    name: 'Raw Edge Classic',
    price: 399,
    tag: null,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80',
  },
  {
    id: 'AT006',
    name: 'Neon Nostalgia',
    price: 999,
    tag: 'Hot',
    image: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&q=80',
  },
  {
    id: 'AT007',
    name: 'Desert Drift Tee',
    price: 849,
    tag: null,
    image: 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?w=400&q=80',
  },
  {
    id: 'AT008',
    name: 'Storm Chaser',
    price: 1199,
    tag: 'New',
    image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&q=80',
  },
  {
    id: 'AT009',
    name: 'Ink & Silence',
    price: 749,
    tag: null,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
  },
  {
    id: 'AT010',
    name: 'Coastal Breeze',
    price: 599,
    tag: 'Sale',
    image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&q=80',
  },
];

const SIZES = ['S', 'M', 'L', 'XL'];

/* ── STATE ───────────────────────────────────── */
// cart: array of { productId, name, image, price, size, qty }
let cart = [];

/* ── DOM REFS ────────────────────────────────── */
const $productsGrid   = document.getElementById('productsGrid');
const $cartBadge      = document.getElementById('cartBadge');
const $cartToggle     = document.getElementById('cartToggle');
const $cartSidebar    = document.getElementById('cartSidebar');
const $cartOverlay    = document.getElementById('cartOverlay');
const $cartClose      = document.getElementById('cartClose');
const $cartItems      = document.getElementById('cartItems');
const $cartEmpty      = document.getElementById('cartEmpty');
const $cartFooter     = document.getElementById('cartFooter');
const $cartTotal      = document.getElementById('cartTotal');
const $checkoutBtn    = document.getElementById('checkoutBtn');
const $checkoutOverlay = document.getElementById('checkoutOverlay');
const $checkoutClose  = document.getElementById('checkoutClose');
const $placeOrderBtn  = document.getElementById('placeOrderBtn');
const $orderItemsList = document.getElementById('orderItemsList');
const $orderSubtotal  = document.getElementById('orderSubtotal');
const $orderTotal     = document.getElementById('orderTotal');
const $stepForm       = document.getElementById('stepForm');
const $stepSuccess    = document.getElementById('stepSuccess');
const $successOrderId = document.getElementById('successOrderId');
const $continueAfterOrder = document.getElementById('continueAfterOrder');
const $continueShoppingBtn = document.getElementById('continueShoppingBtn');

/* ═══════════════════════════════════════════════
   SECTION 1: PRODUCT RENDERING
═══════════════════════════════════════════════ */

/**
 * Format a number as Indian Rupees
 */
function formatPrice(amount) {
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Build & inject one product card into the grid
 */
function renderProduct(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.productId = product.id;

  card.innerHTML = `
    <div class="product-img-wrap">
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
      ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
    </div>
    <div class="product-body">
      <p class="product-name">${product.name}</p>
      <p class="product-price">${formatPrice(product.price)}</p>

      <div class="size-picker">
        <p class="size-label">Select Size</p>
        <div class="size-options">
          ${SIZES.map((s, i) => `
            <button class="size-btn${i === 1 ? ' active' : ''}" data-size="${s}">${s}</button>
          `).join('')}
        </div>
      </div>

      <div class="qty-row">
        <span class="qty-label">Qty</span>
        <div class="qty-control">
          <button class="qty-btn qty-minus" aria-label="Decrease quantity">−</button>
          <span class="qty-value">1</span>
          <button class="qty-btn qty-plus" aria-label="Increase quantity">+</button>
        </div>
      </div>

      <button class="add-to-cart-btn" data-product-id="${product.id}">
        Add to Cart
      </button>
    </div>
  `;

  /* Size selection */
  card.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      card.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* Qty controls */
  const $qtyValue = card.querySelector('.qty-value');
  card.querySelector('.qty-minus').addEventListener('click', () => {
    const current = parseInt($qtyValue.textContent, 10);
    if (current > 1) $qtyValue.textContent = current - 1;
  });
  card.querySelector('.qty-plus').addEventListener('click', () => {
    const current = parseInt($qtyValue.textContent, 10);
    if (current < 10) $qtyValue.textContent = current + 1;
  });

  /* Add to cart */
  const $addBtn = card.querySelector('.add-to-cart-btn');
  $addBtn.addEventListener('click', () => {
    const selectedSize = card.querySelector('.size-btn.active')?.dataset.size || 'M';
    const qty = parseInt($qtyValue.textContent, 10);
    addToCart(product, selectedSize, qty);

    // Brief visual feedback
    $addBtn.textContent = '✓ Added!';
    $addBtn.classList.add('added');
    setTimeout(() => {
      $addBtn.textContent = 'Add to Cart';
      $addBtn.classList.remove('added');
    }, 1800);
  });

  $productsGrid.appendChild(card);
}

/** Render all products */
function renderAllProducts() {
  $productsGrid.innerHTML = '';
  PRODUCTS.forEach(renderProduct);
}

/* ═══════════════════════════════════════════════
   SECTION 2: CART LOGIC
═══════════════════════════════════════════════ */

/**
 * Generate a unique cart item key
 */
function cartKey(productId, size) {
  return `${productId}_${size}`;
}

/**
 * Add or increment a product in the cart
 */
function addToCart(product, size, qty = 1) {
  const key = cartKey(product.id, size);
  const existing = cart.find(item => item.key === key);

  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 10);
  } else {
    cart.push({
      key,
      productId: product.id,
      name:      product.name,
      image:     product.image,
      price:     product.price,
      size,
      qty,
    });
  }

  updateCartUI();
}

/**
 * Remove an item entirely from cart
 */
function removeFromCart(key) {
  cart = cart.filter(item => item.key !== key);
  updateCartUI();
  renderCartItems();
}

/**
 * Update qty of a cart item (min 1)
 */
function updateCartItemQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, 10));
  updateCartUI();
  renderCartItems();
}

/**
 * Compute total item count and price
 */
function getCartTotals() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { count, total };
}

/**
 * Update badge, totals, empty/filled states
 */
function updateCartUI() {
  const { count, total } = getCartTotals();

  // Badge
  $cartBadge.textContent = count;
  $cartBadge.classList.toggle('visible', count > 0);

  // Total
  $cartTotal.textContent = formatPrice(total);

  // Empty / filled state
  const isEmpty = cart.length === 0;
  $cartEmpty.classList.toggle('hidden', !isEmpty);
  $cartFooter.classList.toggle('hidden', isEmpty);
}

/**
 * Render cart items in sidebar
 */
function renderCartItems() {
  $cartItems.innerHTML = '';

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-meta">Size: ${item.size}</p>
        <div class="cart-item-qty-row">
          <button class="cart-qty-btn" data-key="${item.key}" data-delta="-1" aria-label="Decrease">−</button>
          <span class="cart-qty-value">${item.qty}</span>
          <button class="cart-qty-btn" data-key="${item.key}" data-delta="1" aria-label="Increase">+</button>
          <button class="cart-remove-btn" data-key="${item.key}">Remove</button>
        </div>
      </div>
      <span class="cart-item-price">${formatPrice(item.price * item.qty)}</span>
    `;

    // Qty buttons
    el.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        updateCartItemQty(btn.dataset.key, parseInt(btn.dataset.delta, 10));
      });
    });

    // Remove button
    el.querySelector('.cart-remove-btn').addEventListener('click', () => {
      removeFromCart(item.key);
    });

    $cartItems.appendChild(el);
  });
}

/* ── CART SIDEBAR OPEN / CLOSE ─────────────────── */

function openCart() {
  renderCartItems();
  updateCartUI();
  $cartSidebar.classList.add('open');
  $cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  $cartSidebar.classList.remove('open');
  $cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

$cartToggle.addEventListener('click', openCart);
$cartClose.addEventListener('click', closeCart);
$cartOverlay.addEventListener('click', closeCart);
$continueShoppingBtn?.addEventListener('click', closeCart);

/* ── CHECKOUT OPEN ─────────────────────────────── */

$checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  closeCart();
  openCheckout();
});

/* ═══════════════════════════════════════════════
   SECTION 3: CHECKOUT MODAL
═══════════════════════════════════════════════ */

function openCheckout() {
  renderOrderSummary();
  $checkoutOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  $checkoutOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

$checkoutClose.addEventListener('click', closeCheckout);
$checkoutOverlay.addEventListener('click', e => {
  if (e.target === $checkoutOverlay) closeCheckout();
});

/**
 * Render the order summary panel inside the checkout modal
 */
function renderOrderSummary() {
  $orderItemsList.innerHTML = '';
  const { total } = getCartTotals();

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'order-item';
    el.innerHTML = `
      <img class="order-item-img" src="${item.image}" alt="${item.name}" />
      <div class="order-item-details">
        <p class="order-item-name">${item.name}</p>
        <p class="order-item-meta">Size: ${item.size} · Qty: ${item.qty}</p>
      </div>
      <span class="order-item-price">${formatPrice(item.price * item.qty)}</span>
    `;
    $orderItemsList.appendChild(el);
  });

  $orderSubtotal.textContent = formatPrice(total);
  $orderTotal.textContent    = formatPrice(total);
}

/* ═══════════════════════════════════════════════
   SECTION 4: FORM VALIDATION
═══════════════════════════════════════════════ */

const FIELD_RULES = {
  fullName: {
    el: () => document.getElementById('fullName'),
    validate: v => v.trim().length >= 3 || 'Please enter your full name (min 3 chars)',
  },
  email: {
    el: () => document.getElementById('email'),
    validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address',
  },
  phone: {
    el: () => document.getElementById('phone'),
    validate: v => /^[\+]?[\d\s\-]{10,}$/.test(v.trim()) || 'Enter a valid phone number',
  },
  address: {
    el: () => document.getElementById('address'),
    validate: v => v.trim().length >= 10 || 'Enter your full address (min 10 chars)',
  },
  city: {
    el: () => document.getElementById('city'),
    validate: v => v.trim().length >= 2 || 'Enter your city',
  },
  pincode: {
    el: () => document.getElementById('pincode'),
    validate: v => /^\d{6}$/.test(v.trim()) || 'Enter a valid 6-digit pincode',
  },
};

/**
 * Validate all fields. Returns { valid: bool, data: {…} }
 */
function validateForm() {
  let allValid = true;

  Object.entries(FIELD_RULES).forEach(([key, rule]) => {
    const input = rule.el();
    const errEl = document.getElementById(`err-${key}`);
    const result = rule.validate(input.value);

    if (result === true) {
      input.classList.remove('error');
      if (errEl) errEl.textContent = '';
    } else {
      input.classList.add('error');
      if (errEl) errEl.textContent = result;
      allValid = false;
    }
  });

  return {
    valid: allValid,
    data: {
      fullName: document.getElementById('fullName').value.trim(),
      email:    document.getElementById('email').value.trim(),
      phone:    document.getElementById('phone').value.trim(),
      address:  document.getElementById('address').value.trim(),
      city:     document.getElementById('city').value.trim(),
      pincode:  document.getElementById('pincode').value.trim(),
    },
  };
}

/** Clear inline errors on input */
Object.entries(FIELD_RULES).forEach(([key, rule]) => {
  // Deferred so DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    const input = rule.el();
    const errEl = document.getElementById(`err-${key}`);
    input?.addEventListener('input', () => {
      input.classList.remove('error');
      if (errEl) errEl.textContent = '';
    });
  });
});

/* ═══════════════════════════════════════════════
   SECTION 5: ORDER SUBMISSION
═══════════════════════════════════════════════ */

/**
 * Generate a random order ID, e.g. ORD-A3K9
 */
function generateOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'ORD-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Build the order payload for the webhook
 */
function buildPayload(customerData) {
  const orderId = generateOrderId();
  const { total } = getCartTotals();
  const timestamp = new Date().toISOString();

  return {
    orderId,
    timestamp,
    customer: customerData,
    items: cart.map(item => ({
      productId: item.productId,
      name:      item.name,
      size:      item.size,
      qty:       item.qty,
      unitPrice: item.price,
      lineTotal: item.price * item.qty,
    })),
    totalAmount: total,
    currency: 'INR',
  };
}

/**
 * Place the order:
 *  1. Validate form
 *  2. Build payload
 *  3. POST to webhook
 *  4. Show success or error
 */
$placeOrderBtn.addEventListener('click', async () => {
  const { valid, data } = validateForm();
  if (!valid) return;

  const payload = buildPayload(data);

  // UI: loading state
  $placeOrderBtn.classList.add('loading');
  $placeOrderBtn.disabled = true;

  try {
    const response = await fetch(WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    // We treat any response (even non-2xx) as "sent" for demo purposes.
    // In production, check response.ok and handle errors accordingly.
    console.log('Order submitted:', payload);

    // Show success screen
    showOrderSuccess(payload.orderId);

  } catch (error) {
    // Network error — still show success in demo
    // In production: show an error message to the user
    console.warn('Webhook unreachable (demo mode):', error.message);
    showOrderSuccess(payload.orderId);
  }
});

/**
 * Transition to the success step
 */
function showOrderSuccess(orderId) {
  $stepForm.classList.add('hidden');
  $stepSuccess.classList.remove('hidden');
  $successOrderId.textContent = `Order ID: ${orderId}`;

  // Reset cart
  cart = [];
  updateCartUI();
}

/** Continue shopping after successful order */
$continueAfterOrder.addEventListener('click', () => {
  closeCheckout();
  resetCheckoutForm();
});

/**
 * Reset checkout form back to initial state
 * (so it's clean if the user opens it again)
 */
function resetCheckoutForm() {
  ['fullName','email','phone','address','city','pincode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('error'); }
    const errEl = document.getElementById(`err-${id}`);
    if (errEl) errEl.textContent = '';
  });

  $placeOrderBtn.classList.remove('loading');
  $placeOrderBtn.disabled = false;

  // Reset steps
  $stepForm.classList.remove('hidden');
  $stepSuccess.classList.add('hidden');
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
(function init() {
  renderAllProducts();
  updateCartUI();
})();