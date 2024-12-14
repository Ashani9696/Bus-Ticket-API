const { createLogger, transports, format } = require("winston");

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.Console({ format: format.simple() }),
  ],
});

module.exports = logger;
