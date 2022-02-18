exports.errorName = {
  not_found: "not_found",
  bad_request: "bad_request",
  user_or_pass_wrong: "user_or_pass_wrong",
  unauthorized: "unauthorized",
  forbidden: "forbidden",
  duplicate: 'duplicate'
};

exports.errorType = {
  not_found: {
    message: "Not found!",
    statusCode: 404,
  },
  bad_request: {
    message: "Bad request!",
    statusCode: 400,
  },
  user_or_pass_wrong: {
    message: "Username or Password was wrong!",
    statusCode: 400,
  },
  unauthorized: {
    message: "Unauthorized",
    statusCode: 401,
  },
  forbidden: {
    message:
      "Forbidden You don't have permission to access the specified resource",
    statusCode: 403,
  },
  duplicate: {
    message: 'Duplicate data!',
    status: 400
  }
};

exports.getError = (errorName) => {
  return this.errorType[errorName];
};
