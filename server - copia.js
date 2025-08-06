// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Si querés servir una build de React en producción:
// (descomenta este bloque y asegurate de tener tu carpeta 'build' al lado de server.js)
/*
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}
*/

// Ruta de prueba (GET /) para chequear que el server está arriba
app.get('/', (req, res) => {
  res.send('🚀 Backend de MercadoPago corriendo');
});

// Inicializá el cliente con tu access token
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// Ruta para crear preferencia de pago
app.post('/create_preference', async (req, res) => {
  try {
    const preferenceData = {
      ...req.body,
      back_urls: {
        success: process.env.URL_SUCCESS,
        failure: process.env.URL_FAILURE,
        pending: process.env.URL_PENDING
      },
      auto_return: 'approved'
    };

    const preference = new Preference(client);
    const response = await preference.create({ body: preferenceData });
    return res.json({ init_point: response.body.init_point });
  } catch (error) {
    console.error('Error creando preferencia:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Webhook para notificaciones de MercadoPago
app.post('/webhook/mp', (req, res) => {
  const topic = req.query.topic;
  const id = req.query.id || req.body.data?.id;
  console.log(`Notificación MP — topic: ${topic}, id: ${id}`);
  res.sendStatus(200);
});

// Levantá el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor MP corriendo en http://localhost:${PORT}`);
});
