document.getElementById('uploadForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('title', document.getElementById('title').value);
  formData.append('price', document.getElementById('price').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('image', document.getElementById('image').files[0]);

  const res = await fetch('/api/products', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (data.success) {
    alert("تمت إضافة المنتج بنجاح وتصغير الصورة تلقائياً! 🚀");
    document.getElementById('uploadForm').reset();
    loadAdminList();
  } else {
    alert("حدث خطأ أثناء الرفع!");
  }
});

async function loadAdminList() {
  const container = document.getElementById('adminList');
  const res = await fetch('/api/products');
  const products = await res.json();

  if (products.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8; text-align:center; padding:15px;">لا توجد منتجات مضافة بعد.</div>';
    return;
  }

  container.innerHTML = products.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #e2e8f0;">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="${item.image}" width="50" height="50" style="object-fit:cover; border-radius:10px;">
        <div>
          <div style="font-weight:800; color:#0f172a;">${item.title}</div>
          <div style="font-size:0.85rem; color:#e11d48; font-weight:700;">${item.price} د.ل</div>
        </div>
      </div>
      <button onclick="deleteProd(${item.id})" class="btn-delete">حذف 🗑️</button>
    </div>
  `).join('');
}

async function deleteProd(id) {
  if (confirm("هل أنت تأكد من رغبتك في حذف هذا المنتج؟")) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    loadAdminList();
  }
}

window.onload = loadAdminList;