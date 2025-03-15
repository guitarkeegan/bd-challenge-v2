import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { json } from "@remix-run/node";
import { createReview } from "../../models/review.server";
import { dbg } from "app/utils/dbg";

export const action = async (args: ActionFunctionArgs) => {

  dbg("create review");
  const { admin, session } = await authenticate.public.appProxy(args.request);
  let productId = args.params.productId as string;

  // Debug the received product ID
  dbg('  original productId received:', productId);

  // Decode if it's partially or fully encoded
  try {
    productId = decodeURIComponent(productId);
    dbg('  decoded productId:', productId);
  } catch (e) {
    // If decoding fails, continue with the original value
    dbg('  error decoding productId, using as is: err:', e);
  }

  dbg("  productId:", productId);

  if (!productId) {
    return json({ error: "product ID is required" }, { status: 400 });
  }

  try {
    dbg("  try");
    // Parse the form data
    const formData = await args.request.formData();

    dbg("  formData:", formData);
    const rating = parseInt(formData.get("rating") as string);
    const message = formData.get("message") as string;
    const customerId = formData.get("customerId") as string;

    if (!rating || !message || !customerId) {
      return json({
        error: "Rating, message, and customer ID are required"
      }, { status: 400 });
    }

    dbg("  check rating...");

    if (rating < 1 || rating > 5) {
      return json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = await createReview({
      productId,
      customerId,
      rating,
      message
    });

    dbg("  review:", review);

    dbg("end");

    return json({ success: true, review });
  } catch (error) {
    console.error("Error creating review:", error);
    return json({ error: "Failed to create review" }, { status: 500 });
  }
};
