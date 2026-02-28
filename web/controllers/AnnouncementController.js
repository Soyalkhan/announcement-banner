import shopify from "../shopify.js";
import Announcement from "../models/Announcement.js";

// GET /api/announcement — Fetch current announcement
export const getAnnouncement = async (_req, res) => {
  const session = res.locals.shopify.session;

  try {
    const latest = await Announcement.findOne({ shop: session.shop }).sort({
      createdAt: -1,
    });

    const client = new shopify.api.clients.Graphql({ session });
    const metafieldData = await client.request(`
      query getAnnouncementMetafield {
        shop {
          metafield(namespace: "my_app", key: "announcement") {
            value
          }
        }
      }
    `);

    const currentText = metafieldData?.data?.shop?.metafield?.value || "";

    res.status(200).json({
      currentText,
      latestFromDb: latest
        ? { text: latest.text, createdAt: latest.createdAt }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch announcement:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/announcement — Save to MongoDB + Shopify metafield
export const saveAnnouncement = async (req, res) => {
  const session = res.locals.shopify.session;
  const { text } = req.body;

  if (typeof text !== "string") {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    // 1. Save to MongoDB (audit history)
    const announcement = new Announcement({ shop: session.shop, text });
    await announcement.save();

    // 2. Get shop GID for metafield mutation
    const client = new shopify.api.clients.Graphql({ session });
    const shopData = await client.request(`query { shop { id } }`);
    const shopGid = shopData.data.shop.id;

    // 3. Sync to Shopify metafield
    const metafieldResponse = await client.request(
      `mutation setAnnouncementMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              namespace: "my_app",
              key: "announcement",
              type: "single_line_text_field",
              value: text,
              ownerId: shopGid,
            },
          ],
        },
      }
    );

    const userErrors =
      metafieldResponse?.data?.metafieldsSet?.userErrors || [];
    if (userErrors.length > 0) {
      console.error("Metafield userErrors:", JSON.stringify(userErrors));
      return res.status(400).json({ error: userErrors[0].message });
    }

    res.status(200).json({
      success: true,
      announcement: {
        text: announcement.text,
        createdAt: announcement.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to save announcement:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/announcement — Clear announcement from metafield + mark in DB
export const deleteAnnouncement = async (_req, res) => {
  const session = res.locals.shopify.session;

  try {
    const client = new shopify.api.clients.Graphql({ session });

    // 1. Get shop GID for the metafield owner
    const shopData = await client.request(`query { shop { id } }`);
    const shopGid = shopData.data.shop.id;

    // 2. Delete the metafield using metafieldsDelete (plural, required for API 2024-10+)
    const deleteResponse = await client.request(
      `mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields {
            key
            namespace
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: shopGid,
              namespace: "my_app",
              key: "announcement",
            },
          ],
        },
      }
    );

    const userErrors =
      deleteResponse?.data?.metafieldsDelete?.userErrors || [];
    if (userErrors.length > 0) {
      console.error("Delete metafield errors:", JSON.stringify(userErrors));
      return res.status(400).json({ error: userErrors[0].message });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to delete announcement:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/announcement/history — Fetch audit history
export const getAnnouncementHistory = async (_req, res) => {
  const session = res.locals.shopify.session;

  try {
    const history = await Announcement.find({ shop: session.shop })
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ history });
  } catch (error) {
    console.error("Failed to fetch history:", error.message);
    res.status(500).json({ error: error.message });
  }
};
