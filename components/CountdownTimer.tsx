import React, { useState, useEffect } from "react";

interface TimerProps {
  targetDate: Date;
}

const CountdownTimer: React.FC<TimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Get current date and time in UTC
      const nowUTC = new Date();
      const nowUTCMs = Date.UTC(
        nowUTC.getUTCFullYear(),
        nowUTC.getUTCMonth(),
        nowUTC.getUTCDate(),
        nowUTC.getUTCHours(),
        nowUTC.getUTCMinutes(),
        nowUTC.getUTCSeconds()
      );

      // Ensure target date is in UTC
      const targetUTC = new Date(
        Date.UTC(
          targetDate.getUTCFullYear(),
          targetDate.getUTCMonth(),
          targetDate.getUTCDate(),
          targetDate.getUTCHours(),
          targetDate.getUTCMinutes(),
          targetDate.getUTCSeconds()
        )
      );

      // Calculate the difference in milliseconds
      const difference = targetUTC.getTime() - nowUTCMs;

      if (difference > 0) {
        // Calculate days by dividing by milliseconds in a day
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));

        // Calculate remaining time after days
        const remainingTime = difference % (1000 * 60 * 60 * 24);

        // Calculate hours, minutes, seconds from the remaining time
        const hours = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutes = Math.floor(
          (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial calculation

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex flex-col items-center bg-[url('./assets/Group1194.png')] h-24 rounded-b-lg">
      <div className="text-sm font-poppins font-medium text-white mb-2 mt-2">
        Deposit By
      </div>
      <div className="flex text-black gap-2">
        <div className="flex flex-col items-center">
          <div className="bg-[#89cec8] px-2 py-1 rounded-md font-poppins font-medium text-xs">
            {String(timeLeft.days).padStart(2, "0")}
          </div>
          <span className="text-xs font-poppins text-white">DAYS</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#89cec8] px-2 py-1 rounded-md font-poppins font-medium text-xs">
            {String(timeLeft.hours).padStart(2, "0")}
          </div>
          <span className="text-xs font-poppins text-white">HRS</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#89cec8] px-2 py-1 rounded-md font-poppins font-medium text-xs">
            {String(timeLeft.minutes).padStart(2, "0")}
          </div>
          <span className="text-xs font-poppins text-white">MINS</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#89cec8] px-2 py-1 rounded-md font-poppins font-medium text-xs">
            {String(timeLeft.seconds).padStart(2, "0")}
          </div>
          <span className="text-xs font-poppins text-white">SECS</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
