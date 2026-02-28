import { Card, EmptyState, Page } from "@shopify/polaris";

export default function NotFound() {
  return (
    <Page>
      <Card>
        <EmptyState heading="Page not found">
          <p>Check the URL and try again.</p>
        </EmptyState>
      </Card>
    </Page>
  );
}
