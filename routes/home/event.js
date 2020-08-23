const express = require("express"),
  form = require("express-form"),
  field = form.field,
  router = express.Router();

router.all("*", (req, res, next) => {
  res.app.locals.layout = "event";
  next();
});

router.get("/", (req, res) => {
  res.redirect("/");
});
router.get("/:id([0-9]+)", (req, res) => {
  const userAgent = req.get("User-Agent");
  // if (userAgent.includes("Instagram")) {
  //   res.setHeader("Content-type", "application/pdf");
  //   res.setHeader("Content-Disposition", "inline; filename= blablabla");
  //   res.setHeader("Content-Transfer-Encoding", "binary");
  //   res.setHeader("Accept-Ranges", "bytes");
  //   res.status(200).end();
  //   return;
  // }
  const id = req.params.id;
  mysqlConnection.getConnection((err, connection) => {
    const sqlQuery = `
    SELECT id,title,DATE_FORMAT(\`datetime\`,'%Y-%m-%d %H:%i:%s') as \`datetime\`, datetime as \`datetime_timestamp\`,image,is_live,is_enrollable,is_finish,live_url,ifnull(background,'') as \`background\` from tbl_events where id = ?;
    SELECT sponsors.id,sponsors.name, sponsors.image FROM tbl_events_sponsors events_sponsors LEFT JOIN  tbl_sponsors sponsors ON sponsors.id = events_sponsors.sponsor_id WHERE events_sponsors.event_id = ?;
    SELECT instructors.id,instructors.name, instructors.image FROM tbl_events_instructors events_instructors LEFT JOIN tbl_instructors instructors ON instructors.id = events_instructors.instructor_id WHERE events_instructors.event_id = ?;
    select id,image from tbl_studio_images order by id desc limit 0,8;
    select id,title,image,DATE_FORMAT(\`datetime\`,'%Y-%m-%d') as \`datetime\` from tbl_events ORDER by id DESC limit 0,3;
    select id,image from tbl_gallery ORDER by id DESC limit 0,8;
    select id,question,answer from tbl_faq;
    select id,name,image,position,facebook,twitter,email,instagram from tbl_staff;
    SELECT COUNT(*) AS \`user_is_enrolled\` FROM tbl_events_users WHERE user_id = ? AND event_id = ?;
    `;
    connection.query(
      sqlQuery,
      [id, id, id, req.session.user.id, id],
      (errors, results, fields) => {
        var event = results[0][0];
        var sponsors = results[1];
        var instructors = results[2];
        var studioImages = results[3];
        var events = results[4];
        var gallery = results[5];
        var faq = results[6];
        var staff = results[7];
        var userIsEnrolled = results[8][0].user_is_enrolled;

        connection.release();
        res.render("home/event", {
          title: event.title,
          image: event.image,
          event: event,
          sponsors: sponsors,
          instructors: instructors,
          studioImages: studioImages,
          events: events,
          gallery: gallery,
          faq: faq,
          staff: staff,
          userIsEnrolled: userIsEnrolled,
        });
      }
    );
  });
});
router.get("/:id([0-9]+)/certification", (req, res) => {
  const eventId = req.params.id;

  // user logged in before
  if (req.session.user.type.toString() != "0") {
    // check is user enrolled before
    mysqlConnection.getConnection((err, connection) => {
      if (err) {
        console.log(err);
        connection.release();
        res.send(err);
      }

      const sqlQuery = `
      SELECT COUNT(*) AS \`user_is_enrolled\` FROM tbl_events_users WHERE user_id = ? AND event_id = ?;
      `;
      connection.query(
        sqlQuery,
        [req.session.user.id, eventId],
        (errors, results, fields) => {
          const isUserEnrolled = results[0].user_is_enrolled;
          if (errors) {
            connection.release();
            console.log(errors);
            res.send(errors);
          }
          if (isUserEnrolled) {
            // download
            req.session.user.eventId = undefined;
            const sqlCertification = `
            INSERT INTO tbl_events_users_certifications (event_id,user_id,credential) values (?,?,UUID());
            SELECT credential,DATE_FORMAT(creation,'%Y-%m-%d') as creation FROM tbl_events_users_certifications WHERE id = LAST_INSERT_ID();
            SELECT title, datetime FROM tbl_events WHERE id = ?;
            SELECT id,title,template,name_x,name_y,name_width,date_x,date_y,credential_x,credential_y,creation FROM tbl_events_certifications_templates WHERE event_id = ? ORDER BY id ASC LIMIT 0,1;
            `;
            connection.query(
              sqlCertification,
              [eventId, req.session.user.id, eventId, eventId],
              (errors, results, fields) => {
                connection.release();
                if (errors) {
                  console.log(errors);
                  res.send(errors);
                }

                const credential = results[1][0].credential;
                const credentialCreation = results[1][0].creation;
                const eventTitle = results[2][0].title;
                const eventDatetime = results[2][0].datetime;
                const eventTemplate = results[3][0].template;
                const eventTemplateTitle = results[3][0].title;
                const eventTemplateNameX = results[3][0].name_x;
                const eventTemplateNameY = results[3][0].name_y;
                const eventTemplateDateX = results[3][0].date_x;
                const eventTemplateDateY = results[3][0].date_y;
                const eventTemplateCredentialX = results[3][0].credential_x;
                const eventTemplateCredentialY = results[3][0].credential_y;
                const eventTemplateNameWidth = results[3][0].name_width;
                const eventTemplateCreation = results[3][0].creation;

                // creating PDF
                var PDFDocument = require("pdfkit");
                var pdf = new PDFDocument({
                  size: [2480, 3507],
                  layout: "landscape",
                  margin: 0,
                  info: {
                    Title: eventTitle,
                    Author: global.defaultConfig.website_name,
                    Producer: global.defaultConfig.website_name,
                    Creator: global.defaultConfig.website_name,
                    Subject: eventTitle,
                    Keywords: "pdf;javascript",
                    CreationDate: eventTemplateCreation,
                    ModDate: eventTemplateCreation,
                  },
                });

                //
                pdf
                  .font("./public/fonts/Cairo-Bold.ttf")
                  .image(`./public/uploads/${eventTemplate}`, 0, 0, {
                    // scale: 0.24,
                  });
                //

                //
                pdf
                  .fontSize("88")
                  .text(
                    req.session.user.name_en,
                    eventTemplateNameX,
                    eventTemplateNameY,
                    {
                      align: "center",
                      width: eventTemplateNameWidth,
                    }
                  );

                //
                pdf.fontSize("50").text(
                  credentialCreation,
                  eventTemplateCredentialX,
                  eventTemplateCredentialY - 40
                  // {
                  //   align: "center",
                  //   width: 450,
                  // }
                );

                pdf
                  .fontSize("50")
                  .text(
                    credential,
                    eventTemplateCredentialX,
                    eventTemplateCredentialY
                  );
                res.setHeader(
                  "Content-disposition",
                  `attachment;filename=${credential}.pdf`
                );
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "X-Requested-With");
                res.header("content-type", "application/pdf");

                pdf.end();
                pdf.pipe(res);
                // res.send("download");
              }
            );
          } else {
            // your are not enrolled
            res.redirect(`/event/${eventId}/enroll`);
            //res.send("not enrolled");
          }
        }
      );
    });
  } else {
    // user is not logged in
    console.log("not logged in");
    req.session.user.eventId = eventId;
    req.session.user.requestType = 1;
    res.redirect("/entryPoint/login");
  }
});

router.get("/:id([0-9]+)/enroll", (req, res) => {
  const eventId = req.params.id;

  //check if event still enarollable?
  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.log(err);
      connection.release();
      res.send(err);
    }
    const sqlQuery = `select is_enrollable from tbl_events where id = ?`;
    connection.query(sqlQuery, [eventId], (errors, results, fields) => {
      if (errors) {
        console.log(errors);
        connection.release();
        res.send(errors);
      }
      const isEventEnrollable = results[0].is_enrollable;
      if (isEventEnrollable) {
        // user logged in before
        if (req.session.user.type.toString() != "0") {
          // check is user enrolled before
          const sqlQuery = `
      SELECT COUNT(*) AS \`user_is_enrolled\` FROM tbl_events_users WHERE user_id = ? AND event_id = ?;
      `;
          connection.query(
            sqlQuery,
            [req.session.user.id, eventId],
            (errors, results, fields) => {
              const isUserEnrolled = results[0].user_is_enrolled;
              console.log(sqlQuery);
              if (errors) {
                connection.release();
                console.log(errors);
                res.send(errors);
              }
              if (isUserEnrolled) {
                // enrolled before
                console.log(req.session.user.requestType);
                if (req.session.user.requestType == 1) {
                  // download certification if it is requested
                  res.redirect(`/event/${eventId}/certification`);
                } else {
                  res.redirect(`/event/${eventId}`);
                }
              } else {
                // enrolling
                const sqlEnrollUser = `insert into tbl_events_users (event_id,user_id) values (?,?);`;
                connection.query(
                  sqlEnrollUser,
                  [eventId, req.session.user.id],
                  (errors, results, fields) => {
                    connection.release();
                    if (errors) {
                      console.log(errors);
                      res.send(errors);
                    }
                    req.session.user.eventId = undefined;
                    console.log(req.session.user.requestType);
                    if (req.session.user.requestType == 1) {
                      // download certification if it is requested
                      res.redirect(`/event/${eventId}/certification`);
                    } else {
                      res.redirect(`/event/${eventId}`);
                    }
                    //res.send("user has been enrolled");
                  }
                );
              }
            }
          );
        } else {
          // user is not logged in
          console.log("not logged in");
          req.session.user.eventId = eventId;
          req.session.user.requestType = 0; // 0: enroll, 1: certification
          res.redirect("/entryPoint/login");
        }
      } else {
        res.send("enrolling is not accepted");
      }
    });
  });

  //res.send(eventId);
});
// router.get("*", (req, res) => {
//   res.redirect("/");
// });
module.exports = router;
