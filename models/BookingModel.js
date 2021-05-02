var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var BookingSchema = new mongoose.Schema({	
	date: {type: Date, required: true},
	time: {type: String, required: true},
	pickFrom: {type: String, required: true},
	destination: {type: String, required: true},
	noOfPessengers: {type: String, required: true},
	vehicleType: {type: String, required: true},
	status: {type: String, required: true},
	user: { type: Schema.ObjectId, ref: "User", required: true},
	driverID: { type: Schema.ObjectId, ref: "Driver", required: false},
}, {timestamps: true});

module.exports = mongoose.model("Booking", BookingSchema);