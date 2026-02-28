import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  TextField,
  Button,
  Banner,
  Text,
  InlineStack,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  Badge,
  Box,
  Divider,
  IndexTable,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useQuery, useMutation, useQueryClient } from "react-query";

function DashboardSkeleton() {
  return (
    <SkeletonPage narrowWidth title="">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={2} />
              <SkeletonBodyText lines={1} />
              <Box paddingBlockStart="200">
                <InlineStack align="end">
                  <SkeletonDisplayText size="small" />
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={4} />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  );
}

export default function AnnouncementPage() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["announcement"],
    queryFn: async () => {
      const response = await fetch("/api/announcement");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (data.currentText) {
        setText(data.currentText);
      }
    },
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["announcementHistory"],
    queryFn: async () => {
      const response = await fetch("/api/announcement/history");
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries(["announcement"]);
    queryClient.invalidateQueries(["announcementHistory"]);
  };

  const saveMutation = useMutation({
    mutationFn: async (announcementText) => {
      const response = await fetch("/api/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: announcementText }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save");
      }
      return response.json();
    },
    onSuccess: () => {
      shopify.toast.show("Announcement saved successfully!");
      invalidateAll();
    },
    onError: (error) => {
      shopify.toast.show(`Error: ${error.message}`, { isError: true });
    },
  });

  const handleSave = useCallback(() => {
    if (!text.trim()) {
      shopify.toast.show("Please enter announcement text", { isError: true });
      return;
    }
    saveMutation.mutate(text);
  }, [text, saveMutation, shopify]);

  const handleTextChange = useCallback((value) => {
    setText(value);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const historyItems = historyData?.history || [];
  const currentText = data?.currentText || "";

  const historyRowMarkup = historyItems.map((item, index) => {
    const isCurrent = item.text === currentText;
    return (
      <IndexTable.Row id={item._id || index} key={item._id || index} position={index}>
        <IndexTable.Cell>
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <Text as="span" variant="bodyMd" truncate>
              {item.text}
            </Text>
            {isCurrent && <Badge tone="success">Current</Badge>}
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodySm" tone="subdued">
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page narrowWidth>
      <TitleBar title="Announcement-Pro" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Create Announcement
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Enter the text you want to display as an announcement banner on
                your storefront. It will appear at the top of every page.
              </Text>

              {isError ? (
                <Banner tone="critical">
                  <p>Failed to load. Please refresh and try again.</p>
                </Banner>
              ) : (
                <>
                  <TextField
                    label="Announcement Text"
                    value={text}
                    onChange={handleTextChange}
                    autoComplete="off"
                    placeholder='e.g., "Sale 50% Off"'
                    helpText="This text will be displayed in the announcement bar on your storefront."
                    maxLength={200}
                    showCharacterCount
                  />
                  <InlineStack align="end">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      loading={saveMutation.isLoading}
                    >
                      Save
                    </Button>
                  </InlineStack>
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {currentText && (
          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Live Announcement
                  </Text>
                  <Badge tone="success">Live</Badge>
                </InlineStack>
                <Divider />
                <Text as="p" variant="bodyLg">
                  "{currentText}"
                </Text>
                {data?.latestFromDb && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    Last updated:{" "}
                    {new Date(data.latestFromDb.createdAt).toLocaleString()}
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Announcement History
              </Text>
              {isHistoryLoading ? (
                <SkeletonBodyText lines={4} />
              ) : historyItems.length > 0 ? (
                <IndexTable
                  itemCount={historyItems.length}
                  headings={[
                    { title: "Announcement Text" },
                    { title: "Date" },
                  ]}
                  selectable={false}
                >
                  {historyRowMarkup}
                </IndexTable>
              ) : (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No announcements yet. Create your first one above!
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
