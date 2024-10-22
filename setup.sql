CREATE DATABASE gps_backend;

USE gps_backend;

CREATE TABLE vehicles (
    id      CHAR(36) PRIMARY KEY,
    secret  CHAR(60) NOT NULL
);

INSERT INTO vehicles (id, secret) VALUES
    ('your_id', 'your_secret')
    ;

