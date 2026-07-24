import os
import sqlite3
from flask import Flask, render_template, request, jsonify
from PIL import Image

app = Flask(__name__)

# مجلد رفع الصور
UPLOAD_FOLDER = os.path.join('static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# تهيئة قاعدة البيانات SQLite تلقائياً مع حقل الفئة (category)
def init_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
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


# API جلب قائمة المنتجات (متضمنة الفئة)
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, price, description, image, category FROM products ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()

    products = [
        {
            "id": r[0],
            "title": r[1],
            "price": r[2],
            "description": r[3],
            "image": r[4],
            "category": r[5]
        }
        for r in rows
    ]
    return jsonify(products)


# API إضافة منتج جديد مع استقبال الفئة
@app.route('/api/products', methods=['POST'])
def add_product():
    title = request.form.get('title')
    price = request.form.get('price')
    description = request.form.get('description', '')
    category = request.form.get('category', 'مبخرة')  # استقبال الفئة (افتراضياً مبخرة في حال لم تُحدد)
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
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "تم الحذف بنجاح"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)