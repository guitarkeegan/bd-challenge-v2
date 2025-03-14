import prisma from "../db.server";
import { ReviewNotFoundError, UnauthorizedReviewError } from "./errors";

// TODO: find type
export async function getProductsWithReviews(graphql: any) {

  // TODO: limit and paginate in the future
  const reviewedProducts = await prisma.review.findMany({
    select: { productId: true },
    distinct: ["productId"],
  });

  const productIds = reviewedProducts.map((p) => p.productId);

  if (productIds.length === 0) return [];

  // TODO: find type
  const response = await graphql.query({
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

  return response.body.data.nodes;
}

// TODO: get type for client
export async function getReviewsForProduct(shopifyClient: any, productId: string) {

  // assuming bespoke shop
  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  const response = await shopifyClient.query({
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
