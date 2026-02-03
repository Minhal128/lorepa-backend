const combineRouter = require("express").Router()


combineRouter.use("/account",require("./account.router"))
combineRouter.use("/trailer",require("./trailer.router"))
combineRouter.use("/booking",require("./booking.router"))
combineRouter.use("/dashboard",require("./dashboard.router"))
combineRouter.use("/content", require("./content.router"));
combineRouter.use("/ticket", require("./ticket.router"));
combineRouter.use("/document", require("./document.router"));
combineRouter.use("/chat", require("./chat.router"));
combineRouter.use("/notification", require("./notification.router"));
combineRouter.use("/transaction", require("./transaction.router"));



module.exports = combineRouter