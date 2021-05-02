const Booking = require("../models/BookingModel");
const Driver = require("../models/DriverModel");
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
const DriverModel = require("../models/DriverModel");
mongoose.set("useFindAndModify", false);

// Booking Schema
function BookingData(data) {
	this.id = data._id;
	this.date= data.date;
	this.time = data.time;
	this.pickFrom = data.pickFrom;
	this.destination = data.destination;
	this.noOfPessengers = data.noOfPessengers;
	this.vehicleType = data.vehicleType;
	this.status = data.status;
}

/**
 * Book List.
 * 
 * @returns {Object}
 */
exports.bookingList = [
	function (req, res) {		
		try {
			Booking.find({}).populate('user','firstName lastName phoneNumber').populate('driverID','firstName lastName phoneNumber').sort({_id:-1}).then((bookings)=>{
				if(bookings.length > 0){
					return apiResponse.successResponseWithData(res, "Operation success", bookings);
				}else{
					return apiResponse.successResponseWithData(res, "Operation success", []);
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Book Detail.
 * 
 * @param {string}      id
 * 
 * @returns {Object}
 */
exports.bookingDetail = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.body.id)){
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Booking.findOne({_id: req.body.id}).then((booking)=>{                
				if(booking !== null){					
					let bookingData = new BookingData(booking);
					return apiResponse.successResponseWithData(res, "Operation success", bookingData);
				}else{
					return apiResponse.successResponseWithData(res, "No Record Found", {});
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Book store.
 * 
 * @param {string}      title 
 * @param {string}      description
 * @param {string}      isbn
 * 
 * @returns {Object}
 */
exports.bookingCreate = [
	auth,
	body("date", "Date must not be empty.").isLength({ min: 1 }).trim(),
	body("time", "Time must not be empty.").isLength({ min: 1 }).trim(),
	body("pickFrom", "Pick From must not be empty").isLength({ min: 1 }).trim(),
	body("destination", "Destination must not be empty").isLength({ min: 1 }).trim(),
	body("noOfPessengers", "noOfPessengers must not be empty").isLength({ min: 1 }).trim(),
	body("vehicleType", "Vehicle Type must not be empty").isLength({ min: 1 }).trim(),
	sanitizeBody("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			var booking = new Booking(
				{   date: req.body.date,
					user: req.user,
					time: req.body.time,
					pickFrom: req.body.pickFrom,
					destination: req.body.destination,
					noOfPessengers: req.body.noOfPessengers,
					vehicleType: req.body.vehicleType,
					status: "Pending",
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				//Save book.
				booking.save(function (err) {
					if (err) { return apiResponse.ErrorResponse(res, err); }
					let bookingData = new BookingData(booking);
					return apiResponse.successResponseWithData(res,"Booking add Success.", bookingData);
				});
			}
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Book update.
 * 
 * @param {string}      title 
 * @param {string}      description
 * @param {string}      isbn
 * 
 * @returns {Object}
 */
exports.bookingUpdate = [
	auth,
	body("driverID", "Driver ID must not be empty.").isLength({ min: 1 }).trim(),
	body("bookingID", "Booking ID must not be empty").isLength({ min: 1 }).trim().custom((value,{req}) => {
		return Driver.findOne({_id : req.body.driverID}).then(driver => {			
			try {																							
				Booking.findOneAndUpdate({_id : req.body.bookingID}, {
						driverID : driver,
						status: "Booked"
					}).catch(err => {
						return apiResponse.ErrorResponse(res, err);
					});										
			} catch (err) {
				//throw error in json response with status 500. 
				return apiResponse.ErrorResponse(res, err);
			}
			return apiResponse.successResponse(res,"Booking Confirmed");		
		});
	}),
	sanitizeBody("*").escape(),
	(req, res) => {
		return apiResponse.successResponse(res,"Booking Confirmed");
	}
];

/**
 * Book Delete.
 * 
 * @param {string}      id
 * 
 * @returns {Object}
 */
exports.bookDelete = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}
		try {
			Booking.findById(req.params.id, function (err, foundBook) {
				if(foundBook === null){
					return apiResponse.notFoundResponse(res,"Book not exists with this id");
				}else{
					//Check authorized user
					if(foundBook.user.toString() !== req.user._id){
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}else{
						//delete book.
						Booking.findByIdAndRemove(req.params.id,function (err) {
							if (err) { 
								return apiResponse.ErrorResponse(res, err); 
							}else{
								return apiResponse.successResponse(res,"Book delete Success.");
							}
						});
					}
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];