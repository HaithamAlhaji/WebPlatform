const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  express: {
    port: process.env.express_port,
    secret: process.env.express_server_session_secret,
  },
  mysql: {
    host: process.env.mysql_host,
    username: process.env.mysql_username,
    password: process.env.mysql_password,
    database: process.env.mysql_database,
  },
  app: {
    description: "IALD Platform",
    keywords: "IALD Platform",
    author: "Haitham Alhaji",
    image: "website_img.png",
  },
};
