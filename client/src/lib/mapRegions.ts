export type RegionKey = "north" | "central" | "east" | "south";

export type MapRegion = {
  key: RegionKey;
  name: string;
  romanized: string;
  description: string;
  learning: string;
  className: string;
  tagline: string;
  longDescription: string;
  observationPoints: string[];
  curriculumFocus: string[];
  fieldQuestion: string;
};

export const MAP_REGIONS: MapRegion[] = [
  {
    key: "north",
    name: "北部",
    romanized: "NORTH COAST",
    description: "從都會港灣到火山地形，觀察人口、交通與海岸如何交會。",
    learning: "社會 × 自然",
    className: "map-hotspot-north",
    tagline: "在城市與海岸之間，尋找人與環境的連線。",
    longDescription: "北部是臺灣人口與產業活動密集的區域，也擁有河口、海岸、丘陵與火山地景。沿著這條觀測路線前進，可以比較城市發展如何改變交通與生活，也能從岩石、海風與潮間帶讀出自然環境的線索。",
    observationPoints: ["河口與港灣的交通功能", "火山地形與溫泉景觀", "都市化與海岸環境的關係"],
    curriculumFocus: ["社會領域：人與環境互動", "自然科學領域：地表與地形變化", "語文領域：從觀察記錄整理重點"],
    fieldQuestion: "如果一座港口附近人口變多，生活與環境可能會出現哪些變化？",
  },
  {
    key: "central",
    name: "中部",
    romanized: "CENTRAL RIDGE",
    description: "沿著平原、丘陵與高山前進，認識地形分布與農業生活。",
    learning: "自然 × 地理",
    className: "map-hotspot-central",
    tagline: "從平原走向高山，讀懂地形如何影響生活。",
    longDescription: "中部連接西部平原、丘陵與中央山脈，是觀察地形高度與人類活動關係的好地方。農田、河川、聚落與山地彼此相連，讓我們能用地圖和資料比較不同地形的特色，理解水資源與產業選擇。",
    observationPoints: ["平原與丘陵的地形差異", "河川灌溉與農業聚落", "山地高度與氣候變化"],
    curriculumFocus: ["自然科學領域：地形與水循環", "社會領域：聚落與產業分布", "數學領域：讀圖與比較資料"],
    fieldQuestion: "為什麼平原地區通常較容易形成大型聚落與農業活動？",
  },
  {
    key: "east",
    name: "東部",
    romanized: "EASTERN VALLEY",
    description: "山脈與縱谷相鄰，從河流與岩層讀出島嶼的變化故事。",
    learning: "自然 × 閱讀",
    className: "map-hotspot-east",
    tagline: "在山脈與縱谷之間，追蹤島嶼成形的時間線。",
    longDescription: "東部的山脈、縱谷與海岸地形保留了豐富的自然觀察線索。河流切割地表、板塊運動推動山地升起，地景因此持續改變。這條路線鼓勵探險家把地圖、文字與實際觀察放在一起，練習從證據說出一個地方的故事。",
    observationPoints: ["縱谷平原與山脈排列", "河流侵蝕與堆積作用", "海岸地形與地震活動"],
    curriculumFocus: ["自然科學領域：地球內部與地表變化", "語文領域：根據證據說明現象", "社會領域：地方環境與生活文化"],
    fieldQuestion: "從河流兩側的地形與岩石，可以推測哪些自然作用？",
  },
  {
    key: "south",
    name: "南部",
    romanized: "SOUTHERN WATERS",
    description: "暖熱陽光、珊瑚海岸與濕地生態，都是值得記錄的觀測線索。",
    learning: "自然 × 生活",
    className: "map-hotspot-south",
    tagline: "沿著暖流與濕地前行，觀察生命如何適應環境。",
    longDescription: "南部擁有較溫暖的氣候、海岸、潟湖、濕地與珊瑚礁生態。不同生物會依照陽光、水分、鹽度與棲地條件找到適合自己的位置。探索這條路線時，可以把季節觀察和生活經驗連起來，思考人們如何守護珍貴的海岸環境。",
    observationPoints: ["珊瑚礁與海岸生態", "濕地的水鳥與棲地功能", "氣候條件與農漁生活"],
    curriculumFocus: ["自然科學領域：生物與環境", "社會領域：地方產業與環境保護", "數學領域：觀察紀錄與趨勢比較"],
    fieldQuestion: "濕地為生物和人類提供了哪些重要功能？",
  },
];

export function getMapRegion(key: RegionKey) {
  return MAP_REGIONS.find((region) => region.key === key) ?? MAP_REGIONS[0];
}
