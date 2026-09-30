/**
 * Pre-generated Studio packs so the portal works without an LLM key.
 * They are written from the archive notes in data.ts and cite them, so every
 * number traces back to the source page named on the item.
 * Pack 205 deliberately contains a wrong number (80 polar bears instead of
 * 60) and sits in review, so the Trust Panel can show the numbers check
 * blocking approval. It is never published.
 * Hindi text: machine-assisted draft — needs review by a Hindi speaker.
 */
import type { Citation, Explainer, Generation } from "@/lib/types";
import { PROMPT_VERSION } from "@/lib/constants";
import { ITEM, ORG_ID, archiveNotes, chunkId, items, sid } from "./data";

const title = (id: string) => items.find((i) => i.id === id)?.title ?? "";

function cite(marker: string, itemId: string, page: number): Citation {
  return {
    marker,
    chunk_id: chunkId(itemId, page),
    item_id: itemId,
    item_title: title(itemId),
    page_no: page,
    quote: (archiveNotes[itemId]?.[page - 1] ?? "").slice(0, 180),
  };
}

const CURATOR = sid(12);
const REVIEWER = sid(13);
const t = (d: string) => `${d}T10:00:00.000Z`;

const mosaic = [cite("c1", ITEM.rMosaic, 1), cite("c2", ITEM.rMosaic, 2), cite("c3", ITEM.rMosaic, 3)];
const mosaicHi = [cite("c1", ITEM.rMosaicHi, 1), cite("c2", ITEM.rMosaicHi, 2)];
const ross = [cite("c1", ITEM.rRoss, 1), cite("c2", ITEM.rRoss, 2)];

type Pack = Omit<Generation, "org_id" | "prompt_version" | "updated_at" | "is_demo">;

const packs: Pack[] = [
  {
    id: sid(201), item_ids: [ITEM.rMosaic], audience: "public", language: "en", channel: "website_article",
    model: "pre-generated demo", slug: "a-year-in-the-arctic-ice-mosaic-in-numbers", status: "published",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2026-09-22"), published_at: t("2026-09-22"), created_at: t("2026-09-21"),
    citations: mosaic,
    output: {
      channel: "website_article",
      headline: "A year in the Arctic ice: MOSAiC in numbers",
      standfirst: "What it took to freeze a research icebreaker into the sea ice and drift with it for a year, told through the expedition's own figures.",
      body: [
        { text: "The research icebreaker Polarstern sailed from Tromsø on 20 September 2019, and the MOSAiC expedition lasted 389 days [c1]. 442 experts from 20 nations travelled to the Arctic in phases during the year [c1].", cites: ["c1"] },
        { text: "Polarstern spent 10 months frozen into the sea ice and drifted 3400 km with it [c2]. The drift took the ship to within 156 kilometres of the North Pole [c2]. The lowest temperature measured was -42.3 °C, on 10 March 2020 [c2].", cites: ["c2"] },
        { text: "The team sighted 60 polar bears during the year [c3]. 247 monitoring stations were set up on the ice, up to 50 km from the ship [c3].", cites: ["c3"] },
      ],
      key_facts: [
        { text: "389 days, 442 experts from 20 nations [c1]", cites: ["c1"] },
        { text: "A 3400 km drift with the sea ice [c2]", cites: ["c2"] },
        { text: "60 polar bears sighted [c3]", cites: ["c3"] },
      ],
    },
  },
  {
    id: sid(202), item_ids: [ITEM.rMosaicHi], audience: "public", language: "hi", channel: "website_article",
    model: "pre-generated demo", slug: "mosaic-abhiyan-aankdon-mein", status: "published",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2026-09-23"), published_at: t("2026-09-23"), created_at: t("2026-09-22"),
    citations: mosaicHi,
    output: {
      channel: "website_article",
      headline: "आर्कटिक की बर्फ में एक साल: आँकड़ों में मोज़ेक अभियान",
      standfirst: "एक अनुसंधान पोत को समुद्री बर्फ में जमाकर साल भर उसके साथ बहने की कहानी, अभियान के अपने आँकड़ों में।",
      body: [
        { text: "अनुसंधान पोत पोलरस्टर्न 20 सितंबर 2019 को ट्रोम्सो से रवाना हुआ और अभियान 389 दिन चला [c1]। 20 देशों के 442 विशेषज्ञ इसमें शामिल हुए [c1]।", cites: ["c1"] },
        { text: "पोत 10 महीने समुद्री बर्फ में जमा रहा और बर्फ के साथ 3400 km बहा [c2]। सबसे कम तापमान -42.3 °C दर्ज हुआ [c2]।", cites: ["c2"] },
        { text: "टीम ने वर्ष भर में 60 ध्रुवीय भालू देखे [c2]।", cites: ["c2"] },
      ],
      key_facts: [
        { text: "389 दिन, 20 देशों के 442 विशेषज्ञ [c1]", cites: ["c1"] },
        { text: "बर्फ के साथ 3400 km का बहाव [c2]", cites: ["c2"] },
      ],
    },
  },
  {
    id: sid(203), item_ids: [ITEM.rMosaic], audience: "school", language: "en", channel: "instagram",
    model: "pre-generated demo", slug: null, status: "approved",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2026-09-24"), published_at: null, created_at: t("2026-09-24"),
    citations: mosaic,
    output: {
      channel: "instagram",
      text: "On the MOSAiC expedition, Polarstern spent 10 months frozen into the sea ice and drifted 3400 km with it [c2]. The team sighted 60 polar bears during the year [c3].",
      cites: ["c2", "c3"],
      hashtags: ["#PolarScience", "#Arctic", "#MOSAiC", "#DhruvGyani"],
      alt_text: "An icebreaker moored against an ice floe at sunset, with people and equipment spread out on the ice.",
      image_suggestion: "Use “Setting up the MOSAiC ice camp beside Polarstern” (Stefan Hendricks / AWI, CC BY-SA 4.0) and keep the credit.",
    },
  },
  {
    id: sid(204), item_ids: [ITEM.rMosaicHi], audience: "school", language: "hi", channel: "instagram",
    model: "pre-generated demo", slug: null, status: "in_review",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: null, reviewed_by_name: null,
    reviewed_at: null, published_at: null, created_at: t("2026-09-25"),
    citations: mosaicHi,
    output: {
      channel: "instagram",
      text: "मोज़ेक अभियान में पोत 10 महीने समुद्री बर्फ में जमा रहा और बर्फ के साथ 3400 km बहा [c2]। टीम ने वर्ष भर में 60 ध्रुवीय भालू देखे [c2]।",
      cites: ["c2"],
      hashtags: ["#ध्रुवीयविज्ञान", "#आर्कटिक", "#ध्रुवज्ञानी"],
      alt_text: "सूर्यास्त के समय बर्फ की चादर से लगा एक हिमभंजक पोत, बर्फ पर लोग और उपकरण।",
      image_suggestion: "“Setting up the MOSAiC ice camp beside Polarstern” (Stefan Hendricks / AWI, CC BY-SA 4.0) का उपयोग करें और श्रेय बनाए रखें।",
    },
  },
  {
    id: sid(205), item_ids: [ITEM.rMosaic], audience: "public", language: "en", channel: "x",
    model: "pre-generated demo", slug: null, status: "in_review",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: null, reviewed_by_name: null,
    reviewed_at: null, published_at: null, created_at: t("2026-09-26"),
    citations: mosaic,
    output: {
      channel: "x",
      // Deliberate error for the Trust Panel demo: the source says 60 polar bears.
      text: "MOSAiC in numbers: the team sighted 80 polar bears during the year [c3]. The lowest temperature measured was -42.3 °C [c2].",
      cites: ["c2", "c3"],
      hashtags: ["#PolarScience"],
    },
  },
  {
    id: sid(206), item_ids: [ITEM.rRoss], audience: "college", language: "en", channel: "website_article",
    model: "pre-generated demo", slug: "penguins-and-lava-flows-on-ross-island", status: "published",
    created_by: CURATOR, created_by_name: "Sample Curator", reviewed_by: REVIEWER, reviewed_by_name: "Sample Reviewer",
    reviewed_at: t("2026-09-18"), published_at: t("2026-09-18"), created_at: t("2026-09-17"),
    citations: ross,
    output: {
      channel: "website_article",
      headline: "Penguins and lava flows on Ross Island",
      standfirst: "A 2007 Woods Hole expedition paired penguin biologists with geologists to read Antarctica's past and present.",
      body: [
        { text: "The Penguins and Lava Flows Expedition ran from 26 November to 23 December 2007 on Ross Island and at Mt. Morning in Antarctica [c1].", cites: ["c1"] },
        { text: "The biologists continued a 55-year-long study of Adélie penguins [c2]. About 4,000 Adélie penguin pairs and their chicks live at Cape Royds, and about 100,000 pairs live at Cape Crozier [c2].", cites: ["c2"] },
        { text: "The geologists studied how lava flows that erupted between 25,000 and 300,000 years ago have weathered, to learn about past climate and the history of the ice sheet [c2].", cites: ["c2"] },
      ],
      key_facts: [
        { text: "A 55-year-long study of Adélie penguins [c2]", cites: ["c2"] },
        { text: "About 100,000 penguin pairs at Cape Crozier [c2]", cites: ["c2"] },
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

/** Pre-generated explainers for the flagship archive note (works without an LLM key). */
export const seedExplainers: Explainer[] = [
  {
    item_id: ITEM.rMosaic,
    level: "school",
    language: "en",
    text: "MOSAiC was a big science trip to the Arctic, the icy area around the North Pole [c1]. A ship called Polarstern let itself freeze into the sea ice and floated along with it for 10 months [c2]. It got very cold: the lowest temperature was -42.3 °C [c2]. The team also saw 60 polar bears during the year [c3].",
    citations: mosaic,
  },
  {
    item_id: ITEM.rMosaic,
    level: "college",
    language: "en",
    text: "MOSAiC was a year-long drift expedition led by the Alfred Wegener Institute: Polarstern left Tromsø on 20 September 2019 and the expedition lasted 389 days, with 442 experts from 20 nations taking part [c1]. The ship spent 10 months frozen into the sea ice and drifted 3400 km, coming within 156 kilometres of the North Pole [c2]. 247 monitoring stations were set up on the ice, up to 50 km from the ship [c3].",
    citations: mosaic,
  },
  {
    item_id: ITEM.rMosaic,
    level: "expert",
    language: "en",
    text: "Drift observatory summary: Polarstern departed Tromsø on 20 September 2019; total duration 389 days; 442 participants from 20 nations [c1]. 10 months beset, 3400 km of drift, 300 days on the first floe and 30 days on a second [c2]. Minimum air temperature -42.3 °C on 10 March 2020 [c2]. Distributed network of 247 monitoring stations out to 50 km; deepest ocean measurement 4,297 m and highest atmospheric measurement 36,278 m [c3].",
    citations: mosaic,
  },
  {
    item_id: ITEM.rMosaic,
    level: "school",
    language: "hi",
    text: "मोज़ेक आर्कटिक की बड़ी विज्ञान यात्रा थी [c1]। पोलरस्टर्न नाम का जहाज़ 10 महीने समुद्री बर्फ में जमा रहा और बर्फ के साथ बहता गया [c2]। वहाँ बहुत ठंड थी: सबसे कम तापमान -42.3 °C था [c2]। टीम ने साल भर में 60 ध्रुवीय भालू भी देखे [c3]।",
    citations: mosaic,
  },
];
