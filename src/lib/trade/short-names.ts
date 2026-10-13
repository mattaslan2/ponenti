import { getHs } from "./hs";

/**
 * Short names for the product lines Türkiye ships the most of (HS4), for places
 * with room for two or three words: the home page strip and lead emails. The
 * official descriptions (hs-index.json) stay on the trade pages. A code that is
 * not listed falls back to its chapter name.
 */
const SHORT: Record<string, [en: string, tr: string]> = {
  "0302": ["Fresh fish", "Taze balık"],
  "0804": ["Figs and dates", "İncir ve hurma"],
  "0813": ["Dried fruit", "Kuru meyve"],
  "1005": ["Corn", "Mısır"],
  "1704": ["Confectionery", "Şekerleme"],
  "1806": ["Chocolate", "Çikolata"],
  "1905": ["Biscuits and pastry", "Bisküvi ve unlu mamuller"],
  "2009": ["Fruit juice", "Meyve suyu"],
  "2304": ["Soybean meal", "Soya küspesi"],
  "2401": ["Tobacco", "Tütün"],
  "2402": ["Cigarettes", "Sigara"],
  "2523": ["Cement", "Çimento"],
  "2710": ["Petroleum products", "Petrol ürünleri"],
  "2840": ["Borates", "Boratlar"],
  "3401": ["Soap", "Sabun"],
  "3907": ["Resins", "Reçineler"],
  "3920": ["Plastic film", "Plastik film"],
  "3921": ["Plastic sheets", "Plastik levha"],
  "3923": ["Plastic packaging", "Plastik ambalaj"],
  "4009": ["Rubber hoses", "Kauçuk hortum"],
  "4819": ["Cartons", "Karton kutu"],
  "5407": ["Synthetic fabrics", "Sentetik kumaş"],
  "5511": ["Synthetic yarn", "Sentetik iplik"],
  "5603": ["Nonwovens", "Dokunmamış kumaş"],
  "5702": ["Woven carpets", "Dokuma halı"],
  "6104": ["Women's knitwear", "Kadın örme giyim"],
  "6109": ["T-shirts", "Tişört"],
  "6110": ["Sweaters", "Kazak ve triko"],
  "6115": ["Socks and hosiery", "Çorap"],
  "6203": ["Men's apparel", "Erkek giyim"],
  "6204": ["Women's apparel", "Kadın giyim"],
  "6302": ["Home textiles", "Ev tekstili"],
  "6801": ["Paving stone", "Parke taşı"],
  "6802": ["Worked stone", "İşlenmiş doğal taş"],
  "6810": ["Concrete articles", "Beton ürünleri"],
  "7108": ["Gold", "Altın"],
  "7113": ["Jewelry", "Mücevher"],
  "7208": ["Flat steel", "Yassı çelik"],
  "7214": ["Steel bars", "Çelik çubuk"],
  "7304": ["Seamless steel pipe", "Dikişsiz çelik boru"],
  "7305": ["Large steel pipe", "Büyük çaplı çelik boru"],
  "7306": ["Steel tubes", "Çelik boru"],
  "7308": ["Steel structures", "Çelik yapı"],
  "7318": ["Fasteners", "Bağlantı elemanları"],
  "7607": ["Aluminum foil", "Alüminyum folyo"],
  "8302": ["Hardware and fittings", "Metal aksam"],
  "8409": ["Engine parts", "Motor parçaları"],
  "8411": ["Jet engines and turbines", "Jet motoru ve türbin"],
  "8413": ["Pumps", "Pompa"],
  "8414": ["Compressors and fans", "Kompresör ve fan"],
  "8418": ["Refrigerators", "Buzdolabı ve dondurucu"],
  "8421": ["Filters", "Filtre"],
  "8481": ["Valves", "Vana"],
  "8483": ["Shafts and bearings", "Mil ve yatak"],
  "8504": ["Transformers", "Transformatör"],
  "8526": ["Radar and navigation", "Radar ve seyrüsefer"],
  "8536": ["Switchgear", "Şalt cihazları"],
  "8537": ["Electrical panels", "Elektrik panosu"],
  "8541": ["Semiconductors", "Yarı iletkenler"],
  "8544": ["Cables and wire", "Kablo ve tel"],
  "8701": ["Tractors", "Traktör"],
  "8702": ["Buses", "Otobüs"],
  "8708": ["Vehicle parts", "Araç parçaları"],
  "8807": ["Aircraft parts", "Hava aracı parçaları"],
  "9302": ["Pistols", "Tabanca"],
  "9303": ["Shotguns and rifles", "Av tüfeği"],
  "9305": ["Arms parts", "Silah parçaları"],
  "9306": ["Ammunition", "Mühimmat"],
  "9401": ["Seats", "Oturma mobilyası"],
  "9403": ["Furniture", "Mobilya"],
};

export function shortProductName(code: string, locale: string): string {
  const pair = SHORT[code];
  if (pair) return locale === "tr" ? pair[1] : pair[0];
  const hs = getHs(code);
  if (!hs) return code;
  return locale === "tr" ? hs.chapter.nameTr : hs.chapter.nameEn;
}
