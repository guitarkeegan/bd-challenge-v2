import { dbg } from "app/utils/dbg";
import prisma from "../db.server";
import { ReviewNotFoundError, UnauthorizedReviewError } from "./errors";

export async function getPendingReviews() {
  dbg("getPendingReviews")
  return prisma.review.findMany({
    where: { approved: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReviewStats() {
  dbg("getReviewStats");
  const pendingCount = await prisma.review.count({
    where: { approved: false },
  });

  const totalCount = await prisma.review.count();

  dbg("  totalCount:", totalCount);
  // Calculate average rating
  const ratingSum = await prisma.review.aggregate({
    _sum: { rating: true },
  });

  dbg("  ratingSum:", ratingSum);

  const averageRating = totalCount > 0
    ? (ratingSum._sum.rating || 0) / totalCount
    : 0;

  dbg("  averageRating:", averageRating);
  dbg("end");
  return {
    pendingCount,
    totalCount,
    averageRating,
  };
}
// TODO: find type
export async function getProductsWithReviews(graphql: any) {

  dbg("getProductsWithReviews");

  // TODO: limit and paginate in the future
  const reviewedProducts = await prisma.review.findMany({
    select: { productId: true },
    distinct: ["productId"],
  });

  const productIds = reviewedProducts.map((p) => p.productId);

  dbg("  productIds:", productIds);

  if (productIds.length === 0) return [];

  // Maybe validate id formats here?

  // TODO: find type
  const response = await graphql({
    data: {
      query: `#graphql
        query GetProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              featuredImage {
                altText
                url
              }
            }
          }
        }`,
      variables: { ids: productIds },
    },
  });

  dbg("  response:", response);

  dbg("end");

  return response.body.data.nodes;
}

// TODO: get type for client
export async function getReviewsForProduct(graphql: any, productId: string) {

  // assuming bespoke shop
  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  const response = await graphql.query({
    data: {
      query: `#graphql
        query GetProduct($id: ID!) {
          product(id: $id) {
            id
            title
            featuredImage {
              altText
              url
            }
          }
        }`,
      variables: { id: productId },
    },
  });

  return { product: response.body.data.product, reviews };
}

export async function createReview({
  productId,
  customerId,
  rating,
  message,
}: {
  productId: string;
  customerId: string;
  rating: number;
  message: string;
}) {
  return prisma.review.create({
    data: { productId, customerId, rating, message },
  });
}

export async function getReviewsByProduct(productId: string) {
  return prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" }, // Latest reviews first
  });
}

export async function updateReview(customerId: string, reviewId: string, message: string, rating: number) {
  // Find the review first to check ownership
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new ReviewNotFoundError();
  }

  if (review.customerId !== customerId) {
    throw new UnauthorizedReviewError();
  }
  // Proceed with the update
  return prisma.review.update({
    where: { id: reviewId },
    data: { message, rating, updatedAt: new Date() },
  });
}

export async function approveReview(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { approved: true },
  });
}

// Delete a review
export async function deleteReview(reviewId: string) {
  return prisma.review.delete({ where: { id: reviewId } });
}
