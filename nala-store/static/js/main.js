let cart = [];
let productsData = [];

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    productsData = await res.json();
    renderProducts(productsData);
  } catch (err) {
    const container = document.getElementById('productsContainer');
    if (container) {
      container.innerHTML = '<div class="empty-msg" style="text-align:center; padding:20px; color:#ef4444;">حدث خطأ في الاتصال بالسيرفر!</div>';
    }
  }
}

function renderProducts(items) {
  const container = document.getElementById('productsContainer');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty-msg" style="text-align:center; padding:20px; color:#64748b;">لا توجد منتجات مضافة في هذا القسم.</div>';
    return;
  }

  container.innerHTML = items.map((item) => {
    const badgeText = item.title.includes('تيشرت') ? '👕 تصميم مطبوع' : '🔥 الأكثر طلباً';

    const avg = item.avg_rating || 0;
    const fullStars = '⭐'.repeat(Math.floor(avg));
    const emptyStars = '☆'.repeat(5 - Math.floor(avg));
    const starsHtml = fullStars + emptyStars;

    return `
      <div class="product-card" style="display: flex; flex-direction: column; justify-content: space-between; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 20px;">
        <div>
          <div class="image-wrapper" style="position: relative;">
            <span class="badge" style="position: absolute; top: 10px; right: 10px; background: #0284c7; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 700;">${badgeText}</span>
            <img src="${item.image}" alt="${item.title}" class="product-image" style="width: 100%; height: 200px; object-fit: cover;">
          </div>
          <div class="product-info" style="padding: 15px;">
            <div class="category" style="color: #0284c7; font-size: 0.8rem; font-weight: 700; margin-bottom: 5px;">متجر نالا ✦</div>
            <h3 class="product-title" style="font-size: 1.1rem; font-weight: 900; margin-bottom: 8px;">${item.title}</h3>
            <p class="product-description" style="color: #64748b; font-size: 0.9rem; margin-bottom: 10px;">${item.description || ''}</p>

            <!-- ⭐ قسم عرض التقييمات والنجوم -->
            <div class="product-rating-box" style="margin: 10px 0; padding: 8px; background: #f8fafc; border-radius: 8px;">
              <div style="color: #f59e0b; font-size: 14px;">
                ${starsHtml} <span style="color: #64748b; font-size: 12px;">(${avg} / 5 - ${item.reviews_count} تقييم)</span>
              </div>

              <form onsubmit="submitReview(event, ${item.id})" style="margin-top: 8px; display: flex; flex-direction: column; gap: 5px;">
                <div style="display: flex; gap: 5px;">
                  <select name="rating" class="form-input" style="padding: 4px; font-size: 12px; border-radius: 4px; width: 60%;">
                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                    <option value="4">⭐⭐⭐⭐ (4)</option>
                    <option value="3">⭐⭐⭐ (3)</option>
                    <option value="2">⭐⭐ (2)</option>
                    <option value="1">⭐ (1)</option>
                  </select>
                  <input type="text" name="customer_name" placeholder="اسمك" required class="form-input" style="padding: 4px; font-size: 12px; border-radius: 4px; width: 40%; border: 1px solid #cbd5e1;">
                </div>
                <button type="submit" style="background: #0284c7; color: white; border: none; padding: 4px; border-radius: 4px; font-size: 11px; cursor: pointer;">أرسل تقييمك</button>
              </form>
            </div>
          </div>
        </div>

        <div class="product-info" style="padding: 0 15px 15px 15px;">
          <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; pt: 10px;">
            <div class="price-box">
              <span class="price-label" style="font-size: 0.8rem; color: #64748b;">السعر</span>
              <div class="price" style="font-size: 1.2rem; font-weight: 900; color: #0f172a;">${item.price} <span class="currency" style="font-size: 0.9rem; color: #ef4444;">د.ل</span></div>
            </div>
            <!-- زر إضافة للسلة باللون الأحمر الفخم -->
            <button class="btn-add-cart" onclick="addToCart(${item.id})" style="background: #ef4444; color: #fff; font-weight: 800; border: none; padding: 10px 16px; border-radius: 12px; cursor: pointer; transition: background 0.2s;">
              <span>إضافة للسلة 🛒</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// دالة إضافة المنتج للسلة وتحديث العداد الفوري
function addToCart(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1
    });
  }
  updateCartUI();
  alert("تمت إضافة المنتج إلى السلة بنجاح! 🛒");
}

// تحديث واجهة السلة والعداد العائم
function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const cartTotalPrice = document.getElementById('cartTotalPrice');

  let totalCount = 0;
  let totalPrice = 0;

  if (cart.length === 0) {
    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = '<p style="text-align:center; color:#64748b; margin-top:20px;">السلة فارغة حالياً</p>';
    }
  } else {
    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = cart.map((item, index) => {
        totalCount += item.quantity;
        totalPrice += item.price * item.quantity;
        return `
          <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
            <div>
              <strong>${item.title}</strong><br>
              <small style="color: #64748b;">${item.price} د.ل × ${item.quantity}</small>
            </div>
            <button onclick="removeFromCart(${index})" style="background:#fee2e2; color:#ef4444; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px;">حذف</button>
          </div>
        `;
      }).join('');
    }
  }

  if (cartCount) cartCount.innerText = totalCount;
  if (cartTotalPrice) cartTotalPrice.innerText = totalPrice;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) drawer.classList.toggle('open');
}

function toggleBankDetails() {
  const paymentSelect = document.getElementById('paymentMethodSelect');
  const bankBox = document.getElementById('bankDetailsBox');
  if (paymentSelect && bankBox) {
    bankBox.style.display = paymentSelect.value === 'حوالة مصرفية' ? 'block' : 'none';
  }
}

function openCheckoutModal() {
  if (cart.length === 0) {
    alert("سلة المشتريات فارغة!");
    return;
  }
  const totalPriceElem = document.getElementById('cartTotalPrice');
  const checkoutPriceElem = document.getElementById('checkoutTotalPrice');
  if (totalPriceElem && checkoutPriceElem) {
    checkoutPriceElem.innerText = totalPriceElem.innerText;
  }

  const orderModal = document.getElementById('orderModal');
  if (orderModal) orderModal.style.display = 'flex';
  toggleCart();
}

function closeModal() {
  const orderModal = document.getElementById('orderModal');
  if (orderModal) orderModal.style.display = 'none';
}

async function submitReview(event, productId) {
  event.preventDefault();
  const form = event.target;
  const rating = form.elements['rating'].value;
  const customerName = form.elements['customer_name'].value;

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, rating: parseInt(rating), customer_name: customerName })
    });
    const data = await res.json();
    if (data.success) {
      alert("شكراً لك! تم إضافة تقييمك بنجاح.");
      fetchProducts();
    } else {
      alert("حدث خطأ أثناء إرسال التقييم.");
    }
  } catch (err) {
    alert("خطأ في الاتصال بالسيرفر!");
  }
}

function filterProducts(category, btnElement) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  if (category === 'all') {
    renderProducts(productsData);
  } else {
    const filtered = productsData.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

async function sendToWhatsApp() {
  const fullName = document.getElementById('customerFullName').value.trim();
  const phoneInput = document.getElementById('customerPhone').value.trim();
  const deliveryMethod = document.getElementById('deliveryMethodSelect').value;
  const paymentMethod = document.getElementById('paymentMethodSelect').value;

  if (!fullName || !phoneInput) {
    alert("الرجاء إدخال الاسم الثلاثي ورقم الهاتف!");
    return;
  }

  let totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let itemsText = cart.map(i => `- ${i.title} (الكمية: ${i.quantity}, السعر: ${i.price * i.quantity} د.ل)`).join('\n');

  try {
    for (let item of cart) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_title: item.title,
          custom_name: fullName,
          quantity: item.quantity,
          total_price: item.price * item.quantity,
          delivery_method: deliveryMethod,
          payment_method: paymentMethod
        })
      });
    }
  } catch (e) {
    console.log("Could not save orders to DB");
  }

  let bankExtraText = "";
  if (paymentMethod === 'حوالة مصرفية') {
    bankExtraText = `\n🏛️ *طريقة الدفع:* حوالة مصرفية (مصرف شمال إفريقيا)\n📌 *الحساب المخصص:* 0123456789012345 (أيوب مسعود)`;
  } else {
    bankExtraText = `\n💵 *طريقة الدفع:* دفع نقدي عند الاستلام`;
  }

  const msg = `✨ *طلب جديد من متجر نالا (NALA)* ✨\n👤 *الاسم:* ${fullName}\n📞 *الهاتف:* ${phoneInput}\n🚚 *طريقة الاستلام:* ${deliveryMethod}${bankExtraText}\n\n📦 *المنتجات:* \n${itemsText}\n\n💰 *الإجمالي الكلي:* ${totalPrice} د.ل`;

  const whatsappPhone = "218922798054";
  window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`, '_blank');

  cart = [];
  updateCartUI();
  closeModal();
  alert("تم تسجيل طلبك بنجاح وإرساله لشاشة المدير ولواتساب المتجر! 🎉");
}

window.onload = fetchProducts;