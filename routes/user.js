var express = require("express");
const UserController = require("../controllers/UserController");

var router = express.Router();

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/list", UserController.userList);
router.post("/verify-otp", UserController.verifyConfirm);
router.post("/resend-verify-otp", UserController.resendConfirmOtp);

module.exports = router;