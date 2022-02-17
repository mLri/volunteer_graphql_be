/* include modules */
const mongoose = require("mongoose");
const { GraphQLUpload } = require("graphql-upload");

/* include model */
const Event = require("../../models/event.model");
const BookEvent = require("../../models/book_event.model");

/* include helpers */
const { errorName } = require("../../helpers/handle_error_gql.helper");

function ranNameFileUpload(file_name) {
  if (!file_name) throw errorName.bad_request;
  const split_name = file_name.split(".");
  const random_name =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  return `${random_name}.${split_name[split_name.length - 1]}`;
}

async function steamfile(createReadStream, filename, mimetype) {
  return new Promise(function (resolve, reject) {
    const fileStream = createReadStream();

    let buffer = [];

    fileStream.on("error", (err) => reject(err));
    fileStream.on("data", (chunk) => {
      buffer.push(chunk);
    });
    fileStream.on("end", () => {
      resolve({
        name: ranNameFileUpload(filename),
        mimetype: mimetype,
        file: Buffer.concat(buffer),
      });
    });
  });
}

module.exports = {
  Upload: GraphQLUpload,
  Query: {
    events: async (parent, args) => {
      try {
        let query = {
          delete_status: false,
        };

        const {
          limit = 10,
          sorted_by = "created_at",
          sorted_order = "asc",
          page = 1,
          search = "",
          success_status = "both",
        } = args;

        /* calculate page */
        const skip_num = (page - 1) * limit;
        const limit_num = parseInt(limit);

        /* manage sort */
        const order = sorted_order === "asc" ? 1 : -1;

        if (sorted_by === "created_at") {
          sort = { "timestamp.created_at": order };
        }

        if (sorted_by === "end_date") sort = { end_date: order };

        if (search)
          query["name"] = {
            $regex: ".*" + search.trim() + ".*",
            $options: "i",
          };

        if (success_status !== "both") query["success_status"] = success_status;

        const events = await Event.find(query)
          .sort(sort)
          .limit(limit_num)
          .skip(skip_num);

        return events;
      } catch (error) {
        throw error;
      }
    },
    events_total: async (parent, args) => {
      try {
        let query = {
          delete_status: false,
        };

        const { search = "", success_status = "both" } = args;

        if (search)
          query["name"] = {
            $regex: ".*" + search.trim() + ".*",
            $options: "i",
          };

        if (success_status !== "both") query["success_status"] = success_status;

        const event_total = await Event.countDocuments(query);

        return event_total;
      } catch (error) {
        throw error;
      }
    },
    event: async (parent, args) => {
      try {
        const { event_id } = args;

        const event = await Event.findOne({ _id: event_id });

        const start_date = new Date(event.start_date);
        const end_date = new Date(event.end_date);

        const book_events = await BookEvent.aggregate([
          {
            $match: {
              $and: [
                { date_time: { $gte: start_date } },
                { date_time: { $lte: end_date } },
                { event_id: mongoose.Types.ObjectId(event_id) },
              ],
            },
          },
          {
            $group: {
              _id: "$date_time",
              count: { $sum: 1 },
            },
          },
        ]);

        if (book_events.length) {
          for (let book_date of book_events) {
            for (let month of event.calendars) {
              let find_book_date = month.date_of_month.find((val) => {
                return (
                  new Date(val.date).getTime() ===
                  new Date(book_date._id).getTime()
                );
              });
              if (find_book_date) {
                find_book_date["amont"] = event.unit_per_day - book_date.count;
                if (find_book_date["amont"] < 0) find_book_date["amont"] = 0;
              }
            }
          }
        }

        return event;
      } catch (error) {
        throw error;
      }
    },
  },
  Mutation: {
    createEvent: async (parent, args) => {
      try {
        const { name, detail, start_date, end_date, unit_per_day, calendars } =
          args;
        let create_event_obj = {
          name,
          detail,
          start_date,
          end_date,
          unit_per_day,
          calendars,
        };

        /* for test from tools*/
        if (typeof create_event_obj.calendars === "string") {
          const replace_all = create_event_obj.calendars.replace(/\'/g, '"');
          create_event_obj.calendars = JSON.parse(replace_all);
        }

        /* upload file */
        if (args.file) {
          const { createReadStream, filename, mimetype } = await args.file;
          create_event_obj.image = await steamfile(
            createReadStream,
            filename,
            mimetype
          );
        }

        const create_event = await Event.create(create_event_obj);

        return create_event;
      } catch (error) {
        throw error;
      }
    },
    updateEvent: async (parent, args) => {
      try {
        let update_event;
        const { name, detail, start_date, end_date, unit_per_day, calendars } =
          args;
        let update_event_obj = {
          name,
          detail,
          start_date,
          end_date,
          unit_per_day,
          calendars,
        };
        const _id = args.event_id;

        let find_event = await Event.findOne({ _id });
        if (!find_event) throw new Error(errorName.bad_request);

        /* upload file */
        if (args.file) {
          const { createReadStream, filename, mimetype } = await args.file;
          find_event.image = await steamfile(
            createReadStream,
            filename,
            mimetype
          );
        }

        update_event = find_event;

        /* update event */
        if (Object.keys(args).length !== 0 && args.constructor === Object) {
          if (typeof update_event_obj.calendars === "string")
            update_event_obj.calendars = JSON.parse(update_event_obj.calendars);

          Object.assign(find_event, { ...update_event_obj });
          update_event = await find_event.save();
        }

        return update_event;
      } catch (error) {
        throw error;
      }
    },
    deleteEvent: async (parent, args) => {
      try {
        const { event_id } = args;
        let find_event = await Event.findOne({ _id: event_id });
        if (!find_event) throw new Error(errorName.bad_request);

        find_event.delete_status = true;
        await find_event.save();

        return find_event
      } catch (error) {
        throw error;
      }
    },
  },
};
