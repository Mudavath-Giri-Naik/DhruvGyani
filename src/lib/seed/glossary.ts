import type { GlossaryTerm } from "@/lib/types";

/**
 * Polar glossary: short, general-audience definitions.
 * NOTE: Hindi terms and meanings are machine-assisted drafts and NEED HUMAN
 * REVIEW by a Hindi-speaking subject expert before public launch.
 */
const raw: [string, string, string, string][] = [
  ["cryosphere", "हिममंडल", "All the frozen water on Earth: snow, sea ice, glaciers, ice sheets and frozen ground.", "पृथ्वी पर जमा हुआ सारा पानी: बर्फ, समुद्री बर्फ, हिमनद, हिम चादरें और जमी हुई ज़मीन।"],
  ["ice core", "हिम कोर", "A long cylinder of ice drilled out of a glacier or ice sheet. Its layers hold clues about past climate.", "हिमनद या हिम चादर से ड्रिल करके निकाला गया बर्फ का लंबा बेलन। इसकी परतों में पुराने जलवायु के सुराग होते हैं।"],
  ["katabatic wind", "कैटाबेटिक पवन", "Cold, heavy air that flows downhill off high ice, often very strongly.", "ऊँची बर्फ से ढलान पर नीचे बहने वाली ठंडी, भारी हवा, जो अक्सर बहुत तेज़ होती है।"],
  ["polynya", "पॉलिन्या", "An area of open water surrounded by sea ice.", "समुद्री बर्फ से घिरा खुले पानी का क्षेत्र।"],
  ["ice shelf", "हिम शेल्फ", "A thick floating platform of ice where an ice sheet flows from land onto the ocean.", "बर्फ का मोटा तैरता मंच, जहाँ हिम चादर ज़मीन से समुद्र पर बहती है।"],
  ["permafrost", "पर्माफ्रॉस्ट", "Ground that stays frozen for at least two years in a row.", "ऐसी ज़मीन जो लगातार कम से कम दो साल तक जमी रहती है।"],
  ["krill", "क्रिल", "Small shrimp-like animals in the ocean that many whales, seals and penguins eat.", "समुद्र में रहने वाले छोटे झींगे जैसे जीव, जिन्हें कई व्हेल, सील और पेंगुइन खाते हैं।"],
  ["Southern Ocean", "दक्षिणी महासागर", "The ocean that surrounds Antarctica.", "अंटार्कटिका को घेरने वाला महासागर।"],
  ["sea ice", "समुद्री बर्फ", "Ice that forms when ocean water freezes.", "समुद्र का पानी जमने से बनी बर्फ।"],
  ["glacier", "हिमनद", "A large, slow-moving mass of ice formed from snow that builds up over many years.", "कई वर्षों में जमा हुई बर्फ से बना, धीरे-धीरे खिसकने वाला बर्फ का बड़ा पिंड।"],
  ["ice sheet", "हिम चादर", "A huge layer of glacial ice covering land, like those on Antarctica and Greenland.", "ज़मीन को ढकने वाली हिमनदी बर्फ की विशाल परत, जैसे अंटार्कटिका और ग्रीनलैंड पर।"],
  ["iceberg", "हिमखंड", "A large piece of freshwater ice that has broken off a glacier or ice shelf and floats in the sea.", "हिमनद या हिम शेल्फ से टूटकर समुद्र में तैरता मीठे पानी की बर्फ का बड़ा टुकड़ा।"],
  ["calving", "काल्विंग", "When chunks of ice break off the edge of a glacier or ice shelf.", "जब हिमनद या हिम शेल्फ के किनारे से बर्फ के टुकड़े टूटकर गिरते हैं।"],
  ["albedo", "एल्बिडो", "How much sunlight a surface reflects. Fresh snow reflects a lot; dark ocean reflects little.", "कोई सतह कितनी धूप परावर्तित करती है। ताज़ी बर्फ बहुत, और गहरा समुद्र कम परावर्तित करता है।"],
  ["aurora", "ध्रुवीय ज्योति", "Glowing lights in the night sky near the poles, caused by charged particles from the Sun.", "ध्रुवों के पास रात के आकाश में चमकती रोशनी, जो सूर्य से आए आवेशित कणों से बनती है।"],
  ["polar night", "ध्रुवीय रात", "A period in polar winter when the Sun stays below the horizon all day.", "ध्रुवीय सर्दियों का वह समय जब सूर्य पूरे दिन क्षितिज के नीचे रहता है।"],
  ["midnight sun", "मध्यरात्रि सूर्य", "A period in polar summer when the Sun stays above the horizon all day and night.", "ध्रुवीय गर्मियों का वह समय जब सूर्य दिन-रात क्षितिज के ऊपर रहता है।"],
  ["blizzard", "बर्फ़ीला तूफ़ान", "A severe snowstorm with strong winds and very low visibility.", "तेज़ हवाओं और बहुत कम दृश्यता वाला भीषण बर्फ़ीला तूफ़ान।"],
  ["crevasse", "दरार", "A deep crack in a glacier or ice sheet.", "हिमनद या हिम चादर में गहरी दरार।"],
  ["moraine", "हिमोढ़", "Rocks and soil carried and left behind by a glacier.", "हिमनद द्वारा बहाकर लाई और छोड़ी गई चट्टानें और मिट्टी।"],
  ["fast ice", "स्थिर बर्फ", "Sea ice that is attached to the coast or the sea floor and does not drift.", "समुद्री बर्फ जो तट या समुद्र तल से जुड़ी रहती है और बहती नहीं।"],
  ["pack ice", "पैक बर्फ", "Sea ice that floats freely and moves with winds and currents.", "समुद्री बर्फ जो स्वतंत्र रूप से तैरती है और हवा व धाराओं के साथ चलती है।"],
  ["ozone hole", "ओज़ोन छिद्र", "A seasonal thinning of the ozone layer, observed over Antarctica.", "ओज़ोन परत का मौसमी पतलापन, जो अंटार्कटिका के ऊपर देखा जाता है।"],
  ["phytoplankton", "पादप प्लवक", "Tiny plant-like organisms drifting in the ocean that make food using sunlight.", "समुद्र में बहने वाले सूक्ष्म पौधे जैसे जीव, जो धूप से भोजन बनाते हैं।"],
  ["automatic weather station", "स्वचालित मौसम केंद्र", "An instrument station that records weather such as temperature and wind without a person present.", "एक उपकरण केंद्र जो बिना किसी व्यक्ति के तापमान और हवा जैसे मौसम को दर्ज करता है।"],
  ["ice-core drilling", "हिम कोर ड्रिलिंग", "Using a special drill to extract ice cores for study.", "अध्ययन के लिए विशेष ड्रिल से हिम कोर निकालना।"],
  ["research station", "अनुसंधान केंद्र", "A base where scientists live and work while studying a remote region.", "एक आधार जहाँ वैज्ञानिक किसी दूरस्थ क्षेत्र का अध्ययन करते हुए रहते और काम करते हैं।"],
  ["expedition", "अभियान", "An organised journey by a team to carry out research in a particular place.", "किसी विशेष स्थान पर अनुसंधान के लिए टीम की संगठित यात्रा।"],
  ["paleoclimate", "पुराजलवायु", "The climate of the distant past, studied using clues like ice cores and sediments.", "सुदूर अतीत की जलवायु, जिसका अध्ययन हिम कोर और तलछट जैसे सुरागों से होता है।"],
  ["sediment core", "तलछट कोर", "A tube-shaped sample of mud or sand taken from a lake or sea floor.", "झील या समुद्र तल से ली गई कीचड़ या रेत का नली के आकार का नमूना।"],
  ["snowline", "हिम रेखा", "The height above which snow stays on the ground all year.", "वह ऊँचाई जिसके ऊपर साल भर ज़मीन पर बर्फ रहती है।"],
];

export const glossarySeed: GlossaryTerm[] = raw.map(([term, term_hi, meaning_en, meaning_hi], i) => ({
  id: `00000000-0000-4000-a000-${String(900 + i).padStart(12, "0")}`,
  term,
  term_hi,
  meaning_en,
  meaning_hi,
}));
