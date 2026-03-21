require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Crear conexión a la Base de Datos
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Magna131071',
  database: process.env.DB_NAME || 'Nails_tryon',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Ruta para obtener todos los colores desde MySQL
app.get('/api/colors', async (req, res) => {
  try {
    // IMPORTANTE: Ajusta los nombres exactos de tus columnas después de "SELECT".
    // "AS productId", "AS colorName" y "AS hexCode" son los alias que requiere 
    // el Frontend de React para pintar correctamente los botones.
    // Ej: Si tu columna de ID se llama 'id_color', reemplázalo aquí por "id_color AS productId"
    const [rows] = await dbPool.query(`
      SELECT 
        idcolor AS productId,
        nombrecolor AS colorName,
        ExaColor AS hexCode
      FROM colores;
    `);

    res.json({
      success: true,
      data: rows // Devuelve los datos físicos de la base de datos
    });
  } catch (error) {
    console.error('Error al consultar Base de Datos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error de servidor interno intentando conectar a la Base de Datos. Revisa archivo .env y MySQL.'
    });
  }
});

// Probar conexión en el arranque
async function startServer() {
  try {
    const connection = await dbPool.getConnection();
    console.log(`✅ Base de datos ${process.env.DB_NAME} conectada correctamente.`);
    connection.release();

    app.listen(PORT, () => {
      console.log(`✅ Servidor Backend escuchando en el puerto ${PORT}`);
      console.log(`🔗 API Endpoint disponible en: http://localhost:${PORT}/api/colors`);
    });
  } catch (err) {
    console.error(`❌ NO se pudo conectar a MySQL: ${err.message}`);
    console.error('⚠️ Verifica si tu servicio de MySQL (Workbench) está encendido y el password es correcto en el archivo .env');
    process.exit(1);
  }
}

startServer();
