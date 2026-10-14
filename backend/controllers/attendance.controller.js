import Attendance from "../model/attendance.model.js";
import mongoose from "mongoose"
import User from "../model/user.model.js";


export const clockIn = async (req, res) => {
    try {
        
        const userId = req.user.userId;

        //start of the day
        const startofDay = new Date()
        startofDay.setHours(0, 0, 0, 0);

        // End of the day
        const endoftheDay = new Date()
        endoftheDay.setHours(23 , 59 , 59 , 999)

        const existingAttendance = await Attendance.findOne({
            userId,
            date:{
                $gte : startofDay,
                $lte: endoftheDay,
            },

        })


        if(existingAttendance){
            return res.status(400).json({
                message: "Attendance already marked for today",
            })
        }

        // creating atendance
        const attendance = await Attendance.create({
            userId,
            date: new Date(),
            loginTime: new Date(),
        })


        res.status(201).json({
            message: "Attendance marked successfully"
        })







    } catch (error) {

        return res.status(500).json({
            message : error.message,
        })
        
    }
}

export const clockOut  = async ( req , res)=> {
    try {
        const userId = req.user.userId;

        // Start of the day
        const startofDay = new Date();
        startofDay.setHours(0, 0, 0, 0);

        // End of the day
        const endoftheDay = new Date();
        endoftheDay.setHours(23, 59, 59, 999);

         // Find today's attendance
        const attendance = await Attendance.findOne({
            userId,
            date: {
                $gte: startofDay,
                $lte: endoftheDay,
            },
        });



        // didnt clocked in
        if(!attendance){
            return res.status(400).json({
             message: "Please mark attendance first"
            })
        }

        // user already clocked out
        if(attendance.logoutTime){
            return res.status(400).json({
                message: " you have already clockout today"
            })
        }


        // Current time = logout time
        const logoutTime = new Date();

        //  working hours
        const workingMilliseconds =
            logoutTime - attendance.loginTime;

        const workingHours =
            workingMilliseconds / (1000 * 60 * 60);

        //  pay
        const dailyPay =
            workingHours * attendance.hourlyRate;

        // update attendance
        attendance.logoutTime = logoutTime;
        attendance.workingHours = Number(workingHours.toFixed(2));
        attendance.dailyPay = Number(dailyPay.toFixed(2));

        await attendance.save();

        res.status(200).json({
            message: "Clock out successful",
            attendance,
        });

        
    } catch (error) {
         return res.status(500).json({
            message: error.message,
        });

        
    }
}



export const getTodayAttendance = async (req , res) => {

    try {

        const userId = req.user.userId
       
          
        const startofDay = new Date();
        startofDay.setHours(0, 0, 0, 0);

      
        const endoftheDay = new Date();
        endoftheDay.setHours(23, 59, 59, 999); 

        const attendance = await Attendance.findOne({
            userId,
            date: {
                $gte: startofDay,
                $lte: endoftheDay,
            },
        });


        if(!attendance){
            return res.status(200).json({
                message : "No attendance marked today"
            })
        }

        res.status(200).json({
            attendance
        })
        
    } catch (error) {

        return res.status(500).json({
            message: error.message,
        });
        
    }

    
}



export const getAttendanceHistory = async (req , res) => {
    try {
        const userId = req.user.userId;

        const AttendanceHistory = await Attendance.find({
            userId,
        }).sort({ date : -1})


        res.status(200).json({
            count: AttendanceHistory.length,
            attendance: AttendanceHistory,
        })

    } catch (error) {

            return res.status(500).json({
            message: error.message,
        });
        
    }
    
}






export const getUserMonthlyReport = async (req , res) => {

    try {

        const { userId } = req.params
        const {month , year } = req.params
        
        
        //check user ID
        if(!mongoose.Types.ObjectId.isValid(userId)){
            return res.status(400).json({
                message: "Invalid User ID",
            })
        }

        const selectedMonth = Number(month)
        const selectedYear = Number(year)

        if(
            !selectedMonth || selectedMonth <1 ||
            selectedMonth > 12 || !selectedYear
        ){
             return res.status(400).json({
                message: "Please provide a valid month and year",
            });

        }


        //check if user exists
        const user = await User.findById(userId).select("-password")


        if(!user){
            return res.status(404).json({
                message: "User not  found"
            })
        }

        
         // Start of selected month
        const startOfMonth = new Date(
            selectedYear,
            selectedMonth - 1,
            1,
            0,
            0,
            0,
            0
        );

        // Start of next month
        const startOfNextMonth = new Date(
            selectedYear,
            selectedMonth,
            1,
            0,
            0,
            0,
            0
        );


        const attendance  = await Attendance.find({
            userId,
            date: {
                $gte: startOfMonth,
                $lt: startOfNextMonth
            },
        }).sort({ date: 1})

        let totalWorkingHours = 0;
        let totalPay = 0;

        attendance.forEach((record)=>{
              totalWorkingHours += record.workingHours || 0;
            totalPay += record.dailyPay || 0;
        })

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },

            report: {
                month: selectedMonth,
                year: selectedYear,
                totalWorkingDays: attendance.length,
                totalWorkingHours: Number(
                    totalWorkingHours.toFixed(2)
                ),
                totalPay: Number(
                    totalPay.toFixed(2)
                ),
            },

            attendance,
        });





        
    } catch (error) {

         return res.status(500).json({
            message: error.message,
        });
        
    }
}


export const getAllTodayAttendance = async (req, res) => {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("userId", "name email")
      .sort({ loginTime: -1 });

    return res.status(200).json({
      count: records.length,
      attendance: records,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};





export const getMonthlyPayrollSummary = async (req, res) => {
  try {
    const month = Number(req.params.month);
    const year = Number(req.params.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000
    ) {
      return res.status(400).json({
        message: "Invalid month or year",
      });
    }

    // First day of the selected month
    const startDate = new Date(year, month - 1, 1);

    // First day of the following month
    const endDate = new Date(year, month, 1);

    const result = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPayroll: { $sum: "$dailyPay" },
          totalWorkingHours: { $sum: "$workingHours" },
          attendanceCount: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] ?? {
      totalPayroll: 0,
      totalWorkingHours: 0,
      attendanceCount: 0,
    };

    return res.status(200).json({
      month,
      year,
      totalPayroll: summary.totalPayroll,
      totalWorkingHours: summary.totalWorkingHours,
      attendanceCount: summary.attendanceCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};





export const getMonthlyPayrollByEmployee = async (req, res) => {
  try {
    const month = Number(req.params.month);
    const year = Number(req.params.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return res.status(400).json({
        message: "Invalid month or year",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Get every employee account, including those with no attendance.
    const employees = await User.find({ role: "user" })
      .select("_id name email")
      .sort({ name: 1 });

    // Calculate attendance totals for the selected month.
    const attendanceTotals = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalWorkingHours: {
            $sum: "$workingHours",
          },
          totalEarnings: {
            $sum: "$dailyPay",
          },
          attendanceDays: {
            $sum: 1,
          },
        },
      },
    ]);

    // Index totals by employee ID for quick matching.
    const totalsByEmployee = new Map(
      attendanceTotals.map((record) => [
        String(record._id),
        record,
      ])
    );

    // Include every employee, defaulting missing totals to zero.
    const payroll = employees.map((employee) => {
      const totals = totalsByEmployee.get(String(employee._id));

      return {
        userId: employee._id,
        name: employee.name,
        email: employee.email,
        totalWorkingHours: totals?.totalWorkingHours ?? 0,
        totalEarnings: totals?.totalEarnings ?? 0,
        attendanceDays: totals?.attendanceDays ?? 0,
      };
    });

    return res.status(200).json({
      month,
      year,
      employeeCount: employees.length,
      payroll,
      totalPayroll: payroll.reduce(
        (sum, employee) => sum + employee.totalEarnings,
        0
      ),
      totalWorkingHours: payroll.reduce(
        (sum, employee) => sum + employee.totalWorkingHours,
        0
      ),
    });
  } catch (error) {
    console.error("Monthly payroll by employee error:", error);

    return res.status(500).json({
      message: error.message || "Failed to generate monthly payroll",
    });
  }
};
