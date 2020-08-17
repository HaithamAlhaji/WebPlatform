// Login - Register - Forget Password - Verification

const express = require("express"),
  form = require("express-form"),
  field = form.field,
  router = express.Router(),
  nodemailer = require("nodemailer"),
  nodemailerHandlebars = require("nodemailer-express-handlebars");

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
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    res.redirect("/dashboard");
    // res.send("dashboard");
  } else {
    // display message for who come from event to download certification
    const userEventId = req.session.user.eventId;

    if (userEventId != undefined) {
      mysqlConnection.getConnection((err, connection) => {
        if (err) {
          connection.release();
          console.log(err);
          res.render("home/login", {
            title: global.__("login"),
            error: err,
          });
        }
        const sqlQuery = `SELECT title from tbl_events where id = ?;`;
        connection.query(sqlQuery, [userEventId], (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.log(errors);
            res.render("home/login", {
              title: global.__("login"),
              error: errors,
            });
          }
          const eventTitle = results[0].title;
          res.render("home/login", {
            title: global.__("login"),
            caption: global.__(
              req.session.user.requestType == 0
                ? "enroll_in_event"
                : "download_event_certifcation"
            ),
            eventTitle: eventTitle,
          });
        });
      });
    } else {
      // normal login without any parameters
      res.render("home/login", {
        title: global.__("login"),
      });
    }
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
              console.error(errors);
              connection.release();
              res.render("home/login", {
                title: global.__("login"),
                error: errors,
              });
            }
            if (results.length > 0) {
              const userEventId = req.session.user.eventId; // login for downloading a specific certification
              const userRequestType = req.session.user.requestType;
              req.session.user = {};
              req.session.user.id = results[0].id;
              req.session.user.email = results[0].email;
              req.session.user.name_en = results[0].name_en;
              req.session.user.name_ar = results[0].name_ar;
              req.session.user.type = results[0].type;
              req.session.user.requestType = userRequestType;
              if (userEventId != undefined) {
                // login for downloading a specific certification or enroll
                console.log(req.session.user.type.requestType);
                res.redirect(
                  `/event/${userEventId}/${
                    userRequestType == 0 ? "enroll" : "certification"
                  }`
                );
              } else {
                res.redirect("/dashboard");
              }
            } else {
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
  console.log(req.session.user.requestType);
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
        const eventId = req.session.user.eventId;
        const userRequestType = req.session.user.requestType;

        const enrollingInEvent = `insert INTO tbl_events_users (event_id,user_id) SELECT ${eventId},LAST_INSERT_ID() FROM tbl_events WHERE id = 1 AND is_enrollable = 1;`;

        const sqlQuery = `insert into tbl_users (email,password,name_en) values (?,md5(?),?); ${
          req.session.user.requestType == 1 ? enrollingInEvent : ""
        } select id,email,name_en,name_ar,type from tbl_users where email = ? and password = md5(?);`;
        console.log(sqlQuery);
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
            connection.release();
            if (errors) {
              console.error(errors);
              res.render("home/register", {
                title: global.__("regsiter"),
                error: errors,
              });
            } else {
              const index = userRequestType == 1 ? 2 : 1; // 3 queries
              console.log(index);
              req.session.user = {};
              req.session.user.id = results[index][0].id;
              req.session.user.email = results[index][0].email;
              req.session.user.name_en = results[index][0].name_en;
              req.session.user.name_ar = results[index][0].name_ar;
              req.session.user.type = results[index][0].type;
              req.session.user.eventId = eventId;
              req.session.user.requestType = userRequestType;

              if (eventId != undefined) {
                console.log(
                  `/event/${eventId}/${
                    userRequestType == 0 ? "enroll" : "certification"
                  }`
                );
                res.redirect(
                  `/event/${eventId}/${
                    userRequestType == 0 ? "enroll" : "certification"
                  }`
                );
              } else {
                res.redirect("/dashboard");
              }
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
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    res.redirect("/entryPoint");
  } else {
    res.render("home/forgetPassword", {
      title: global.__("forget_password"),
    });
  }
});
router.post(
  "/forgetPassword",
  form(field("txtEmail").trim().required().isEmail()),
  (req, res) => {
    if (req.form.isValid) {
      mysqlConnection.getConnection((err, connection) => {
        if (err) {
        } else {
          const sqlQuery = `
          INSERT INTO tbl_users_forget_password (user_id) SELECT id FROM tbl_users WHERE email = ?;
          SELECT \`uuid\` FROM tbl_users_forget_password WHERE user_id = (SELECT id FROM tbl_users WHERE email = ?) AND is_used = 0 ORDER BY id DESC LIMIT 0,1;;
          `;
          connection.query(
            sqlQuery,
            [req.body.txtEmail, req.body.txtEmail],
            (errors, results, fields) => {
              connection.release();
              if (errors) {
                console.log(errors);
                res.render("home/forgetPassword", {
                  title: global.__("forget_password"),
                  errors: errors,
                });
              } else {
                if (results[1].length > 0) {
                  const uuid = results[1][0].uuid;

                  const mailOptions = {
                    from: `${defaultConfig.website_name} <${constants.email.auth.user}>`,
                    to: req.body.txtEmail,
                    subject: global.__("reset_password"),
                    text: "text text text text text",
                    template: "forgetPassword",
                    context: {
                      default: function (name) {
                        return global.defaultConfig[name];
                      },
                      texts: function (name) {
                        return global.__(name);
                      },
                      websiteTitleTwo: "",
                      websiteTitleThree: "",
                      forgetPasswordUrl:
                        global.defaultConfig.website_url +
                        "/entryPoint/resetPassword/" +
                        uuid,
                    },
                  };
                  mail.send(mailOptions).then((msg) => {});
                  // email has been sent
                  res.render("home/forgetPassword", {
                    title: global.__("forget_password"),
                    errors: "forget_password_sent",
                  });
                } else {
                  // no email found
                  res.render("home/forgetPassword", {
                    title: global.__("forget_password"),
                    errors: "email_not_found",
                  });
                }
              }
            }
          );
        }
      });
    }
  }
);
router.get(
  "/resetPassword/:uuid([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})",
  (req, res) => {
    const uuid = req.params.uuid;
    mysqlConnection.getConnection((err, connection) => {
      if (err) {
        console.error(err);
      } else {
        const sqlQuery = `
        SELECT 
          users.id AS\`user_id\`,
          users.email AS \`user_email\`,
          users.name_en AS \`user_name_en\`,
          users.name_ar AS \`user_name_ar\`
        FROM
          tbl_users_forget_password users_forget_password
        LEFT JOIN
          tbl_users users ON users.id = users_forget_password.user_id
        WHERE
          users_forget_password.\`uuid\` = ? and
          users_forget_password.is_used != '1'
        ORDER BY users_forget_password.id desc
        LIMIT 0,1
        `;
        connection.query(sqlQuery, [uuid], (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.log(errors);
            res.redirect("/entryPoint/forgetPassword/" + uuid);
          } else {
            if (results.length == 0) {
              console.log("no uuid is found");
              res.redirect("/entryPoint/forgetPassword/" + uuid);
            } else {
              req.session.resetPassword = {};
              req.session.resetPassword.user = {};
              req.session.resetPassword.user.id = results[0].user_id;
              req.session.resetPassword.user.email = results[0].user_email;
              req.session.resetPassword.user.nameEn = results[0].user_name_en;
              req.session.resetPassword.user.nameAr = results[0].user_name_ar;

              res.render("home/resetPassword", {
                title: global.__("reset_password"),
              });
            }
          }
        });
      }
    });
  }
);
router.post(
  "/resetPassword",
  form(
    field("txtPassword").trim().required(),
    field("txtPasswordConfirmation").trim().required()
  ),
  (req, res) => {
    if (req.form.isValid && req.session.resetPassword != undefined) {
      const txtPassword = req.body.txtPassword;
      mysqlConnection.getConnection((err, connection) => {
        const sqlQuery = `
        UPDATE tbl_users SET \`password\` = MD5(?) WHERE id = ?
        `;
        connection.query(
          sqlQuery,
          [txtPassword, req.session.resetPassword.user.id],
          (errors, results, fields) => {
            if (errors) {
              console.log(errors);
              res.render("home/resetPassword", {
                title: global.__("resetPassword"),
                errors: errors,
              });
            } else {
              req.session.resetPassword = undefined;
              res.redirect("/entryPoint/login");
            }
          }
        );
      });
    } else {
      // return to same page
    }
  }
);
router.get("/verification", (req, res) => {
  res.send("verification");
});

// router.get("*", (req, res) => {
//   res.redirect("/");
// });
module.exports = router;
