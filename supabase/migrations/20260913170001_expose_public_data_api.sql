-- Expose public (and GraphQL) so PostgREST can serve keep-alive inserts.
-- New projects disable the Data API until schemas are listed here.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public';
notify pgrst, 'reload config';
