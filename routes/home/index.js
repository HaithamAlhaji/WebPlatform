const express = require("express"),
  form = require("express-form"),
  field = form.field,
  router = express.Router();

router.all("*", (req, res, next) => {
  res.app.locals.layout = "home/index";

  next();
});
router.get("/", (req, res) => {
  res.render("home/index", { title: global.__("home") });
});
router.get("*", (req, res) => {
  res.redirect("/");
});
module.exports = router;
