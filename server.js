// Core Dependencies
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';

// Routes
import routes from './src/routes/index.js';
import { swaggerUi, swaggerSpec } from './src/config/swagger.js';


// ENV Variables
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || '/api/v1';

// App Initialization and Middlewares
const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(API_BASE, routes);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// SERVER CONFIGURATION
app.listen(PORT, () => {
    // make a clickable link in console
    console.log(`Server is running on http://localhost:${PORT}${API_BASE}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/swagger`);
});

export default app;