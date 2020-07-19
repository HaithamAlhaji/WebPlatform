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
    (req.session.user.type == "1" || req.session.user.userType == "2")
  ) {
    res.render("home/dashboard/index", {
      title: global.__("dashbaord"),
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
// router.get("*", (req, res) => {
//   res.redirect("/");
// });
module.exports = router;
