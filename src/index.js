require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser"); 
const cors = require("cors"); 
const connectDB = require("./configs/db");
const logger = require("./configs/logger");
const validateEnv = require("./utils/validateEnv");
const errorHandler = require("./middlewares/errorMiddleware");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


validateEnv();

connectDB();

const app = express();

app.use(express.json()); 
app.use(cookieParser()); 

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/operator', require('./routes/busOperatorRoutes'));
app.use('/api/commuter', require('./routes/commuterRoutes'));




app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
