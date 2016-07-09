# flow-GraphQL.js

Add flow-type outputs for [Graphql v0.6.0](https://github.com/graphql/graphql-js)

# Changelog
## v0.6.5 (Graphql v0.6.1)
 update to the latest master (Graphql v0.6.1) 
 update Flow to 0.28

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