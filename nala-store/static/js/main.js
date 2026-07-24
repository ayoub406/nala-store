let currentProduct = null;
let currentQty = 1;
let productsData = [];

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    productsData = await res.json();
    renderProducts(productsData);
  } catch (err) {
    document.getElementById('productsContainer').innerHTML = '<div class="empty-msg">حدث خطأ في الاتصال بالسيرفر!</div>';
  }
}

function renderProducts(items) {
  const container = document.getElementById('productsContainer');
  if (items.length === 0) {
    container.innerHTML = '<div class="empty-msg">لا توجد منتجات مضافة في هذا القسم.</div>';
    return;
  }

  container.innerHTML = items.map((item) => {
    // تحديد الشارة تلقائياً حسب نوع المنتج
    const badgeText = item.title.includes('تيشرت') ? '👕 تصميم مطبوع' : '🔥 الأكثر طلباً';

    return `
      <div class="product-card">
        <div class="image-wrapper">
          <span class="badge">${badgeText}</span>
          <img src="${item.image}" alt="${item.title}" class="product-image">
        </div>
        <div class="product-info">
          <div class="category">متجر نالا ✦</div>
          <h3 class="product-title">${item.title}</h3>
          <p class="product-description">${item.description || ''}</p>
          <div class="card-footer">
            <div class="price-box">
              <span class="price-label">السعر</span>
              <div class="price">${item.price} <span class="currency">د.ل</span></div>
            </div>
            <button class="btn-buy" onclick="openOrderModalById(${item.id})">
              <span>اطلب الآن</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// دالة الفلترة
// دالة الفلترة السريعة حسب التصنيف المختار
function filterProducts(category, btnElement) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');

  if (category === 'all') {
    renderProducts(productsData);
  } else {
    const filtered = productsData.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

function openOrderModalById(id) {
  currentProduct = productsData.find(p => p.id === id);
  currentQty = 1;
  document.getElementById('modalProductTitle').innerText = currentProduct.title;
  document.getElementById('customNameInput').value = '';
  document.getElementById('qtyVal').innerText = currentQty;
  updateTotalPrice();
  document.getElementById('orderModal').classList.add('active');
}

function closeModal() { document.getElementById('orderModal').classList.remove('active'); }

function changeQty(delta) {
  if (currentQty + delta >= 1) {
    currentQty += delta;
    document.getElementById('qtyVal').innerText = currentQty;
    updateTotalPrice();
  }
}

function updateTotalPrice() {
  if (currentProduct) {
    document.getElementById('totalPriceVal').innerText = (parseFloat(currentProduct.price) * currentQty);
  }
}

function sendToWhatsApp() {
  const customName = document.getElementById('customNameInput').value.trim();
  if (!customName) { alert("يرجى كتابة الاسم المطلوب للطباعة / النقش!"); return; }

  const phone = "218917948115"; // 👈 ضع رقم الواتساب الخاص بك هنا
  const totalPrice = parseFloat(currentProduct.price) * currentQty;

  const msg = `✨ *طلب جديد من متجر نالا (NALA)* ✨\n📦 *المنتج:* ${currentProduct.title}\n✍️ *الاسم المطلوب:* ${customName}\n🔢 *الكمية:* ${currentQty}\n💰 *الإجمالي:* ${totalPrice} د.ل`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  closeModal();
}

window.onload = fetchProducts;