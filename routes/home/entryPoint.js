// Login - Register - Forget Password - Verification

const express = require("express"),
  form = require("express-form"),
  field = form.field,
  router = express.Router();

router.all("*", (req, res, next) => {
  res.app.locals.layout = "entryPoint";

  next();
});

router.get("/", (req, res) => {
  res.redirect("/entryPoint/login");
});
router.get("/login", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.userType == "2")
  ) {
    res.redirect("/dashboard");
    res.send("dashboard");
  } else {
    res.render("home/login", { title: global.__("login") });
  }
});
router.post(
  "/login",
  form(
    field("txtEmail").trim().required().isEmail(),
    field("txtPassword").trim().required()
  ),
  (req, res) => {
    if (req.form.isValid) {
      mysqlConnection.getConnection((err, connection) => {
        if (err) {
          res.render("home/login", {
            title: global.__("login"),
            error: err,
          });
          console.error(err);
          connection.release();
        }
        const sqlQuery =
          "select * from tbl_users where email = ? AND password = md5(?);";
        connection.query(
          sqlQuery,
          [req.body.txtEmail, req.body.txtPassword],
          (errors, results, fields) => {
            connection.release();
            if (errors) {
              res.render("home/login", {
                title: global.__("login"),
                error: errors,
              });
              console.error(errors);
              connection.release();
            }
            if (results.length > 0) {
              req.session.user = {};
              req.session.user.id = results[0].id;
              req.session.user.email = results[0].email;
              req.session.user.name_en = results[0].name_en;
              req.session.user.name_ar = results[0].name_ar;
              req.session.user.type = results[0].type;
              res.redirect("/dashboard");
            } else {
              console.error("bbbbbbbb");
              console.error("email or password is wrong");
              res.render("home/login", {
                title: "11111111111111111",
                error: "email or password is wrong",
              });
            }
          }
        );
      });
      // res.render("home/login", { title: global.__("login") });
    } else {
      console.error(req.form.errors);
      res.render("home/login", {
        title: global.__("login"),
        error: req.form.errors,
      });
    }
  }
);
router.get("/register", (req, res) => {
  res.render("home/register", {
    title: global.__("register_page"),
  });
});
router.post(
  "/register",
  form(
    field("txtEmail").trim().required().isEmail(),
    field("txtPassword").trim().required(),
    field("txtPasswordConfirmation").trim().required(),
    field("txtNameEn").trim().required()
  ),
  (req, res) => {
    if (req.form.isValid) {
      mysqlConnection.getConnection((err, connection) => {
        const sqlQuery =
          "insert into tbl_users (email,password,name_en) values (?,md5(?),?);select id,email,name_en,name_ar,type from tbl_users where email = ? and password = md5(?);";
        connection.query(
          sqlQuery,
          [
            req.body.txtEmail,
            req.body.txtPassword,
            req.body.txtNameEn,
            req.body.txtEmail,
            req.body.txtPassword,
          ],
          (errors, results, fields) => {
            console.log(sqlQuery);
            connection.release();
            if (errors) {
              console.error(errors);
              res.render("home/register", {
                title: global.__("regsiter"),
                error: errors,
              });
            } else {
              console.error(results[1][0]);
              req.session.user = {};
              req.session.user.id = results[1][0].id;
              req.session.user.email = results[1][0].email;
              req.session.user.name_en = results[1][0].name_en;
              req.session.user.name_ar = results[1][0].name_ar;
              req.session.user.type = results[1][0].type;
              console.error(req.session.user.type);
              res.redirect("/dashboard");
            }
          }
        );
      });
    } else {
      console.error(req.form.errors);
      res.render("home/login", {
        title: global.__("register"),
        error: req.form.errors,
      });
    }
  }
);
router.get("/forgetPassword", (req, res) => {
  res.send("forgetPassword");
});
router.get("/verification", (req, res) => {
  res.send("verification");
});

// router.get("*", (req, res) => {
//   res.redirect("/");
// });
module.exports = router;
