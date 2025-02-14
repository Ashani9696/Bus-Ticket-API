require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./configs/db');
const logger = require('./configs/logger');
const validateEnv = require('./utils/validateEnv');
const errorHandler = require('./middlewares/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const YAML = require('yamljs');

validateEnv();

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/bookingRoutes'));

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1', require('./routes/appRoute'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
