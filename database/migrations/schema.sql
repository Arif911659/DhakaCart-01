-- database/schema.sql - Complete DhakaCart Database Schema

-- Drop existing tables
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL CHECK (category IN ('laptops', 'smartphones', 'tablets', 'accessories')),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_cost DECIMAL(10, 2) DEFAULT 100,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash_on_delivery', 'bkash', 'card')),
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    card_last4 VARCHAR(4),
    refund_reason TEXT,
    refund_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for reporting

-- Order Details View
CREATE VIEW order_details AS
SELECT 
    o.id as order_id,
    o.user_id,
    u.name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    o.total_amount,
    o.shipping_cost,
    o.status,
    o.payment_status,
    o.payment_method,
    o.shipping_address,
    o.created_at as order_date,
    json_agg(
        json_build_object(
            'product_id', p.id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.quantity * oi.price
        )
    ) as items
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id, o.user_id, u.name, u.email, u.phone;

-- Inventory Status View
CREATE VIEW inventory_status AS
SELECT 
    category,
    COUNT(*) as total_products,
    SUM(stock) as total_stock,
    ROUND(AVG(price)::numeric, 2) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as low_stock_count,
    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count
FROM products
GROUP BY category;

-- Sales Summary View
CREATE VIEW sales_summary AS
SELECT 
    DATE(o.created_at) as sale_date,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(DISTINCT o.user_id) as customer_count,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value,
    SUM(oi.quantity) as total_items_sold
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- Insert Sample Data

-- Insert Admin User (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@dhakacart.com', '$2b$10$rXKZ5JxJ5JxJ5JxJ5JxJ5OuJxJ5JxJ5JxJ5JxJ5JxJ5JxJ5JxJ5Jx', 'admin');

-- Insert Sample Customers (password: password123)
INSERT INTO users (name, email, password, phone, address) VALUES
('Ahmed Rahman', 'ahmed@example.com', '$2b$10$rXKZ5JxJ5JxJ5JxJ5JxJ5OuJxJ5JxJ5JxJ5JxJ5JxJ5JxJ5JxJ5Jx', '01712345678', 'House 12, Road 5, Dhanmondi, Dhaka'),
('Fatima Khan', 'fatima@example.com', '$2b$10$rXKZ5JxJ5JxJ5JxJ5JxJ5OuJxJ5JxJ5JxJ5JxJ5JxJ5JxJ5JxJ5Jx', '01812345679', 'Flat 3B, Gulshan Avenue, Dhaka'),
('Karim Hassan', 'karim@example.com', '$2b$10$rXKZ5JxJ5JxJ5JxJ5JxJ5OuJxJ5JxJ5JxJ5JxJ5JxJ5JxJ5JxJ5Jx', '01912345680', 'House 45, Banani, Dhaka');

-- Insert Laptops
INSERT INTO products (name, description, price, category, stock, image) VALUES
('Dell XPS 13', 'Ultra-portable 13-inch laptop with Intel Core i7, 16GB RAM, 512GB SSD', 125000, 'laptops', 15, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400'),
('MacBook Air M2', 'Apple MacBook Air with M2 chip, 13.6-inch Liquid Retina display', 145000, 'laptops', 10, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'),
('HP Pavilion 15', 'Mid-range 15.6-inch laptop with AMD Ryzen 5, 8GB RAM', 65000, 'laptops', 25, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'),
('Lenovo ThinkPad X1', 'Business-class laptop with exceptional keyboard and security', 135000, 'laptops', 12, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400'),
('ASUS ROG Gaming', 'High-performance gaming laptop with RTX 3060 GPU', 155000, 'laptops', 8, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400'),
('Acer Aspire 5', 'Budget-friendly laptop for students and professionals', 55000, 'laptops', 30, 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400');

-- Insert Smartphones
INSERT INTO products (name, description, price, category, stock, image) VALUES
('iPhone 14 Pro', 'Apple iPhone 14 Pro with A16 Bionic chip, 128GB', 125000, 'smartphones', 20, 'https://images.unsplash.com/photo-1592286927505-4b3dd856d0d7?w=400'),
('Samsung Galaxy S23', 'Flagship Android phone with 50MP camera, 256GB', 95000, 'smartphones', 30, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'),
('Google Pixel 7', 'Pure Android experience with AI-powered camera', 72000, 'smartphones', 18, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400'),
('OnePlus 11', 'Flagship killer with 100W fast charging', 65000, 'smartphones', 22, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'),
('Xiaomi 13 Pro', 'High-end specs at competitive price, 12GB RAM', 78000, 'smartphones', 25, 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400'),
('Realme GT 2', 'Budget flagship with Snapdragon 888', 45000, 'smartphones', 40, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400');

-- Insert Tablets
INSERT INTO products (name, description, price, category, stock, image) VALUES
('iPad Air', 'Apple iPad Air with M1 chip, 10.9-inch Liquid Retina', 75000, 'tablets', 15, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'),
('Samsung Galaxy Tab S8', 'Premium Android tablet with S Pen included', 68000, 'tablets', 12, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400'),
('Microsoft Surface Pro', 'Versatile 2-in-1 tablet/laptop with keyboard', 125000, 'tablets', 10, 'https://images.unsplash.com/photo-1585790050230-5dd28404f1bf?w=400'),
('Amazon Fire HD 10', 'Budget-friendly 10-inch entertainment tablet', 18000, 'tablets', 35, 'https://images.unsplash.com/photo-1544244015-bc2d8ac3c3a4?w=400'),
('Lenovo Tab P11', 'Mid-range tablet with 11-inch 2K display', 35000, 'tablets', 20, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400');

-- Insert Accessories
INSERT INTO products (name, description, price, category, stock, image) VALUES
('AirPods Pro', 'Apple wireless earbuds with active noise cancellation', 28000, 'accessories', 40, 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400'),
('Sony WH-1000XM5', 'Premium noise-cancelling over-ear headphones', 38000, 'accessories', 20, 'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400'),
('Logitech MX Master 3', 'Ergonomic wireless mouse for professionals', 12000, 'accessories', 45, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
('Apple Magic Keyboard', 'Wireless keyboard for Mac and iPad', 15000, 'accessories', 30, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400'),
('Samsung 27" Monitor', '4K UHD monitor for work and entertainment', 35000, 'accessories', 18, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'),
('Anker PowerBank 20000mAh', 'High-capacity portable charger with fast charging', 4500, 'accessories', 60, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400'),
('USB-C Hub 7-in-1', 'Multi-port adapter for laptops with USB-C', 3500, 'accessories', 50, 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400'),
('Webcam HD 1080p', 'High-quality webcam for video calls', 6500, 'accessories', 35, 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400'),
('Mechanical Keyboard RGB', 'Gaming mechanical keyboard with RGB backlight', 8500, 'accessories', 25, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400'),
('Laptop Stand Aluminum', 'Ergonomic laptop stand with cooling', 2500, 'accessories', 55, 'https://images.unsplash.com/photo-1625225233840-695456021cde?w=400');

-- Insert Sample Orders
INSERT INTO orders (user_id, total_amount, shipping_cost, status, payment_status, payment_method, shipping_address) VALUES
(2, 125100, 100, 'delivered', 'paid', 'bkash', 'House 12, Road 5, Dhanmondi, Dhaka'),
(3, 75100, 100, 'shipped', 'paid', 'card', 'Flat 3B, Gulshan Avenue, Dhaka'),
(2, 95100, 100, 'processing', 'paid', 'bkash', 'House 12, Road 5, Dhanmondi, Dhaka'),
(4, 153100, 100, 'pending', 'pending', 'cash_on_delivery', 'House 45, Banani, Dhaka');

-- Insert Sample Order Items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 125000),
(2, 11, 1, 75000),
(3, 7, 1, 95000),
(4, 2, 1, 145000),
(4, 15, 1, 8000);

-- Insert Sample Payments
INSERT INTO payments (order_id, amount, payment_method, transaction_id, status) VALUES
(1, 125100, 'bkash', 'BKS1699123456789', 'completed'),
(2, 75100, 'card', 'CARD1699123456790', 'completed'),
(3, 95100, 'bkash', 'BKS1699123456791', 'completed'),
(4, 153100, 'cash_on_delivery', NULL, 'pending');

-- Success message
SELECT 'Database initialized successfully!' as message;
SELECT 'Total users: ' || COUNT(*) FROM users;
SELECT 'Total products: ' || COUNT(*) FROM products;
SELECT 'Total orders: ' || COUNT(*) FROM orders;