// validate(schema) parses req.body with a zod schema and replaces it with the cleaned result.
export const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body ?? {});
  next();
};
