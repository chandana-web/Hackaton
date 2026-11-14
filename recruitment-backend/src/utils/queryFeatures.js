
class QueryFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filters = {};
  }

  filter() {
    const excludedFields = [
      "page",
      "limit",
      "sort",
      "fields",
      "search",
    ];

    const filters = { ...this.queryString };

    excludedFields.forEach((field) => delete filters[field]);

    this.filters = filters;
    this.query = this.query.find(filters);

    return this;
  }

  sort() {
    const sortBy = this.queryString.sort || "-createdAt";
    this.query = this.query.sort(sortBy.replace(",", " "));
    return this;
  }

  selectFields() {
    if (this.queryString.fields) {
      this.query = this.query.select(
        this.queryString.fields.split(",").join(" ")
      );
    }

    return this;
  }

  paginate() {
    const page = Math.max(1, Number(this.queryString.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(this.queryString.limit) || 10)
    );

    this.page = page;
    this.limit = limit;

    this.query = this.query
      .skip((page - 1) * limit)
      .limit(limit);

    return this;
  }
}

module.exports = QueryFeatures;
