import { json, type LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useActionData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Button,
  BlockStack,
  Layout,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getPendingReviews, approveReview } from "../models/review.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const reviewId = formData.get("reviewId") as string;
  const action = formData.get("action") as string;

  if (action === "approve" && reviewId) {
    try {
      await approveReview(reviewId);
      return json({ success: true, message: "Review approved successfully" });
    } catch (error) {
      console.error("Error approving review:", error);
      return json({ success: false, message: "Failed to approve review" }, { status: 500 });
    }
  }

  return json({ success: false, message: "Invalid action" }, { status: 400 });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Get pending reviews that need approval
  const pendingReviews = await getPendingReviews();

  return json({
    pendingReviews
  });
};

export default function AdminDashboard() {
  const { pendingReviews } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Page title="Review Management">
      {actionData?.message && (
        <div style={{ marginBottom: "20px" }}>
          <Banner
            tone={actionData.success ? "success" : "critical"}
          >
            {actionData.message}
          </Banner>
        </div>
      )}
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Pending Reviews ({pendingReviews.length})</Text>

                {pendingReviews.length === 0 ? (
                  <Text as="p">No pending reviews to approve.</Text>
                ) : (
                  <BlockStack gap="400">
                    {pendingReviews.map((review) => (
                      <Card key={review.id}>
                        <BlockStack gap="200">
                          <Text as="p" >Product ID: {review.productId}</Text>
                          <Text as="p">Rating: {review.rating}/5</Text>
                          <Text as="p">Message: {review.message}</Text>
                          <Text as="p">Customer: {review.customerId}</Text>
                          <Text as="p">Date: {new Date(review.createdAt).toLocaleDateString()}</Text>
                          <div style={{ marginTop: "10px" }}>
                            <Form method="post">
                              <input type="hidden" name="reviewId" value={review.id} />
                              <input type="hidden" name="action" value="approve" />
                              <Button submit>Approve Review</Button>
                            </Form>
                          </div>
                        </BlockStack>
                      </Card>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
