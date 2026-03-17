import type { HomelandRegion } from "@/lib/database.types";

export const HOMELAND_GROUPS: {
  label: string;
  regions: { key: HomelandRegion; label: string }[];
}[] = [
  {
    label: "Africa",
    regions: [
      { key: "nigerian", label: "Nigerian" },
      { key: "ghanaian", label: "Ghanaian" },
      { key: "ethiopian_eritrean", label: "Ethiopian & Eritrean" },
      { key: "somali", label: "Somali" },
      { key: "kenyan", label: "Kenyan" },
      { key: "south_african", label: "South African" },
      { key: "zimbabwean", label: "Zimbabwean" },
      { key: "congolese", label: "Congolese" },
      { key: "ugandan", label: "Ugandan" },
      { key: "rwandan", label: "Rwandan" },
      { key: "cameroonian", label: "Cameroonian" },
      { key: "senegalese", label: "Senegalese" },
      { key: "ivorian", label: "Ivorian" },
      { key: "egyptian", label: "Egyptian" },
      { key: "moroccan", label: "Moroccan" },
      { key: "algerian_tunisian", label: "Algerian & Tunisian" },
      { key: "west_african", label: "West African (Other)" },
      { key: "east_african", label: "East African (Other)" },
      { key: "southern_african", label: "Southern African (Other)" },
    ],
  },
  {
    label: "Caribbean",
    regions: [
      { key: "jamaican", label: "Jamaican" },
      { key: "trinidadian", label: "Trinidadian & Tobagonian" },
      { key: "haitian", label: "Haitian" },
      { key: "cuban", label: "Cuban" },
      { key: "dominican", label: "Dominican" },
      { key: "barbadian", label: "Barbadian" },
      { key: "caribbean_other", label: "Caribbean (Other)" },
    ],
  },
  {
    label: "Latin America",
    regions: [
      { key: "mexican", label: "Mexican" },
      { key: "colombian", label: "Colombian" },
      { key: "venezuelan", label: "Venezuelan" },
      { key: "brazilian", label: "Brazilian" },
      { key: "argentine", label: "Argentine" },
      { key: "chilean", label: "Chilean" },
      { key: "peruvian", label: "Peruvian" },
      { key: "ecuadorian", label: "Ecuadorian" },
      { key: "puerto_rican", label: "Puerto Rican" },
      { key: "central_american", label: "Central American" },
      { key: "south_american_other", label: "South American (Other)" },
    ],
  },
  {
    label: "Europe",
    regions: [
      { key: "italian", label: "Italian" },
      { key: "spanish", label: "Spanish" },
      { key: "portuguese", label: "Portuguese" },
      { key: "french", label: "French" },
      { key: "greek", label: "Greek" },
      { key: "british_irish", label: "British & Irish" },
      { key: "german_austrian", label: "German & Austrian" },
      { key: "dutch_belgian", label: "Dutch & Belgian" },
      { key: "scandinavian", label: "Scandinavian" },
      { key: "polish", label: "Polish" },
      { key: "romanian", label: "Romanian" },
      { key: "balkan", label: "Balkan" },
      { key: "eastern_european_other", label: "Eastern European (Other)" },
    ],
  },
  {
    label: "Middle East",
    regions: [
      { key: "lebanese", label: "Lebanese" },
      { key: "iranian_persian", label: "Iranian & Persian" },
      { key: "turkish", label: "Turkish" },
      { key: "arab_levant", label: "Arab — Levant (Syrian, Palestinian, Jordanian)" },
      { key: "arab_gulf", label: "Arab — Gulf (Saudi, Emirati, Kuwaiti)" },
      { key: "arab_north_africa", label: "Arab — North Africa" },
      { key: "iraqi", label: "Iraqi" },
      { key: "yemeni", label: "Yemeni" },
    ],
  },
  {
    label: "South Asia",
    regions: [
      { key: "indian", label: "Indian" },
      { key: "pakistani", label: "Pakistani" },
      { key: "bangladeshi", label: "Bangladeshi" },
      { key: "sri_lankan", label: "Sri Lankan" },
      { key: "nepali", label: "Nepali" },
    ],
  },
  {
    label: "East & Southeast Asia",
    regions: [
      { key: "chinese", label: "Chinese" },
      { key: "japanese", label: "Japanese" },
      { key: "korean", label: "Korean" },
      { key: "filipino", label: "Filipino" },
      { key: "vietnamese", label: "Vietnamese" },
      { key: "thai", label: "Thai" },
      { key: "indonesian_malay", label: "Indonesian & Malaysian" },
    ],
  },
  {
    label: "Oceania & Pacific",
    regions: [
      { key: "pacific_islander", label: "Pacific Islander" },
    ],
  },
];
