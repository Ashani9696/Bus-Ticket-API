const validateEnv = () => {
  const requiredEnv = ["MONGO_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET"];
  requiredEnv.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  });
};

module.exports = validateEnv;
