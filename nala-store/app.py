import os
import sqlite3
from flask import Flask, render_template, request, jsonify
from PIL import Image

app = Flask(__name__)

# مجلد رفع الصور
UPLOAD_FOLDER = os.path.join('static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# تهيئة قاعدة البيانات SQLite تلقائياً (المنتجات، التقييمات، والطلبات)
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # جدول المنتجات
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            image TEXT NOT NULL,
            category TEXT NOT NULL
        )
    ''')

    # جدول التقييمات بالنجوم لكل منتج
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            rating INTEGER NOT NULL,
            comment TEXT,
            customer_name TEXT,
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')

    # جدول الطلبات (مع حقل الحالة status لمتابعة الطلبات الجديدة والمكتملة)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_title TEXT,
            custom_name TEXT,
            quantity INTEGER,
            total_price REAL,
            delivery_method TEXT,
            payment_method TEXT,
            status TEXT DEFAULT 'pending'
        )
    ''')

    conn.commit()
    conn.close()


init_db()


# ضغط وتصغير الصور لسرعة التحميل
def save_and_compress_image(file):
    filename = f"{os.urandom(8).hex()}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    img = Image.open(file)
    img = img.convert('RGB')
    img.thumbnail((800, 800))  # تقليل الأبعاد
    img.save(filepath, 'JPEG', optimize=True, quality=80)

    return f"/static/uploads/{filename}"


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/admin')
def admin():
    return render_template('admin.html')


# API جلب قائمة المنتجات مع حساب متوسط التقييم وعدد النجوم لكل منتج
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, price, description, image, category FROM products ORDER BY id DESC')
    rows = cursor.fetchall()

    products = []
    for r in rows:
        pid = r[0]
        # حساب متوسط التقييم وعدد المقيمين للمنتج
        cursor.execute('SELECT AVG(rating), COUNT(id) FROM reviews WHERE product_id = ?', (pid,))
        rev_data = cursor.fetchone()
        avg_rating = round(rev_data[0], 1) if rev_data[0] else 0.0
        reviews_count = rev_data[1] if rev_data[1] else 0

        products.append({
            "id": pid,
            "title": r[1],
            "price": r[2],
            "description": r[3],
            "image": r[4],
            "category": r[5],
            "avg_rating": avg_rating,
            "reviews_count": reviews_count
        })

    conn.close()
    return jsonify(products)


# API إضافة منتج جديد
@app.route('/api/products', methods=['POST'])
def add_product():
    title = request.form.get('title')
    price = request.form.get('price')
    description = request.form.get('description', '')
    category = request.form.get('category', 'مبخرة')
    file = request.files.get('image')

    if not title or not price or not file:
        return jsonify({"success": False, "message": "البيانات غير مكتملة!"}), 400

    image_path = save_and_compress_image(file)

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO products (title, price, description, image, category) VALUES (?, ?, ?, ?, ?)',
                   (title, price, description, image_path, category))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "تم إضافة المنتج بنجاح!"})


# API حذف منتج
@app.route('/api/products/<int:pid>', methods=['DELETE'])
def delete_product(pid):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM products WHERE id = ?', (pid,))
    cursor.execute('DELETE FROM reviews WHERE product_id = ?', (pid,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "تم الحذف بنجاح"})


# API إضافة تقييم جديد للمنتج (من 1 إلى 5 نجوم)
@app.route('/api/reviews', methods=['POST'])
def add_review():
    data = request.json
    product_id = data.get('product_id')
    rating = data.get('rating')
    comment = data.get('comment', '')
    customer_name = data.get('customer_name', 'زائر')

    if not product_id or not rating:
        return jsonify({"success": False, "message": "البيانات غير مكتملة"}), 400

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO reviews (product_id, rating, comment, customer_name) VALUES (?, ?, ?, ?)',
                   (product_id, rating, comment, customer_name))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "تم إضافة تقييمك بنجاح!"})


# API حفظ الطلب الجديد
@app.route('/api/orders', methods=['POST'])
def save_order():
    data = request.json
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO orders (product_title, custom_name, quantity, total_price, delivery_method, payment_method, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ''', (
        data.get('product_title'),
        data.get('custom_name'),
        data.get('quantity'),
        data.get('total_price'),
        data.get('delivery_method'),
        data.get('payment_method')
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "تم تسجيل الطلب بنجاح"})


# API جلب الطلبات المعلقة فقط (للإشعارات الحمراء في لوحة التحكم)
@app.route('/api/orders/pending', methods=['GET'])
def get_pending_orders():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, product_title, custom_name, quantity, total_price, delivery_method, payment_method FROM orders WHERE status = "pending" ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()

    orders = [
        {
            "id": r[0],
            "product_title": r[1],
            "custom_name": r[2],
            "quantity": r[3],
            "total_price": r[4],
            "delivery_method": r[5],
            "payment_method": r[6]
        }
        for r in rows
    ]
    return jsonify(orders)


# API تحويل الطلب إلى مكتمل (تسليم) وإخفائه من القائمة المعلقة
@app.route('/api/orders/<int:order_id>/complete', methods=['POST'])
def complete_order(order_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE orders SET status = "completed" WHERE id = ?', (order_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "تم تسليم الطلب بنجاح"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)