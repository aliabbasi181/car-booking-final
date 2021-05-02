var express = require("express");
var authRouter = require("./auth");
var bookingRouter = require("./booking");
var driverRouter = require("./driver");
var userRouter = require("./user");

var app = express();

app.use("/admin/", authRouter);
app.use("/booking/", bookingRouter);
app.use("/driver/", driverRouter);
app.use("/user/", userRouter);

module.exports = app;