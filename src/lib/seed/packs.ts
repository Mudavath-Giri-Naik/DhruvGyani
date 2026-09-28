/**
 * Pre-generated Studio packs so the demo works without an LLM key.
 * They are written from the SAMPLE documents in data.ts and cite them.
 * Pack "x-wrong-number" deliberately contains a wrong number (8 instead of
 * 6) so the Trust Panel demo can show the numbers check blocking approval.
 * Hindi text: machine-assisted draft — needs review by a Hindi speaker.
 */
import type { Citation, Generation } from "@/lib/types";
import { PROMPT_VERSION } from "@/lib/constants";
import { ITEM, ORG_ID, chunkId, items, sampleDocs, sid } from "./data";

const title = (id: string) => items.find((i) => i.id === id)?.title ?? "";

function cite(marker: string, itemId: string, page: number): Citation {
  return {
    marker,
    chunk_id: chunkId(itemId, page),
    item_id: itemId,
    item_title: title(itemId),
    page_no: page,
    quote: (sampleDocs[itemId]?.[page - 1] ?? "").replace(/^SAMPLE - not real data\.\s*/, "").slice(0, 180),
  };
}

const CURATOR = sid(12);
const REVIEWER = sid(13);
const t = (d: string) => `${d}T10:00:00.000Z`;

const r45 = [cite("c1", ITEM.r45, 1), cite("c2", ITEM.r45, 2), cite("c3", ITEM.r45, 3)];
const him = [cite("c1", ITEM.rHim, 1), cite("c2", ITEM.rHim, 2)];

type Pack = Omit<Generation, "org_id" | "prompt_version" | "updated_at" | "is_demo">;

const packs: Pack[] = [
  {
    id: sid(201), item_ids: [ITEM.r45], audience: "public", language: "en", channel: "website_article",
    model: "pre-generated demo", slug: "inside-a-sample-antarctic-field-log", status: "published",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2026-02-10"), published_at: t("2026-02-10"), created_at: t("2026-02-09"),
    citations: r45,
    output: {
      channel: "website_article",
      headline: "Inside a sample Antarctic summer field log",
      standfirst: "A walk-through of the fictional 45-ISEA sample field log, showing how DhruvGyani turns an expedition report into a cited story.",
      body: [
        { text: "The sample field team worked from Maitri between 8 January 2026 and 21 January 2026 [c1].", cites: ["c1"] },
        { text: "Along the coastal traverse, the team serviced 6 automatic weather stations and replaced batteries at 4 stations [c2]. Recorded air temperature during the servicing period ranged from -12.4 °C to 2.1 °C [c2].", cites: ["c2"] },
        { text: "The team also dug 12 snow pits and recorded snow density every 10 cm [c3]. Field sheets and photographs were uploaded to the archive for review [c3].", cites: ["c3"] },
      ],
      key_facts: [
        { text: "6 automatic weather stations serviced [c2]", cites: ["c2"] },
        { text: "12 snow pits dug, density recorded every 10 cm [c3]", cites: ["c3"] },
      ],
    },
  },
  {
    id: sid(202), item_ids: [ITEM.r45], audience: "public", language: "hi", channel: "website_article",
    model: "pre-generated demo", slug: "sample-antarctic-field-log-hindi", status: "published",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2026-02-11"), published_at: t("2026-02-11"), created_at: t("2026-02-10"),
    citations: r45,
    output: {
      channel: "website_article",
      headline: "एक नमूना अंटार्कटिक फ़ील्ड लॉग की झलक",
      standfirst: "45-ISEA के काल्पनिक नमूना फ़ील्ड लॉग की सरल व्याख्या, जो दिखाती है कि ध्रुवज्ञानी रिपोर्ट को स्रोत-सहित कहानी में कैसे बदलता है।",
      body: [
        { text: "नमूना फ़ील्ड टीम ने 8 जनवरी 2026 से 21 जनवरी 2026 के बीच मैत्री से काम किया [c1]।", cites: ["c1"] },
        { text: "तटीय मार्ग पर टीम ने 6 स्वचालित मौसम केंद्रों की सर्विसिंग की और 4 केंद्रों पर बैटरियाँ बदलीं [c2]। इस दौरान हवा का तापमान -12.4 °C से 2.1 °C के बीच दर्ज हुआ [c2]।", cites: ["c2"] },
        { text: "टीम ने 12 स्नो पिट खोदे और हर 10 cm पर बर्फ का घनत्व दर्ज किया [c3]।", cites: ["c3"] },
      ],
      key_facts: [
        { text: "6 स्वचालित मौसम केंद्रों की सर्विसिंग [c2]", cites: ["c2"] },
        { text: "12 स्नो पिट खोदे गए [c3]", cites: ["c3"] },
      ],
    },
  },
  {
    id: sid(203), item_ids: [ITEM.r45], audience: "school", language: "en", channel: "instagram",
    model: "pre-generated demo", slug: null, status: "approved",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2026-02-12"), published_at: null, created_at: t("2026-02-12"),
    citations: r45,
    output: {
      channel: "instagram",
      text: "What does a polar field day look like? In this sample field log, the team serviced 6 automatic weather stations [c2]. They also dug 12 snow pits to study snow layers [c3].",
      cites: ["c2", "c3"],
      hashtags: ["#PolarScience", "#Antarctica", "#DhruvGyani", "#SampleContent"],
      alt_text: "Illustration of a snowfield with distant ice hills under a pale sky.",
      image_suggestion: "Use the 'Snow-pit sampling' illustration from the 45-ISEA library.",
    },
  },
  {
    id: sid(204), item_ids: [ITEM.r45], audience: "school", language: "hi", channel: "instagram",
    model: "pre-generated demo", slug: null, status: "in_review",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: null, reviewed_by_name: null,
    reviewed_at: null, published_at: null, created_at: t("2026-02-13"),
    citations: r45,
    output: {
      channel: "instagram",
      text: "ध्रुवीय फ़ील्ड का एक दिन कैसा होता है? इस नमूना लॉग में टीम ने 6 स्वचालित मौसम केंद्रों की सर्विसिंग की [c2]। टीम ने बर्फ की परतें समझने के लिए 12 स्नो पिट भी खोदे [c3]।",
      cites: ["c2", "c3"],
      hashtags: ["#ध्रुवीयविज्ञान", "#अंटार्कटिका", "#ध्रुवज्ञानी"],
      alt_text: "हल्के आसमान के नीचे दूर बर्फीली पहाड़ियों वाला बर्फ का मैदान (चित्रण)।",
      image_suggestion: "45-ISEA लाइब्रेरी से 'Snow-pit sampling' चित्रण का उपयोग करें।",
    },
  },
  {
    id: sid(205), item_ids: [ITEM.r45], audience: "public", language: "en", channel: "x",
    model: "pre-generated demo", slug: null, status: "in_review",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: null, reviewed_by_name: null,
    reviewed_at: null, published_at: null, created_at: t("2026-02-14"),
    citations: r45,
    output: {
      channel: "x",
      // Deliberate error for the Trust Panel demo: the source says 6 stations.
      text: "Sample field log: the team serviced 8 automatic weather stations along the coastal traverse [c2]. Air temperature ranged from -12.4 °C to 2.1 °C [c2].",
      cites: ["c2"],
      hashtags: ["#PolarScience"],
    },
  },
  {
    id: sid(206), item_ids: [ITEM.rHim], audience: "college", language: "en", channel: "website_article",
    model: "pre-generated demo", slug: "sample-himalayan-glacier-field-notes", status: "published",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2025-10-20"), published_at: t("2025-10-20"), created_at: t("2025-10-18"),
    citations: him,
    output: {
      channel: "website_article",
      headline: "Measuring a glacier, stake by stake (sample)",
      standfirst: "How a fictional Himalayan field season re-measured an ablation stake network — a sample story built from sample field notes.",
      body: [
        { text: "The sample glacier team worked near Himansh from 1 September 2025 to 5 October 2025 [c1]. They re-measured a network of 34 ablation stakes on the glacier tongue [c1].", cites: ["c1"] },
        { text: "Snow density was measured at 3 accumulation-zone pits above 4,850 m [c2]. Debris cover on the lower tongue made several stakes hard to reach, and the team recommends replacing 5 stakes next season [c2].", cites: ["c2"] },
      ],
      key_facts: [
        { text: "34 ablation stakes re-measured [c1]", cites: ["c1"] },
        { text: "3 snow-density pits above 4,850 m [c2]", cites: ["c2"] },
      ],
    },
  },
];

export const seedGenerations: Generation[] = packs.map((p) => ({
  ...p,
  org_id: ORG_ID,
  prompt_version: PROMPT_VERSION,
  updated_at: p.reviewed_at ?? p.created_at,
  is_demo: true,
}));
