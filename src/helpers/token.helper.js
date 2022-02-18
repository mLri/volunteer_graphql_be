const jwt = require('jsonwebtoken')

/* include helpers */
const { errorName } = require("./handle_error_gql.helper");



module.exports.checkAuth = (req, res, next) => {
  try {

    const auth_token = req.headers['authorization']
    if (!auth_token) throw new Error(errorName.unauthorized)

    const split_auth_token = auth_token.split(' ')
    const bearer = split_auth_token[0]
    const token = split_auth_token[1]

    if (!bearer || bearer !== 'Bearer') throw new Error(errorName.forbidden)

    const verified = jwt.verify(token, process.env.TOKEN_SECRET)
    req.user = verified
    next()
  } catch (error) {
    throw error
  }
}

module.exports.createAccessToken = (payload, scope = 'admin') => {
  return jwt.sign({ principal: { ...payload }, permissions: scope }, process.env.TOKEN_SECRET, { expiresIn: '1d' })
}

module.exports.createRefreshToken = (payload) => {
  return jwt.sign({ ...payload }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
}