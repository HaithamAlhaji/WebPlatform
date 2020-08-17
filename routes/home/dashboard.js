const express = require("express"),
  form = require("express-form"),
  field = form.field,
  router = express.Router();

router.all("*", (req, res, next) => {
  res.app.locals.layout = "dashboard";

  next();
});

router.get("/", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    res.redirect(
      `/dashboard/${req.session.user.type == "1" ? "profile" : "statistics"}`
    );
    // res.render("home/dashboard/index", {
    //   title: global.__("dashbaord"),
    // });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/profile", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/profile", {
              title: global.__("profile"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/profile", {
              title: global.__("profile"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/profile", {
              title: global.__("profile"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/events", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `
      SELECT 
        \`events\`.title AS \`event_title\`,
        COUNT(events_users.id) AS \`events_users_count\`
      FROM
        tbl_events \`events\`
      LEFT JOIN
        tbl_events_users events_users ON events_users.event_id = \`events\`.id
      GROUP BY
        \`events\`.title
      ORDER BY 
        \`events\`.id desc
      `;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/eventsManager", {
              title: global.__("events_manager"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/eventsManager", {
              title: global.__("events_manager"),
              events: results,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/eventsManager", {
              title: global.__("events_manager"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});

router.get("/events/add", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    req.session.user.type == "2"
  ) {
    res.render("home/dashboard/eventsManagerAdd", {
      title: global.__("event_add"),
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + "./../../public/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ".jpg");
  },
});
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};
var upload = multer({ storage: storage, fileFilter: imageFilter });

var uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "background", maxCount: 1 },
]);
router.post("/events/add", uploadFields, (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    req.session.user.type == "2"
  ) {
    //  req.files['image'][0] -> File
    //  req.files['background'][0] -> File
    const image = req.files["image"][0].path.split("\\").slice(-1)[0];
    const background = req.files["background"][0].path.split("\\").slice(-1)[0];
    const title = req.body.txtTitle;
    const datetime = req.body.txtDatetime;
    const isLive = req.body.isLive == "on";
    const isEnrollable = req.body.isEnrollable == "on";
    const isFinish = req.body.isFinish == "on";
    const liveUrl = req.body.txtLiveUrl;
    const userId = req.session.user.id;
    mysqlConnection.getConnection((err, connection) => {
      if (err) {
        console.error(err);
        res.render("home/dashboard/eventsManager", {
          title: global.__("events_manager"),
          errors: err,
        });
      } else {
        const sqlQuery = `INSERT INTO tbl_events (title, datetime, image, background, is_live, is_enrollable, is_finish, live_url, user_id) VALUES (?,?,?,?,?,?,?,?,?);`;
        connection.query(
          sqlQuery,
          [
            title,
            datetime,
            image,
            background,
            isLive,
            isEnrollable,
            isFinish,
            liveUrl,
            userId,
          ],
          (errors, results, fields) => {
            connection.release();
            if (errors) {
              console.error(errors);
              res.render("home/dashboard/eventsManager", {
                title: global.__("events_manager"),
                errors: errors,
              });
            }
            res.render("home/dashboard/eventsManager", {
              title: global.__("events_manager"),
              errors: global.__("event_add_done"),
            });
          }
        );
      }
    });
  } else {
    res.redirect("/403");
  }
});
router.get("/faq", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/faq", {
              title: global.__("faq"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/faq", {
              title: global.__("faq"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/faq", {
              title: global.__("faq"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/gallery", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/gallery", {
              title: global.__("gallery"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/gallery", {
              title: global.__("gallery"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/gallery", {
              title: global.__("gallery"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/settings", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/generalSettings", {
              title: global.__("general_settings"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/generalSettings", {
              title: global.__("general_settings"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/generalSettings", {
              title: global.__("general_settings"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/instructors", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/instructors", {
              title: global.__("instructors"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/instructors", {
              title: global.__("instructors"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/instructors", {
              title: global.__("instructors"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/sponsors", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/sponsors", {
              title: global.__("sponsors"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/sponsors", {
              title: global.__("sponsors"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/sponsors", {
              title: global.__("sponsors"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/staff", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/staff", {
              title: global.__("staff"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/staff", {
              title: global.__("staff"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/staff", {
              title: global.__("staff"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/statistics", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/statistics", {
              title: global.__("statistics"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/statistics", {
              title: global.__("statistics"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/statistics", {
              title: global.__("statistics"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/studio", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/studio", {
              title: global.__("studio"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/studio", {
              title: global.__("studio"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/studio", {
              title: global.__("studio"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/users", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `SELECT id, email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?;`;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/usersManager", {
              title: global.__("users_manager"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/usersManager", {
              title: global.__("users_manager"),
              userId: results[0].id,
              txtEmail: results[0].email,
              txtNameEn: results[0].name_en,
              txtNameAr: results[0].name_ar,
              txtPhone: results[0].phone,
              txtBirthday: results[0].birthday,
              txtDiscipline: results[0].discipline,
              txtAcademicAchievement: results[0].academic_achievement,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/usersManager", {
              title: global.__("users_manager"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/certificationsWall", (req, res) => {
  if (
    req.session.user != undefined &&
    req.session.user.email &&
    req.session.user.email != "NONE" &&
    (req.session.user.type == "1" || req.session.user.type == "2")
  ) {
    mysqlConnection.getConnection((err, connection) => {
      const sqlQuery = `
      SELECT
      \`events\`.id AS \`event_id\`,
      \`events\`.title AS \`event_title\`,
      DATE_FORMAT(\`events\`.datetime,'%Y-%m-%d') AS \`event_datetime\`, events_certifications_templates.title AS \`events_certifications_template_title\`
      FROM
      tbl_events_users events_users
      LEFT JOIN
      tbl_events_certifications_templates events_certifications_templates ON events_certifications_templates.event_id = events_users.event_id
      LEFT JOIN tbl_events \`events\` ON \`events\`.id = events_users.event_id
      WHERE
      events_certifications_templates.event_id IS NOT NULL AND
      events_users.user_id = ?
      ORDER BY event_datetime desc;
      `;
      connection.query(
        sqlQuery,
        [req.session.user.id],
        (errors, results, fields) => {
          connection.release();
          if (errors) {
            console.error(errors);
            res.render("home/dashboard/certificationsWall", {
              title: global.__("certifications_wall"),
              error: errors,
            });
          }
          if (results.length > 0) {
            res.render("home/dashboard/certificationsWall", {
              title: global.__("certifications_wall"),
              certifications: results,
            });
          } else {
            console.error(errors);
            res.render("home/dashboard/certificationsWall", {
              title: global.__("certifications_wall"),
              error: "NO user has been found",
            });
          }
        }
      );
    });
  } else {
    res.redirect("/entryPoint/login");
  }
});
router.get("/logout", (req, res) => {
  //Logging out
  req.session.user = {};
  req.session.user.email = "NONE";
  req.session.user.name_en = "NONE";
  req.session.user.name_ar = "NONE";
  req.session.user.type = "0";

  res.locals.email = "NONE";
  res.locals.name_en = "NONE";
  res.locals.name_ar = "NONE";
  res.redirect("/");
});
router.post(
  "/profile/update",
  form(
    // field("txtEmail").trim().required().isEmail(),
    field("txtNameEn").trim().required(),
    field("txtNameAr").trim().required(),
    field("txtPassword").trim().required(),
    field("txtPhone").trim().required(),
    field("txtBirthday").trim().required(),
    field("txtDiscipline").trim().required(),
    field("txtAcademicAchievement").trim().required()
  ),
  (req, res) => {
    if (req.form.isValid) {
      mysqlConnection.getConnection((err, connection) => {
        const sqlQuery = `
        update tbl_users
        set password = md5(?), name_en = ?, name_ar = ?, phone = ?, birthday = ?, discipline = ?, academic_achievement = ?
        where id = ?;
        SELECT email, name_en, name_ar, phone, date_format(birthday,'%Y-%m-%d') as birthday, discipline, academic_achievement FROM tbl_users WHERE id = ?
        `;
        connection.query(
          sqlQuery,
          [
            req.body.txtPassword,
            req.body.txtNameEn,
            req.body.txtNameAr,
            req.body.txtPhone,
            req.body.txtBirthday,
            req.body.txtDiscipline,
            req.body.txtAcademicAchievement,
            req.session.user.id,
            req.session.user.id,
          ],
          (errors, results, fields) => {
            connection.release();
            if (errors) {
              console.error(errors);
              res.render("home/dashboard/profile", {
                title: global.__("profile"),
                errors: errors,
              });
            }
            res.redirect("/dashboard/profile");
          }
        );
      });
    } else {
      console.error(req.form.errors);
      res.render("home/dashboard/profile", {
        title: global.__("profile"),
        error: req.form.errors,
      });
    }
  }
);

// router.get("*", (req, res) => {
//   res.redirect("/");
// });
module.exports = router;
