import mysql from 'mysql2';
import { CONFIG } from '../bootstrap/envLoader.js';

const db = mysql.createConnection({
    host: CONFIG.DB_HOST,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_NAME,
});


db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL');
  }
});

const getVehicleById = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM vehicles WHERE id = ?', [id], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};
export { getVehicleById };