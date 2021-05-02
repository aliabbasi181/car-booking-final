var mongoose = require("mongoose");

var DriverSchema = new mongoose.Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	age: {type: Number, required: true},
	phoneNumber: {type: Number, required: true},
	carNumber: {type: String, required: true},
	carModel: {type: String, required: true},
	companyMade: {type: String, required: true},
	carType: {type: String, required: true},
	role: {type: String, required: false},
	email: {type: String, required: true},
	licenseNumber: {type: String, required: true},	
	password: {type: String, required: true},
	isConfirmed: {type: Boolean, required: true, default: 0},
	confirmOTP: {type: String, required:false},
	otpTries: {type: Number, required:false, default: 0},
	status: {type: Boolean, required: true, default: 1}
}, {timestamps: true});

// Virtual for user's full name
DriverSchema
	.virtual("fullName")
	.get(function () {
		return this.firstName + " " + this.lastName;
	});

module.exports = mongoose.model("Driver", DriverSchema);