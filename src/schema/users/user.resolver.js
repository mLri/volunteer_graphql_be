/* include module */
const bcrypt = require("bcrypt");
const { verify } = require("jsonwebtoken");

/* include model */
const User = require("../../models/user.model");

/* include helpers */
const {
  createAccessToken,
  createRefreshToken,
} = require("../../helpers/token.helper");
const { errorName } = require("../../helpers/handle_error_gql.helper");

module.exports = {
  Query: {
    signin: async (parent, args) => {
      try {
        const { username, password } = args;

        /* check user */
        const user = await User.findOne({ username }).lean();
        if (!user) throw new Error(errorName.user_or_pass_wrong);

        /* check password */
        const compare_password = await bcrypt.compare(password, user.password);
        if (!compare_password) throw new Error(errorName.user_or_pass_wrong);

        /* genarate access token */
        const access_token = createAccessToken(
          {
            _id: user._id,
            username: user.username,
            employee_id: user.employee_id,
            prefix: user.prefix,
            first_name: user.first_name,
            last_name: user.last_name,
            institution: user.institution,
            tel: user.tel,
            email: user.email,
            role: user.role,
          },
          user.role
        );

        /* genarate refresh token */
        const refresh_token = createRefreshToken({ _id: user._id }, user.role);

        return {
          access_token,
          refresh_token,
          ...user,
        };
      } catch (error) {
        throw error;
      }
    },
    refresh_token: async (parent, args) => {
      try {
        console.log(args);
        let { refresh_token } = args;
        if (!refresh_token) throw new Error(errorName.bad_request);

        const payload = verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
        if (!payload) throw new Error(errorName.not_found);

        /* token is valid, check user exist */
        const user = await User.findOne({ _id: payload._id }).lean();
        if (!user) throw new Error(errorName.not_found);

        /* genarate access token */
        const access_token = createAccessToken({
          _id: user._id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        });

        /* genarate refresh token */
        refresh_token = createRefreshToken({ _id: user._id });

        return {
          access_token,
          refresh_token,
          ...user,
        };
      } catch (error) {
        throw error;
      }
    },
  },
  Mutation: {
    signup: async (parent, args) => {
      try {
        const {
          employee_id,
          prefix,
          first_name,
          last_name,
          institution,
          tel,
          username,
          password,
          email,
          role = "admin",
        } = args;

        /* check exists user */
        const user = await User.findOne({ username }).lean();
        if (user) throw new Error(errorName.duplicate);

        /* hash password */
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        /* create new user */
        const new_user = new User({
          employee_id,
          prefix,
          first_name,
          last_name,
          institution,
          tel,
          username,
          password: hashPassword,
          email,
          role,
        });

        const create_user = await new_user.save();

        return create_user;
      } catch (error) {
        throw error;
      }
    },
  },
};
