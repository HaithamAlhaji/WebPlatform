const express = require("express"),
  form = require("express-form"),
  field = form.field,
  router = express.Router();

router.all("*", (req, res, next) => {
  res.app.locals.layout = "index";

  next();
});
router.get("/", (req, res) => {
  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error(err);
      connection.release();
    }
    const sqlQuery = `
    select id,name,image from tbl_sponsors ORDER by id DESC limit 0,8;
    select id,name,image,position from tbl_instructors ORDER by id DESC limit 0,8;
    select id,title,image,DATE_FORMAT(\`datetime\`,'%Y-%m-%d') as \`datetime\` from tbl_events ORDER by id DESC limit 0,3;
    select image from tbl_gallery ORDER by id DESC limit 0,8;
    select id,question,answer from tbl_faq;
    select id,name,image,position,facebook,twitter,email,instagram from tbl_staff;
    select image from tbl_studio_images order by id desc limit 0,8;
      `;
    connection.query(sqlQuery, (errors, results, fields) => {
      if (errors) {
        console.error(errors);
        connection.release();
      }
      var sponsors = [];
      var instructors = [];
      var events = [];
      var gallery = [];
      var faq = [];
      var staff = [];
      var studioImages = [];
      if (results.length > 0) {
        sponsors = results[0];
        instructors = results[1];
        events = results[2];
        gallery = results[3];
        faq = results[4];
        staff = results[5];
        studioImages = results[6];
      }
      connection.release();
      res.render("home/index", {
        title: global.__("home"),
        sponsors: sponsors,
        instructors: instructors,
        events: events,
        gallery: gallery,
        faq: faq,
        staff: staff,
        studioImages: studioImages,
      });
    });
  });
});
router.get("*", (req, res) => {
  res.redirect("/");
});
module.exports = router;
