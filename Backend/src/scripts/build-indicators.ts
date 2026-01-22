import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define the complete indicators data structure based on your requirements
const INDICATORS_DATA = [
  // Economic Pillar Indicators
  {
    id: "1",
    name: "Ha of land meeting FOBASI operationalization criteria with agronomic KPIs",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 18713, annual: 18713 },
    order: 1,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "2",
    name: "Ha of Land meeting FOBASI Operationalization criteria with Agronomic and Managerial KPIs",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 1740, annual: 1740 },
    order: 2,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "3",
    name: "Ha of land use consolidation for priority crops",
    pillarId: "economic",
    measurementType: "cumulative",
    isDual: true,
    subIndicators: [
      { key: "maize", name: "Area under land use consolidation for Maize(Ha)", targets: { q1: 3340, q2: 17568, q3: 335, q4: 0, annual: 21243 } },
      { key: "cassava", name: "Area under land use consolidation for Cassava(Ha)", targets: { q1: 250, q2: 1250, q3: 0, q4: 0, annual: 1500 } },
      { key: "rice", name: "Area under land use consolidation for Rice(Ha)", targets: { q1: 1049, q2: 5245, q3: 0, q4: 0, annual: 6294 } },
      { key: "beans", name: "Area under land use consolidation for Beans(Ha)", targets: { q1: 3048, q2: 15240, q3: 0, q4: 0, annual: 18288 } },
      { key: "soya", name: "Area under land use consolidation for Soya bean(Ha)", targets: { q1: 50, q2: 250, q3: 0, q4: 0, annual: 300 } }
    ],
    order: 3,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "8",
    name: "Quantity of improved seed",
    pillarId: "economic",
    measurementType: "cumulative",
    isDual: true,
    subIndicators: [
      { key: "maize", name: "Quantity of improved Maize seeds used (Kg)", targets: { q1: 25122, q2: 125610, q3: 2400, q4: 0, annual: 153132 } },
      { key: "soya", name: "Quantity of improved Soybeans seeds used (Kg)", targets: { q1: 2350, q2: 11750, q3: 0, q4: 0, annual: 14100 } }
    ],
    order: 4,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "10",
    name: "Quantity of mineral fertilizer used",
    pillarId: "economic",
    measurementType: "cumulative",
    isDual: true,
    subIndicators: [
      { key: "dap", name: "Quantity of DAP used (Kg)", targets: { q1: 92900, q2: 464500, q3: 0, q4: 0, annual: 557400 } },
      { key: "urea", name: "Quantity of UREA used (Kg)", targets: { q1: 76000, q2: 380000, q3: 0, q4: 0, annual: 456000 } },
      { key: "npk", name: "Quantity of NPK used (Kg)", targets: { q1: 141495, q2: 707475, q3: 0, q4: 0, annual: 848970 } },
      { key: "blended", name: "Quantity of Blended fertilizers used (Kg)", targets: { q1: 2000, q2: 10000, q3: 0, q4: 0, annual: 12000 } },
      { key: "lime", name: "Quantity of lime used (Kg)", targets: { q1: 181500, q2: 907500, q3: 0, q4: 0, annual: 1089000 } }
    ],
    order: 5,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "15",
    name: "Area under progressive terraces developed (Ha)",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 50, q2: 50, q3: 50, q4: 50, annual: 200 },
    order: 6,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "16",
    name: "Area of crops insured(Ha)",
    pillarId: "economic",
    measurementType: "cumulative",
    isDual: true,
    subIndicators: [
      { key: "maize", name: "Area of Maize insured (Ha)", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "rice", name: "Area of Rice insured (Ha)", targets: { q1: 818, q2: 818, q3: 818, q4: 818, annual: 3272 } },
      { key: "beans", name: "Area of Beans insured (Ha)", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "chilli", name: "Area of Chilli insured (Ha)", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "soybeans", name: "Area of soybeans insured (Ha)", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "french_beans", name: "Area of French beans insured (Ha)", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } }
    ],
    order: 7,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "22",
    name: "Number of cows inseminated",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 1000, q2: 1000, q3: 1000, q4: 1000, annual: 4000 },
    order: 8,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "23",
    name: "Number of AI born calves recorded",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 300, q2: 300, q3: 300, q4: 300, annual: 1200 },
    order: 9,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "24",
    name: "Number of cows vaccinated against disease",
    pillarId: "economic",
    measurementType: "cumulative",
    isDual: true,
    subIndicators: [
      { key: "bq", name: "Number of cows vaccinated against Black quarter (BQ)", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "lsd", name: "Number of cows vaccinated against LSD", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "rvf", name: "Number of cows vaccinated against RVF", targets: { q1: 34000, q2: 34000, q3: 34000, q4: 34000, annual: 136000 } },
      { key: "brucellosis", name: "Number of cows vaccinated against Brucellosis", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "rabies", name: "Number of cows vaccinated against Rabies", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } }
    ],
    order: 10,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "29",
    name: "Number of small livestock vaccinated against RVF",
    pillarId: "economic",
    measurementType: "cumulative",
    isDual: true,
    subIndicators: [
      { key: "sheep", name: "Number of Sheep vaccinated against RVF", targets: { q1: 2300, q2: 2300, q3: 2300, q4: 2300, annual: 9200 } },
      { key: "goats", name: "Number of Goats vaccinated against RVF", targets: { q1: 64600, q2: 64600, q3: 64600, q4: 64600, annual: 258400 } }
    ],
    order: 11,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "31",
    name: "Number of livestock insured",
    pillarId: "economic",
    measurementType: "cumulative",
    isDual: true,
    subIndicators: [
      { key: "pig", name: "Number of pigs insured", targets: { q1: 50, q2: 50, q3: 50, q4: 50, annual: 200 } },
      { key: "chicken", name: "Number of poultry insured", targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
      { key: "cows", name: "Number of cows insured", targets: { q1: 150, q2: 150, q3: 150, q4: 150, annual: 600 } }
    ],
    order: 12,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "34",
    name: "Quantity of Fish produced (MT)",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 70, q2: 70, q3: 70, q4: 70, annual: 280 },
    order: 13,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "35",
    name: "Quantity of Full washed Coffee produced(MT)",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 },
    order: 14,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "36",
    name: "Area of vegetables planted (Ha)",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 200, q2: 200, q3: 200, q4: 200, annual: 800 },
    order: 15,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "37",
    name: "Number of productive jobs created",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 840, q2: 840, q3: 840, q4: 840, annual: 3360 },
    order: 16,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "38",
    name: "Number of workplace learning beneficiaries (Interns/Apprenticeships)",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 21, q2: 21, q3: 21, q4: 21, annual: 84 },
    order: 17,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "39",
    name: "Number of Start-up existing and new MSMEs coached to access finance",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 30, q2: 30, q3: 30, q4: 30, annual: 120 },
    order: 18,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "40",
    name: "Number of Productive Uses connected",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 3, q2: 3, q3: 3, q4: 3, annual: 12 },
    order: 19,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "41",
    name: "Number of new households connected to electricity",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 50, q2: 50, q3: 50, q4: 50, annual: 200 },
    order: 20,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "42",
    name: "Number of new households connected to off-grid electricity",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 100, q2: 100, q3: 100, q4: 100, annual: 400 },
    order: 21,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "43",
    name: "Percentage of works for 9 km of Nyuruvumu Gahushyi-Gituku feeder road rehabilitated",
    pillarId: "economic",
    measurementType: "percentage",
    targets: { q1: "62%", q2: "75%", q3: "87%", q4: "100%", annual: "100%" },
    order: 22,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "44",
    name: "Number of Ha of detailed physical plan elaborated",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 },
    order: 23,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "45",
    name: "Level of compliance of developed land use plan",
    pillarId: "economic",
    measurementType: "percentage",
    targets: { q1: "50%", q2: "65%", q3: "80%", q4: "95%", annual: "95%" },
    order: 24,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "46",
    name: "Percentage of expropriated land parcels successfully registered in land information system(LAIS)",
    pillarId: "economic",
    measurementType: "percentage",
    targets: { q1: 0, q2: "25%", q3: "50%", q4: "75%", annual: "75%" },
    order: 25,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "47",
    name: "Local Government own source revenues collected (Frw)",
    pillarId: "economic",
    measurementType: "percentage",
    targets: { q1: "25%", q2: "50%", q3: "75%", q4: "100%", annual: "100%" },
    order: 26,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "48",
    name: "Local Government expenditures executed (Frw)",
    pillarId: "economic",
    measurementType: "percentage",
    targets: { q1: "25%", q2: "50%", q3: "75%", q4: "100%", annual: "100%" },
    order: 27,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "49",
    name: "Number of businesses with formal bank accounts",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 },
    order: 28,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "50",
    name: "Number of businesses accessing loans",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 },
    order: 29,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "51",
    name: "Value of loans accessed by businesses (Frw)",
    pillarId: "economic",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 },
    order: 30,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  // Social Pillar Indicators
  {
    id: "52",
    name: "Number of eligible HH beneficiaries for VUP/PW (HBECD)",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1666, q2: 1666, q3: 1666, q4: 1666, annual: 1666 },
    order: 31,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "53",
    name: "Percentage of timely payments made to VUP / ePW-HBECD beneficiaries (within 15 days after end of working period)",
    pillarId: "social",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" },
    order: 32,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "54",
    name: "Number of targeted graduation participants receiving a graduation package (Example :Safety net, Livelihood, Financial Inclusion, Coaching..)",
    pillarId: "social",
    measurementType: "percentage",
    targets: { q1: "0%", q2: "0%", q3: 4000, q4: 4670, annual: 8670 },
    order: 33,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "55",
    name: "Number of eligible/poor families received cows through Girinka program",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 158, q2: 175, q3: 192, q4: 104, annual: 629 },
    order: 34,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "56",
    name: "Number of extremely poor HHs supported with small livestock (i.e. pigs, goats or poultry)",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: "-", q2: 150, q3: 150, q4: 200, annual: 500 },
    order: 35,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "57",
    name: "Number of graduation participants provided with productive Assets Transfer (toolkits)",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: "-", q2: "-", q3: "-", q4: 288, annual: 288 },
    order: 36,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "58",
    name: "Number of People from extremely poor HHs supported to access technical/ vocational skills",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: "-", q2: "-", q3: 198, q4: "-", annual: 198 },
    order: 37,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "59",
    name: "Percentage of timely payment of eligible HHs benefiting from VUP Direct Support transfers",
    pillarId: "social",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" },
    order: 38,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "60",
    name: "Loans advanced to eligible beneficiaries under VUP/Financial services to support their Income Generating Activities",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 50, q2: 150, q3: 200, q4: 311, annual: 711 },
    order: 39,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "61",
    name: "percentage of loans provided through VUP financial service third scheme loans recovered",
    pillarId: "social",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "80%", q2: "80%", q3: "80%", q4: "80%", annual: "80%" },
    order: 40,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "62",
    name: "Number of genocide survivors supported with shelter",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 6, annual: 6 },
    order: 41,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "63",
    name: "Percentage of eligible population covered by CBHI",
    pillarId: "social",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "85%", q2: "90%", q3: "95%", q4: "100%", annual: "100%" },
    order: 42,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "64",
    name: "Percentage of Needy genocide survivors provided Ordinary Direct Support and Special Direct Support within 10 days following end of month",
    pillarId: "social",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" },
    order: 43,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "65",
    name: "Number of needy Genocide survivors provided support for Income Generating Activities",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 30, q3: 0, q4: 35, annual: 65 },
    order: 44,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "66",
    name: "Number of cooperatives of People with Disabilities (PwDs) supported",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: "-", q2: 1, q3: 3, q4: 0, annual: 4 },
    order: 45,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "67",
    name: "Number of vulnerable PwDs supported with assistive devices",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 30, q2: 50, q3: 40, q4: 30, annual: 150 },
    order: 46,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "68",
    name: "Percentage of eligible People (Aged 35 and above for women; and 40 years and above for Men) who received at least one NCDs community check up within last 12 months",
    pillarId: "social",
    measurementType: "percentage",
    targets: { q1: "25%", q2: "50%", q3: "75%", q4: "100%", annual: "100%" },
    order: 47,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "69",
    name: "Percentage of pregnant women receiving at least 4 ANC visits from skilled health personnel",
    pillarId: "social",
    measurementType: "percentage",
    targets: { q1: "50%", q2: "60%", q3: "70%", q4: "80%", annual: "80%" },
    order: 48,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "70",
    name: "Percentage of births attended by skilled health personnel",
    pillarId: "social",
    measurementType: "percentage",
    targets: { q1: "85%", q2: "88%", q3: "91%", q4: "94%", annual: "94%" },
    order: 49,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "71",
    name: "Percentage of children 12-23 months receiving all basic vaccinations",
    pillarId: "social",
    measurementType: "percentage",
    targets: { q1: "90%", q2: "91%", q3: "92%", q4: "93%", annual: "93%" },
    order: 50,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "72",
    name: "Percentage of children under 5 years with acute malnutrition receiving treatment",
    pillarId: "social",
    measurementType: "percentage",
    targets: { q1: "90%", q2: "91%", q3: "92%", q4: "93%", annual: "93%" },
    order: 51,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "73",
    name: "Percentage of health facilities providing emergency obstetric and newborn care",
    pillarId: "social",
    measurementType: "percentage",
    targets: { q1: "80%", q2: "85%", q3: "90%", q4: "95%", annual: "95%" },
    order: 52,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "74",
    name: "Number of classrooms constructed (including ECD)",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 5, q2: 5, q3: 5, q4: 5, annual: 20 },
    order: 53,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "75",
    name: "Number of latrines constructed in schools",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 10, q2: 10, q3: 10, q4: 10, annual: 40 },
    order: 54,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "76",
    name: "Number of school kitchens constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 5, q2: 5, q3: 5, q4: 5, annual: 20 },
    order: 55,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "77",
    name: "Number of school libraries constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 2, q2: 2, q3: 2, q4: 2, annual: 8 },
    order: 56,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "78",
    name: "Number of administrative offices constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 2, q2: 2, q3: 2, q4: 2, annual: 8 },
    order: 57,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "79",
    name: "Number of Early Childhood Development (ECD) centers constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 3, q2: 3, q3: 3, q4: 3, annual: 12 },
    order: 58,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "80",
    name: "Number of youth centers constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 },
    order: 59,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "81",
    name: "Number of health posts constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 2, q2: 2, q3: 2, q4: 2, annual: 8 },
    order: 60,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "82",
    name: "Number of health centers constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 },
    order: 61,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "83",
    name: "Number of district hospitals constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 },
    order: 62,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "84",
    name: "Number of sports facilities constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 2, q2: 2, q3: 2, q4: 2, annual: 8 },
    order: 63,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "85",
    name: "Number of markets constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 },
    order: 64,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "86",
    name: "Number of modern abattoirs constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 },
    order: 65,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "87",
    name: "Number of bus parks constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 },
    order: 66,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "88",
    name: "Number of public squares constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 2, q2: 2, q3: 2, q4: 2, annual: 8 },
    order: 67,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "89",
    name: "Number of wedding halls constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 },
    order: 68,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "90",
    name: "Number of public toilets constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 5, q2: 5, q3: 5, q4: 5, annual: 20 },
    order: 69,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "91",
    name: "Number of slaughter houses constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 },
    order: 70,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "92",
    name: "Number of water kiosks constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 10, q2: 10, q3: 10, q4: 10, annual: 40 },
    order: 71,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "93",
    name: "Number of water tanks constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 5, q2: 5, q3: 5, q4: 5, annual: 20 },
    order: 72,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "94",
    name: "Number of biogas plants constructed",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 50, q2: 50, q3: 50, q4: 50, annual: 200 },
    order: 73,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "95",
    name: "Number of households connected to electricity",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 200, q2: 200, q3: 200, q4: 200, annual: 800 },
    order: 74,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "96",
    name: "Number of households connected to clean water",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 300, q2: 300, q3: 300, q4: 300, annual: 1200 },
    order: 75,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "97",
    name: "Number of households connected to sanitation services",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 250, q2: 250, q3: 250, q4: 250, annual: 1000 },
    order: 76,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "98",
    name: "Number of households connected to gas",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 100, q2: 100, q3: 100, q4: 100, annual: 400 },
    order: 77,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "99",
    name: "Number of households connected to internet",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 150, q2: 150, q3: 150, q4: 150, annual: 600 },
    order: 78,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "100",
    name: "Number of households connected to waste management services",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 200, q2: 200, q3: 200, q4: 200, annual: 800 },
    order: 79,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "101",
    name: "Number of households connected to public transport",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 300, q2: 300, q3: 300, q4: 300, annual: 1200 },
    order: 80,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "102",
    name: "Number of households connected to financial services",
    pillarId: "social",
    measurementType: "cumulative",
    targets: { q1: 250, q2: 250, q3: 250, q4: 250, annual: 1000 },
    order: 81,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  // Governance Pillar Indicators
  {
    id: "103",
    name: "Percentage of Students passing comprehensive assessment: Secondary",
    pillarId: "governance",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: 0, q2: "80%", q3: "80%", q4: "80%", annual: "80%" },
    order: 82,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "104",
    name: "Percentage of Students   in TVET  L3 to L5  pass   comprehensive assessment",
    pillarId: "governance",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: 0, q2: "80%", q3: "80%", q4: "80%", annual: "80%" },
    order: 83,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "105",
    name: "Number of citizens (15 years old and above) trained in basic digital literacy (Cumulative)",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 11400, q2: 11400, q3: 11400, q4: 11400, annual: 45600 },
    order: 84,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "106",
    name: "Number of New households connected to safe/drinking water (into their dwellings/premises)",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 80, q2: 102, q3: 102, q4: 166, annual: 450 },
    order: 85,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "107",
    name: "Percentage of operational public water taps on functional Water Supply Systems",
    pillarId: "governance",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "98%", q2: "98%", q3: "98%", q4: "98%", annual: "98%" },
    order: 86,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "108",
    name: "Public institutions and socio-economic use areas connected to clean water",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 5, q2: 5, q3: 5, q4: 5, annual: 20 },
    order: 87,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "109",
    name: "Number of households connected to sanitation network",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 150, q2: 150, q3: 150, q4: 150, annual: 600 },
    order: 88,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "110",
    name: "Number of public toilets constructed",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 10, q2: 10, q3: 10, q4: 10, annual: 40 },
    order: 89,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "111",
    name: "Number of households connected to electricity",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 300, q2: 300, q3: 300, q4: 300, annual: 1200 },
    order: 90,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "112",
    name: "Number of public institutions connected to electricity",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 5, q2: 5, q3: 5, q4: 5, annual: 20 },
    order: 91,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "113",
    name: "Number of households connected to gas",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 200, q2: 200, q3: 200, q4: 200, annual: 800 },
    order: 92,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "114",
    name: "Number of households connected to internet",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 250, q2: 250, q3: 250, q4: 250, annual: 1000 },
    order: 93,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "115",
    name: "Number of households connected to waste management services",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 300, q2: 300, q3: 300, q4: 300, annual: 1200 },
    order: 94,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "116",
    name: "Number of households connected to public transport",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 400, q2: 400, q3: 400, q4: 400, annual: 1600 },
    order: 95,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "117",
    name: "Number of households connected to financial services",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 350, q2: 350, q3: 350, q4: 350, annual: 1400 },
    order: 96,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "118",
    name: "Percentage of citizens satisfied with public service delivery",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 97,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "119",
    name: "Percentage of citizens satisfied with local governance",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 98,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "120",
    name: "Percentage of citizens satisfied with access to justice",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 99,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "121",
    name: "Percentage of citizens satisfied with access to information",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 100,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "122",
    name: "Percentage of citizens satisfied with access to healthcare",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 101,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "123",
    name: "Percentage of citizens satisfied with access to education",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 102,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "124",
    name: "Percentage of citizens satisfied with access to water and sanitation",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 103,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "125",
    name: "Percentage of citizens satisfied with access to electricity",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 104,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "126",
    name: "Percentage of citizens satisfied with access to gas",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 105,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "127",
    name: "Percentage of citizens satisfied with access to internet",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 106,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "128",
    name: "Percentage of citizens satisfied with access to waste management services",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 107,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "129",
    name: "Percentage of citizens satisfied with access to public transport",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 108,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "130",
    name: "Percentage of citizens satisfied with access to financial services",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 109,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "131",
    name: "Percentage of citizens satisfied with access to housing",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 110,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "132",
    name: "Percentage of citizens satisfied with access to food security",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 111,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "133",
    name: "Percentage of citizens satisfied with access to employment",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 112,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "134",
    name: "Percentage of citizens satisfied with access to social protection",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 113,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "135",
    name: "Percentage of citizens satisfied with access to environmental protection",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 114,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "136",
    name: "Percentage of citizens satisfied with access to disaster management",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 115,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "137",
    name: "Percentage of citizens satisfied with access to climate change adaptation",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 116,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "138",
    name: "Percentage of citizens satisfied with access to biodiversity conservation",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 117,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "139",
    name: "Percentage of citizens satisfied with access to land management",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 118,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "140",
    name: "Percentage of citizens satisfied with access to urban planning",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 119,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "141",
    name: "Percentage of citizens satisfied with access to rural development",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "70%", q2: "75%", q3: "80%", q4: "85%", annual: "85%" },
    order: 120,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "142",
    name: "Proportion of youth ( S.6 finalist) enrolled in Voluntary National Service (Urugerero)",
    pillarId: "governance",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "0%", q2: "0%", q3: "80%", q4: "0%", annual: "80%" },
    order: 121,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "143",
    name: "Number of Ndi Umunyarwanda sessions conducted",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 1, q3: 0, q4: 0, annual: 1 },
    order: 122,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "144",
    name: "Number dialogues conducted during Unity and resilience month",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 1, q3: 0, q4: 1, annual: 1 },
    order: 123,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "145",
    name: "Amount of own revenues generated (Frw)",
    pillarId: "governance",
    measurementType: "percentage",
    targets: { q1: "331,650,284", q2: "411,212,592", q3: "575,515,706", q4: "366,852,181", annual: "1,685,230,763" },
    order: 124,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "146",
    name: "Percentage of Auditor general's recommendations implemented",
    pillarId: "governance",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "25%", q2: "50%", q3: "65%", q4: "70%", annual: "70%" },
    order: 125,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "147",
    name: "Number of risk-based Areas audited",
    pillarId: "governance",
    measurementType: "cumulative",
    targets: { q1: 0, q2: 2, q3: 4, q4: 4, annual: 10 },
    order: 126,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  },
  {
    id: "148",
    name: "Percentage of District  NBAs assessed using peer review  peer learning approach",
    pillarId: "governance",
    measurementType: "percentage",
    isDual: true,
    targets: { q1: "20%", q2: "50%", q3: "75%", q4: "100%", annual: "100%" },
    order: 127,
    createdAt: new Date("2024-01-15T10:30:00.000Z"),
    updatedAt: new Date("2024-01-15T10:30:00.000Z")
  }
];

const buildIndicators = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('Connected to MongoDB...');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Drop existing indicators collection if it exists
    const collections = await db.listCollections({ name: 'indicators' }).toArray();
    if (collections.length > 0) {
      await db.collection('indicators').drop();
      console.log('Dropped existing indicators collection.');
    }

    // Create indicators collection without schema validation for now
    await db.createCollection('indicators');

    // Insert the indicators data
    await db.collection('indicators').insertMany(INDICATORS_DATA);
    console.log(`Successfully inserted ${INDICATORS_DATA.length} indicators into indicators collection.`);

    // Create indexes for better performance
    await db.collection('indicators').createIndex({ pillarId: 1, order: 1 });
    await db.collection('indicators').createIndex({ id: 1 });
    console.log('Created indexes for efficient querying.');

    process.exit(0);
  } catch (error: any) {
    console.error('Error building indicators:', error.message);
    process.exit(1);
  }
};

buildIndicators();
