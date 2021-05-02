var express = require("express");
const BookingController = require("../controllers/BookingController");

var router = express.Router();

router.get("/list", BookingController.bookingList);
router.get("/", BookingController.bookingDetail);
router.post("/", BookingController.bookingCreate);
router.put("/booking-update", BookingController.bookingUpdate);
router.delete("/:id", BookingController.bookDelete);

module.exports = router;