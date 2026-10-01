// ==========================================
// WORKING DAYS UTILITY
// ==========================================

// Convert Date object to YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ==========================================
// GET DAY OF WEEK
// 0 = Sunday
// 1 = Monday
// ...
// 6 = Saturday
// ==========================================

const getDayOfWeek = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);

  return date.getDay();
};

// ==========================================
// CHECK WEEKLY OFF
// ==========================================

const isWeeklyOff = (
  dateString,
  weeklyOffDays = [0]
) => {
  const dayOfWeek = getDayOfWeek(dateString);

  return weeklyOffDays.includes(dayOfWeek);
};

// ==========================================
// CHECK HOLIDAY
// ==========================================

const isHoliday = (
  dateString,
  holidays = []
) => {
  return holidays.some(
    (holiday) =>
      holiday?.date === dateString
  );
};

// ==========================================
// CHECK WORKING DAY
// ==========================================

const isWorkingDay = (
  dateString,
  weeklyOffDays = [0],
  holidays = []
) => {
  if (
    isWeeklyOff(
      dateString,
      weeklyOffDays
    )
  ) {
    return false;
  }

  if (
    isHoliday(
      dateString,
      holidays
    )
  ) {
    return false;
  }

  return true;
};

// ==========================================
// GET ALL WORKING DATES
// ==========================================

const getWorkingDates = (
  startDate,
  endDate,
  weeklyOffDays = [0],
  holidays = []
) => {
  const dates = [];

  let currentDate = new Date(
    `${startDate}T00:00:00`
  );

  const lastDate = new Date(
    `${endDate}T00:00:00`
  );

  while (currentDate <= lastDate) {
    const dateString =
      formatDate(currentDate);

    if (
      isWorkingDay(
        dateString,
        weeklyOffDays,
        holidays
      )
    ) {
      dates.push(dateString);
    }

    currentDate.setDate(
      currentDate.getDate() + 1
    );
  }

  return dates;
};

// ==========================================
// GET TOTAL WORKING DAYS
// ==========================================

const getWorkingDaysCount = (
  startDate,
  endDate,
  weeklyOffDays = [0],
  holidays = []
) => {
  return getWorkingDates(
    startDate,
    endDate,
    weeklyOffDays,
    holidays
  ).length;
};

module.exports = {
  formatDate,
  getDayOfWeek,
  isWeeklyOff,
  isHoliday,
  isWorkingDay,
  getWorkingDates,
  getWorkingDaysCount,
};