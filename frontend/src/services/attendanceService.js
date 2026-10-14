import { apiRequest } from "./api";

// Get today's attendance
export const getTodayAttendance = async () => {
  return await apiRequest("/attendance/today");
};

// Clock in
export const clockIn = async () => {
  return await apiRequest("/attendance/login", {
    method: "POST",
  });
};

// Clock out
export const clockOut = async () => {
  return await apiRequest("/attendance/logout", {
    method: "POST",
  });
};

// Get attendance history
export const getAttendanceHistory = async () => {
  return await apiRequest("/attendance/history");
};