import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Card,
  Text,
  Button,
  BlockStack,
  Layout
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getPendingReviews } from "../models/review.server";

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

  return (
    <Page title="Review Management">
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
                          <Text as="p">Product ID: {review.productId}</Text>
                          <Text as="p">Rating: {review.rating}/5</Text>
                          <Text as="p">Message: {review.message}</Text>
                          <Text as="p">Customer: {review.customerId}</Text>
                          <Text as="p">Date: {new Date(review.createdAt).toLocaleDateString()}</Text>
                          <div style={{ marginTop: "10px" }}>
                            <form method="post" action={`/app/reviews/${review.id}/approve`}>
                              <input type="hidden" name="reviewId" value={review.id} />
                              <Button submit>Approve Review</Button>
                            </form>
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
