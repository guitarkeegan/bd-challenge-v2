export class ReviewNotFoundError extends Error {
  constructor() {
    super("Review not found");
    this.name = "ReviewNotFoundError";
  }
}

export class UnauthorizedReviewError extends Error {
  constructor() {
    super("Unauthorized: You can only edit your own review");
    this.name = "UnauthorizedReviewError";
  }
}
