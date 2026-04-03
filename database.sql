-- Create database
CREATE DATABASE IF NOT EXISTS aurabrew_db;
USE aurabrew_db;

-- Drop tables if they exist to allow clean re-runs
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;

-- ==========================================
-- 1. Users Table
-- Stores user accounts, including admins and customers
-- ==========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Orders Table
-- Stores order metadata and status
-- ==========================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cod',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. Order Items Table
-- Stores the specific items within an order.
-- Note: We store the product details directly here because the menu 
-- is managed dynamically in the frontend code, not in the database.
-- ==========================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id VARCHAR(100) NOT NULL, -- String ID matching the frontend MENU_ITEMS
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Price at the time of purchase
    options TEXT, -- To store size and addons (e.g., "Medium, Whipped Cream")
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert sample users
INSERT INTO users (full_name, email, password_hash, phone, address, role) VALUES
('Admin User', 'admin@aurabrew.com', 'hashed_password_placeholder', '1234567890', '123 Coffee St, NY', 'admin'),
('John Doe', 'john@example.com', 'hashed_password_placeholder', '0987654321', '456 Milk Tea Ave, CA', 'customer');

-- Insert a sample order
INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES
(2, 13.75, 'pending', '456 Milk Tea Ave, CA');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, product_name, quantity, price, options) VALUES
(1, 'velvet-cap', 'Velvet Cappuccino', 1, 6.50, 'Medium'),
(1, 'golden-matcha', 'Golden Matcha', 1, 7.25, 'Large, Extra Shot');
