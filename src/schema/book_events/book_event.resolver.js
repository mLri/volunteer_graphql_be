/* include models */
const BookEvent = require("../../models/book_event.model");
const Event = require("../../models/event.model");

/* include helpers */
const { errorName } = require("../../helpers/handle_error_gql.helper");

module.exports = {
  Query: {
    bookEvents: async (parent, args) => {
      try {
        let query = {};
        const {
          limit = 10,
          sorted_by = "created_at",
          sorted_order = "asc",
          page = 1,
          event_id,
        } = args;

        /* calculate page */
        const skip_num = (page - 1) * limit;
        const limit_num = parseInt(limit);

        /* manage sort */
        const order = sorted_order === "asc" ? 1 : -1;
        if (sorted_by === "created_at") {
          sort = { "timestamp.created_at": order };
        }

        if (event_id) query.event_id = event_id;

        const book_events = await BookEvent.find(query, field_option)
          .sort(sort)
          .limit(limit_num)
          .skip(skip_num);

        return book_events;
      } catch (error) {
        throw error;
      }
    },
    bookEventsTotal: async (parent, args) => {
      try {
        let query = {};
        const { event_id } = args;
        if (event_id) query.event_id = event_id;
        const book_event_total = await BookEvent.countDocuments(query);
        return book_event_total;
      } catch (error) {
        throw error;
      }
    },
    bookEvent: async (parent, args) => {
      try {
        const { book_event_id } = args;

        const book_event = await BookEvent.findOne({ _id: book_event_id });
        return book_event;
      } catch (error) {
        throw error;
      }
    },
  },
  Mutation: {
    createBookEvent: async (parent, args) => {
      try {
        const {
          event_id,
          prefix,
          firstname,
          lastname,
          employee_id,
          institution,
          tel,
          date_time,
        } = args;

        const d = new Date(date_time);
        const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        const is_dup = await BookEvent.findOne({
          event_id,
          employee_id,
          date_time: dt,
        });
        if (is_dup) throw new Error(errorName.duplicate);

        const { unit_per_day } = await Event.findOne(
          { _id: event_id },
          { _id: 0, unit_per_day: 1 }
        ).lean();
        const count_book_vaccine = await BookEvent.countDocuments({
          event_id,
          date_time: dt,
        });
        if (count_book_vaccine >= unit_per_day)
          throw new Error(errorName.bad_request);

        const create_data = {
          event_id,
          prefix,
          firstname,
          lastname,
          employee_id,
          institution,
          tel,
          date_time: dt,
        };

        const create_book_vaccine = await BookEvent.create(create_data);

        return create_book_vaccine;
      } catch (error) {
        throw error;
      }
    },
    updateBookEvent: async (parent, args) => {
      try {
        const { book_event_id } = args;
        delete args.book_event_id;

        let book_event = await BookEvent.findOne({ _id: book_event_id });
        if (!book_event) throw new Error(errorName.not_found);

        Object.assign(book_event, { ...args });

        const update_book_event = await book_event.save();

        return update_book_event;
      } catch (error) {
        throw error;
      }
    },
    deleteBookEvent: async (parent, args) => {
      try {
        const { book_event_id } = args;

        const delete_book_event = await BookEvent.findByIdAndDelete({
          _id: book_event_id,
        });
        if (!delete_book_event) throw new Error(errorName.not_found);

        return delete_book_event;
      } catch (error) {
        throw error;
      }
    },
  },
};
