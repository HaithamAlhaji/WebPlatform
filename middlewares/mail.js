const nodemailer = require("nodemailer"),
  nodemailerHandlebars = require("nodemailer-express-handlebars");
var transport = nodemailer.createTransport({
  host: constants.email.server,
  port: constants.email.port,
  auth: {
    user: constants.email.auth.user,
    pass: constants.email.auth.password,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
const handlebarOptions = {
  viewEngine: {
    defaultLayout: "default_ar",
    extName: ".handlebars",
    layoutsDir: "./views/layouts/email",
    partialsDir: "./views/partials/email",
  },
  viewPath: "./views/email",
  extName: ".handlebars",
  helper: {},
};
const send = (options) => {
  return new Promise((resolve, regject) => {
    transport.use("compile", nodemailerHandlebars(handlebarOptions));

    transport.sendMail(options, function (error, info) {
      if (error) {
        console.log(error);
        resolve(error);
      } else {
        console.log("Email sent: " + info);
        resolve("Email sent: " + info);
      }
    });
  });
};
module.exports = {
  send: send,
};
