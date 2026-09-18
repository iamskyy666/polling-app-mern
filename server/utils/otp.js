// make 6 digit OTP
export const genreateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// expiry time for OTP is 10 mins
export const otpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

// match the otp given by the user
export const otpValid = (user, otp) =>
  user.otp === otp && user.otpExpires && user.otpExpires > new Date();
