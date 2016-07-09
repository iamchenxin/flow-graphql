# flow-GraphQL.js

Add flow-type outputs for [Graphql v0.6.0](https://github.com/graphql/graphql-js)

# Changelog
## v0.6.5 (Graphql v0.6.1)
 update to the latest master (Graphql v0.6.1) 
 update Flow to 0.28

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



## v0.6.3 (Graphql v0.6.0)
printSchema to this
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