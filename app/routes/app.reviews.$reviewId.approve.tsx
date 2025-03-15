import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { approveReview } from "../models/review.server";
import { dbg } from "app/utils/dbg";

export async function action({ request, params }: ActionFunctionArgs) {
  dbg("aprove");
  const { admin, session } = await authenticate.admin(request);

  const reviewId = params.reviewId;

  dbg("  reviewId", reviewId);

  if (!reviewId) {
    return json({ error: "Review ID is required" }, { status: 400 });
  }

  try {
    dbg("  try");
    // Call your model function to approve the review
    await approveReview(reviewId);

    dbg("end");
    // Redirect back to the admin dashboard
    return redirect("/app");
  } catch (error) {
    console.error("Error approving review:", error);
    return json({ error: "Failed to approve review" }, { status: 500 });
  }
}

// This route doesn't render anything, it just processes the form action
export default function ApproveReviewRoute() {
  return null;
}
