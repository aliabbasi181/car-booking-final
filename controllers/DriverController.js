const DriverModel = require("../models/DriverModel");
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");


// driver schema

function DriverData(data) {
	this.firstName = data.firstName;
	this.lastName = data.lastName;
	this.email = data.email;
	this.age = data.age;
	this.carType = data.carType;
	this.carModel = data.carModel;
	this.carNumber = data.carNumber;
	this.phoneNumber = data.phoneNumber;
	this.companyMade = data.companyMade;
	this.licenseNumber = data.licenseNumber;
}



/**
 * User registration.
 *
 * @param {string}      firstName
 * @param {string}      lastName
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [	
	// Validate fields.
	body("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("age").isLength({ min: 1 }).trim().withMessage("Age must be specified."),
	body("phoneNumber").isLength({ min: 1 }).trim().withMessage("Phone Number must be specified."),
	body("carNumber").isLength({ min: 1 }).trim().withMessage("Car Number must be specified."),
	body("carModel").isLength({ min: 1 }).trim().withMessage("Car Model must be specified."),
	body("carType").isLength({ min: 1 }).trim().withMessage("Car Type must be specified."),
	body("companyMade").isLength({ min: 1 }).trim().withMessage("Company Made must be specified."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
			return DriverModel.findOne({email : value}, {licenseNumber : value}).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),	
	body("licenseNumber").isLength({ min: 1 }).trim().withMessage("License Number must be specified.").custom((value) => {
		return DriverModel.findOne({licenseNumber : value}).then((user) => {
			if (user) {
				return Promise.reject("Driver already exists with this License Number.");
			}
		});
	}),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				//hash input password
				bcrypt.hash(req.body.password,10,function(err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					var user = new DriverModel(
						{
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							password: hash,
							confirmOTP: otp,
							age: req.body.age,
							carType: req.body.carType,
							carModel: req.body.carModel,
							carNumber: req.body.carNumber,
							phoneNumber: req.body.phoneNumber,
							companyMade: req.body.companyMade,
							licenseNumber: req.body.licenseNumber,
							role: "Driver",
							isConfirmed: true
						}
					);
					// Html email body
					let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
					// Send confirmation email
					mailer.send(
						constants.confirmEmails.from, 
						req.body.email,
						"Confirm Account",
						html
					).then(function(){
						// Save user.
						user.save(function (err) {
							if (err) { return apiResponse.ErrorResponse(res, err); }
							let userData = {
								_id: user._id,
								firstName: user.firstName,
								lastName: user.lastName,
								email: user.email,
								age: user.age,
								carType: user.carType,
								carModel: user.carModel,
								carNumber: user.carNumber,
								phoneNumber: user.phoneNumber,
								companyMade: user.companyMade,
								licenseNumber: user.licenseNumber,
								isConfirmed: user.isConfirmed,
								role: user.role
							};
							return apiResponse.successResponseWithData(res,"Driver Registration Success.", userData);
						});
					}).catch(err => {
						return apiResponse.ErrorResponse(res,err);
					}) ;
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				DriverModel.findOne({email : req.body.email}).then(user => {
					if (user) {
						//Compare given password with db's hash.
						bcrypt.compare(req.body.password,user.password,function (err,same) {
							if(same){
								//Check account confirmation.
								if(user.isConfirmed){
									// Check User's account active or not.
									if(user.status) {
										let userData = {
											_id: user._id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
											age: user.age,
											carType: user.carType,
											carModel: user.carModel,
											carNumber: user.carNumber,
											phoneNumber: user.phoneNumber,
											companyMade: user.companyMade,
											licenseNumber: user.licenseNumber,
											role: user.role
										};
										//Prepare JWT token for authentication
										const jwtPayload = userData;
										const jwtData = {
											expiresIn: process.env.JWT_TIMEOUT_DURATION,
										};
										const secret = process.env.JWT_SECRET;
										//Generated JWT token with Payload and secret.
										userData.token = jwt.sign(jwtPayload, secret, jwtData);
										return apiResponse.successResponseWithData(res,"Login Success.", userData);
									}else {
										return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.");
									}
								}else{
									return apiResponse.unauthorizedResponse(res, "Account is not confirmed. Please confirm your account.");
								}
							}else{
								return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
							}
						});
					}else{
						return apiResponse.unauthorizedResponse(res, "Email or Password wrong.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

// get all drivers 

exports.driverList = [
	auth,	
	function (req, res) {
		if(req.user.role == "admin"){
			try {			
				DriverModel.find({},"_id firstName lastName email age phoneNumber carNumber licenseNumber carModel carType companyMade role").sort({_id:-1}).then((drivers)=>{
					if(drivers.length > 0){
						return apiResponse.successResponseWithData(res, "Operation success", drivers);
					}else{
						return apiResponse.successResponseWithData(res, "Operation success", []);
					}
				});
			} catch (err) {
				//throw error in json response with status 500. 
				return apiResponse.ErrorResponse(res, err);
			}
		}
		else{
			return apiResponse.ErrorResponse(res, "You are not allowed to use this information");
		}
	}
];


// get single driver

exports.driverDetail = [
	auth,
	function (req, res) {
		try {				
			DriverModel.findOne({_id: req.body.id}).then((driver)=>{          
				if(driver !== null){
					let driverData = new DriverData(driver);
					return apiResponse.successResponseWithData(res, "Operation success", driverData);
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
 * Verify Confirm otp.
 *
 * 
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				DriverModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							//Check account confirmation.
							if(user.confirmOTP == req.body.otp){
								//Update user as confirmed
								DriverModel.findOneAndUpdate(query, {
									isConfirmed: 1,
									confirmOTP: null 
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err);
								});
								return apiResponse.successResponse(res,"Account confirmed success.");
							}else{
								return apiResponse.unauthorizedResponse(res, "Otp does not match");
							}
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}else {
				var query = {email : req.body.email};
				DriverModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if(!user.isConfirmed){
							// Generate otp
							let otp = utility.randomNumber(4);
							// Html email body
							let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from, 
								req.body.email,
								"Confirm Account",
								html
							).then(function(){
								user.isConfirmed = 0;
								user.confirmOTP = otp;
								// Save user.
								user.save(function (err) {
									if (err) { return apiResponse.ErrorResponse(res, err); }
									return apiResponse.successResponse(res,"Confirm otp sent.");
								});
							});
						}else{
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					}else{
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];