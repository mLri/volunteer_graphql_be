const yup = require("yup");

module.exports.signinSchema = yup.object().shape({
  username: yup.string().min(4).max(10),
  password: yup.string().min(4).max(10),
});

module.exports.signupSchema = yup.object().shape({
  tel: yup.string().min(10).max(10),
  username: yup.string().min(4).max(10),
  password: yup.string().min(4).max(10),
  email: yup.string().max(30).email(),
});