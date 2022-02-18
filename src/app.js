const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const { graphqlUploadExpress } = require("graphql-upload");

const { getError } = require("./helpers/handle_error_gql.helper");

require("dotenv").config();

/* config database */
const mongo_uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@backend.hn2id.mongodb.net/${process.env.MONGO_NAME}?retryWrites=true&w=majority`;
mongoose
  .connect(mongo_uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("DB Connected!"))
  .catch((err) => {
    console.log(err);
  });

const schema = require("./Schema");

const app = express();
const port = process.env.PORT || 3001;

app.use(
  "/graphql",
  graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
  graphqlHTTP({
    schema,
    graphiql: false,
    customFormatErrorFn: (err) => {
      const error = getError(err.message);
      const err_rs = error
        ? { message: error.message, statusCode: error.statusCode }
        : { message: err.message, statusCode: 400 };
      return err_rs;
    },
  })
);

app.use("/upload/events/:img_name", async (req, res) => {
  const Event = require("./models/event.model");
  const { img_name } = req.params;
  const find_event = await Event.findOne(
    { "image.name": img_name },
    { image: 1 }
  );
  res.contentType(find_event.image.mimetype);
  res.send(find_event.image.file);
});

app.listen(port, () => console.log(`Server start on port ${port}`));