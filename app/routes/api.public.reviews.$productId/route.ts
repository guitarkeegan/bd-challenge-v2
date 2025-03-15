import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { getReviewsByProduct } from "../../models/review.server";
import { dbg } from "app/utils/dbg";

export async function loader({ request, params }: LoaderFunctionArgs) {

  dbg("reviews");

  const { admin } = await authenticate.public.appProxy(request);

  const productId = params.productId as string;

  dbg("  productId:", productId);

  if (!productId) {
    return json({ error: "Product ID is required" }, { status: 400 });
  }

  try {
    dbg("  try");
    // Get approved reviews for this product
    const reviews = await getReviewsByProduct(productId);
    const approvedReviews = reviews.filter(review => review.approved);

    dbg("  reviews:", reviews);

    // Calculate average rating
    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;

    dbg("  totalRating:", totalRating);
    dbg("  averageRating:", averageRating);

    dbg("end");

    return json({
      reviews: approvedReviews,
      averageRating,
      totalReviews: approvedReviews.length
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
