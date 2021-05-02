var express = require("express");
const DriverController = require("../controllers/DriverController");

var router = express.Router();

router.post("/register", DriverController.register);
router.post("/login", DriverController.login);
router.get("/list", DriverController.driverList);
router.get("/", DriverController.driverDetail);
router.post("/verify-otp", DriverController.verifyConfirm);
router.post("/resend-verify-otp", DriverController.resendConfirmOtp);

module.exports = router;