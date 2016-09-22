# flow-GraphQL.js

Add flow-type outputs for [Graphql](https://github.com/graphql/graphql-js).<br/>
For convenience, also make a modified `express-graphql`->[t-express-graphql](https://github.com/iamchenxin/t-express-graphql) (It require `flow-graphql` inner insteadof `graphql`).<br/>
And, if you use Relay(Graphql relay server), there also has a Flow Typed [relayql](https://github.com/iamchenxin/relayql). But it is very different from [graphql-relay](https://github.com/graphql/graphql-relay-js). Because `graphql-relay` is not designed for a static Flow Type check.

# Changelog
## v0.7.0 (origin Graphql v0.7.0,with PR#479, cause tag v0.7.0 has some wrong Flow typo).
The Official Graphql upcoming release plan(So this flow-GraphQL was temporarily used until v0.8.0):<br/>

v0.7.0: Introduce all latest improvements and changes to graphql-js, but no flow-types.<br/>
v0.8.0-beta: Shortly after, a beta release will contain flow-types.<br/>
v0.8.0: After some time for people to test and report any issues, a new non-beta release will contain flow types.<br/>

## v0.6.7 (Graphql v0.6.2)
  Update to Graphql v0.6.2.
## v0.6.6 (Graphql v0.6.1)
  `GraphQLObjectTypeConfig<TSource>` to `GraphQLFieldResolveFn<TSource, TResult>`
Make user can do a whole top-bottom Flow check between their resolvers.
With the Flow typed feature, user can ensure his data structure is correspond to schema . ex: [starWarsData.js L103](https://github.com/graphql/graphql-js/commit/046cbba2732be8bbbef74f988fffd04294b583c2#diff-e6e81fa96fbb4bdccb4e3f0042b5f1a3R103)

More details see the [src/__tests__/starWarsSchema.js
](https://github.com/graphql/graphql-js/commit/046cbba2732be8bbbef74f988fffd04294b583c2#diff-14d97c822b45992f98d875d53ca45626R112)
A simple demonstration:
```
  type DCPost;
  type DComment;
  type DUser;
  const Post = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
      ...
      comment: {
        type: new GraphQLList(Comment),
        resolve: (src:DPost):DComment[] => { // Flow check DPost -> DComment[]
          return ...;
        } }
    }),
  });

  const Comment = new GraphQLObjectType({
    name: 'Comment',
    fields: () => ({
      ...
      user: {
        type: User,
        resolve: (src:DComment):DUser => { // DComment -> DUser
          return ...;
        }
      },
    }),
  });

  const User = new GraphQLObjectType({
      ...
  });
```

Note: Because in v0.61 ,in source code use a `any` type to force cast `TSource`. So it is user's responsibility to check the Data Type is not typo. In above code , if ` resolve: (src:DPost):DComment ` is typo to ` resolve: (src:DPost):DSomeAnotherType[] `(and user return a wrong data), Flow will still pass. Flow will not check `DSomeAnotherType` is `DComment`,cause of `DSomeAnotherType` -> `any` ->  `DComment`

## v0.6.5 (Graphql v0.6.1)
 update to the latest master (Graphql v0.6.1) 
 update Flow to 0.28

## v0.6.3 (Graphql v0.6.0)
modified `printSchema(schema)` to `printSchema(schema, printStyle?: 'alphabet'|'hierarchy')`:<br/>
```
type printStyle = 'alphabet' | 'hierarchy';
export function printSchema(
  schema: GraphQLSchema,style: printStyle = 'alphabet'): string {
  switch (style) {
    case 'hierarchy':
      return printFineSchema(schema, n => !isSpecDirective(n));
    case 'alphabet':
    default:
      return printFilteredSchema(schema, n => !isSpecDirective(n),
      isDefinedType);
  }
}
```
With `'hierarchy'` option( `printSchema(schema, 'hierarchy')` ), It will print schema as a leaf->root order.<br/>(The leaf Type is at the top, the root Type is at the bottom).<br/>

And `'alphabet'|void` ( `printSchema(schema)` ) will call the GraphQL's original `printSchema`.<br/>
The more detail `'hierarchy'` behaviour is in [unit test](https://github.com/iamchenxin/graphql-js/blob/8efc6f6a290798dd91d76570debe19deb3783df3/src/utilities/__tests__/schemaPrinter-test.js#L1593).