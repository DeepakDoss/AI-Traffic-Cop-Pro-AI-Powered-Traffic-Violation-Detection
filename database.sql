-- Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'officer') DEFAULT 'officer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cameras Table
CREATE TABLE cameras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(100) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- Create Violations Table
CREATE TABLE violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_id INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    violation_type ENUM('helmet', 'seatbelt', 'overspeed') NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'verified', 'challan_issued') DEFAULT 'pending',
    FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
);
