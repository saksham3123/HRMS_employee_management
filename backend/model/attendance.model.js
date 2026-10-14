import mongoose from "mongoose";


const attendanceSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    date:{
        type: Date,
        required: true,
    },

    loginTime: {
        type: Date,
        required: true,
    },

    logoutTime: {
        type: Date,
        required: null,
    },

    workingHours: {
        type: Number,
        default: 0,
    },


    hourlyRate:{
        type:Number,
        default: 100,
    },

    dailyPay:{
        type: Number,
        default: 0,
    },

},
{
    timestamps: true,
},
)

const Attendance = mongoose.model("Attendance" , attendanceSchema)

export default Attendance