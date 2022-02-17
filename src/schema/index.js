const path = require("path")
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { loadSchemaSync } = require("@graphql-tools/load");
const { GraphQLFileLoader } = require("@graphql-tools/graphql-file-loader");
const { loadFilesSync } = require("@graphql-tools/load-files");

/* merge typeDefs */
const typeDefs = loadSchemaSync("./**/*.graphql", {
  loaders: [new GraphQLFileLoader()],
});

/* merge resolvers */
const resolvers = loadFilesSync(path.join(__dirname, "./**/*.resolver.*"));

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
});
