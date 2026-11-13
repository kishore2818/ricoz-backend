const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!result.success) {
      const errorDetails = result.error.errors.map(e => ({
        field: e.path.join('.').replace(/^body\.|^query\.|^params\./, ''),
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }

    req.validated = result.data;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;

