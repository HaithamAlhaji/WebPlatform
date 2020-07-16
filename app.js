const constants = require("./config/constants"),
  express = require("express"),
  expressHandlebars = require("express-handlebars"),
  path = require("path"),
  cookieParser = require("cookie-parser"),
  i18n = require("i18n"),
  expressSession = require("express-session"),
  flash = require("connect-flash"),
  mysql = require("mysql"),
  bodyParser = require("body-parser"),
  favicon = require("serve-favicon");

global.constants = constants;

global.defaultConfig = {
  style: "theEvent",
  website_language: "ar",
};

const admin = require("./routes/admin/index");
const home = require("./routes/home/index");
const entryPoint = require("./routes/home/entryPoint");
const dashboard = require("./routes/home/dashboard");

//
const app = express();

//
const mysqlConnection = mysql.createPool({
  host: constants.mysql.host,
  user: constants.mysql.username,
  password: constants.mysql.password,
  database: constants.mysql.database,
  multipleStatements: true,
});
mysqlConnection.getConnection((err, connection) => {
  connection;
  connection.query("select 1;", (errors, results, fields) => {
    if (errors) {
      throw errors;
    } else {
    }
  });
  connection.release();
});
global.mysqlConnection = mysqlConnection;
// Global config initialization
mysqlConnection.getConnection((err, connection) => {
  connection.query("SELECT * FROM tbl_config;", (errors, results, fields) => {
    if (errors) {
      console.error(
        "database connection error:" + errors.code + "\n" + errors.message
      );
      connection.release();
    } else {
      for (let index = 0; index < results.length; index++) {
        global.defaultConfig[results[index]["name"]] = results[index]["value"];
      }
      connection.release();
      global.defaultConfig.app_description = constants.app.description;
      global.defaultConfig.app_keywords = constants.app.keywords;
      global.defaultConfig.app_author = constants.app.author;
      global.defaultConfig.app_image = constants.app.image;
      app.emit("ready");
    }
  });
});

//
app.set("view engine", "handlebars");
app.engine(
  "handlebars",
  expressHandlebars({
    defaultLayout: "home/index",
    helpers: {
      default: function (name) {
        return global.defaultConfig[name];
      },
      ifEquals: function (arg1, arg2, options) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
      },
      texts: function (name) {
        return __(name);
      },
      getLocale: function () {
        return getLocale();
      },
    },
  })
);
// Server Using
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public/img/favicon.png")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  expressSession({
    secret: constants.express.secret,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(cookieParser(constants.express.secret));

// Start Application
app.on("ready", () => {
  // Multilingual
  i18n.configure({
    locales: ["ar", "en"],
    directory: path.join(__dirname, "public", "/lang"),
    queryParameter: "lang",
    register: global,
    defaultLocale: global.defaultConfig.website_language || "ar",
    cookie: "i18n",
  });
  app.use((req, res, next) => {
    var lang = global.defaultConfig.website_language;
    if (req.query.lang == "" || req.query.lang == undefined) {
      if (req.session.lang == "" || req.session.lang == undefined) {
        if (req.cookies.lang == "" || req.cookies.lang == undefined) {
          lang = global.defaultConfig.website_language;
        } else {
          lang = req.cookies.lang;
          req.session.lang = lang;
        }
      } else {
        lang = req.session.lang;
      }
    } else {
      lang = req.query.lang;
      req.session.lang = lang;
      req.cookies.lang = lang;
    }

    i18n.setLocale(lang);
    // // if (req.query.lang == "" || req.query.lang == undefined) {
    // //   //res.redirect("/");
    // //   res.set("Location", "/");
    // //   next();
    // // } else {
    // //   next();
    // // }

    // checking user if logined
    if (req.session.user === undefined) {
      req.session.user = {};
      req.session.user.email = "NONE";
      req.session.user.name_en = "NONE";
      req.session.user.name_ar = "NONE";
      req.session.user.type = "0";
    }
    console.log(req.session.user.type);
    res.locals.isLoggedIn = (
      req.session.user.type.toString() != "0"
    ).toString();
    res.locals.isAdmin = (req.session.user.type == 2).toString();
    res.locals.email = req.session.user.email;
    res.locals.name_en = req.session.user.name_en;
    res.locals.name_ar = req.session.user.name_ar;

    next();
  });
  app.use("/entryPoint", entryPoint);
  app.use("/dashboard", dashboard);
  app.use("/admin", admin);
  app.use("/", home);

  // Start Listening
  app.listen(constants.express.port, () => {
    console.info("Server is started");
  });
});
