export interface Indicator {
  id: string;
  name: string;
  targets: {
    q1: string | number;
    q2: string | number;
    q3: string | number;
    q4: string | number;
    annual: string | number;
  };
  isDual?: boolean;
  measurementType?: 'cumulative' | 'percentage' | 'decreasing';
  subIndicatorIds?: Record<string, string>;
}

export const INDICATORS: Indicator[] = [
  {
    "id": "1",
    "name": "Ha of land meeting FOBASI operationalization criteria with agronomic KPIs",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 18713,
      "annual": 18713
    }
  },
  {
    "id": "2",
    "name": "Ha of Land meeting FOBASI Operationalization criteria with Agronomic and Managerial KPIs",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 1740,
      "annual": 1740
    }
  },
  {
    "id": "3",
    "name": "Ha of land use consolidation for priority crops",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "maize": "3a",
      "cassava": "4",
      "rice": "5",
      "beans": "6",
      "soya": "7"
    }
  },
  {
    "id": "3a",
    "name": "Area under land use consolidation for Maize(Ha)",
    "targets": {
      "q1": 3340,
      "q2": 17568,
      "q3": 335,
      "q4": 0,
      "annual": 21243
    }
  },
  {
    "id": "4",
    "name": "Area under land use consolidation for Cassava(Ha)",
    "targets": {
      "q1": 250,
      "q2": 1250,
      "q3": 0,
      "q4": 0,
      "annual": 1500
    }
  },
  {
    "id": "5",
    "name": "Area under land use consolidation for Rice(Ha)",
    "targets": {
      "q1": 1049,
      "q2": 141,
      "q3": 1190,
      "q4": 0,
      "annual": 2380
    }
  },
  {
    "id": "6",
    "name": "Area under land use consolidation for Beans(Ha)",
    "targets": {
      "q1": 3048,
      "q2": 17999,
      "q3": 20026,
      "q4": 1430,
      "annual": 42503
    }
  },
  {
    "id": "7",
    "name": "Area under land use consolidation for Soya bean(Ha)",
    "targets": {
      "q1": 50,
      "q2": 91,
      "q3": 109,
      "q4": 0,
      "annual": 250
    }
  },
  {
    "id": "8",
    "name": "Quantity of improved seed",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "maize": "8a",
      "soya": "9"
    }
  },
  {
    "id": "8a",
    "name": "Quantity of improved Maize seeds used (Kg)",
    "targets": {
      "q1": 25122,
      "q2": 167762,
      "q3": 6040,
      "q4": 0,
      "annual": 198924
    }
  },
  {
    "id": "9",
    "name": "Quantity of improved Soybeans seeds used (Kg)",
    "targets": {
      "q1": 2350,
      "q2": 5900,
      "q3": 6578,
      "q4": 0,
      "annual": 14828
    }
  },
  {
    "id": "10",
    "name": "Quantity of mineral fertilizer used",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "dap": "10a",
      "urea": "11",
      "npk": "12",
      "blender": "13",
      "lime": "14"
    }
  },
  {
    "id": "10a",
    "name": "Quantity of DAP used (Kg)",
    "targets": {
      "q1": 85000,
      "q2": 95000,
      "q3": 120000,
      "q4": 50000,
      "annual": 350000
    }
  },
  {
    "id": "11",
    "name": "Quantity of UREA used (Kg)",
    "targets": {
      "q1": 76000,
      "q2": 423997,
      "q3": 152673,
      "q4": 8000,
      "annual": 660670
    }
  },
  {
    "id": "12",
    "name": "Quantity of NPK used (Kg)",
    "targets": {
      "q1": 141495,
      "q2": 112225,
      "q3": 196410,
      "q4": 0,
      "annual": 450130
    }
  },
  {
    "id": "13",
    "name": "Quantity of Blended fertilizers used (Kg)",
    "targets": {
      "q1": 2000,
      "q2": 13250,
      "q3": 7750,
      "q4": 27000,
      "annual": 50000
    }
  },
  {
    "id": "14",
    "name": "Quantity of lime used (Kg)",
    "targets": {
      "q1": 181500,
      "q2": 311750,
      "q3": 306750,
      "q4": 0,
      "annual": 800000
    }
  },
  {
    "id": "15",
    "name": "Area under progressive terraces developed (Ha)",
    "targets": {
      "q1": 50,
      "q2": 20,
      "q3": 80,
      "q4": 0,
      "annual": 150
    }
  },
  {
    "id": "16",
    "name": "Area of crops insured(Ha)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "maize": "16a",
      "rice": "17",
      "beans": "18",
      "chilli": "19",
      "soybeans": "20",
      "french_beans": "21"
    }
  },
  {
    "id": "16a",
    "name": "Area of Maize insured (Ha)",
    "targets": {
      "q1": 0,
      "q2": 205,
      "q3": 5,
      "q4": 0,
      "annual": 210
    }
  },
  {
    "id": "17",
    "name": "Area of Rice insured (Ha)",
    "targets": {
      "q1": 818,
      "q2": 232,
      "q3": 825,
      "q4": 75,
      "annual": 1950
    }
  },
  {
    "id": "18",
    "name": "Area of Beans insured (Ha)",
    "targets": {
      "q1": 0,
      "q2": 9,
      "q3": 6,
      "q4": 0,
      "annual": 15
    }
  },
  {
    "id": "19",
    "name": "Area of Chilli insured (Ha)",
    "targets": {
      "q1": 0,
      "q2": 3,
      "q3": 7,
      "q4": 0,
      "annual": 10
    }
  },
  {
    "id": "20",
    "name": "Area of soybeans insured (Ha)",
    "targets": {
      "q1": 0,
      "q2": 9,
      "q3": 6,
      "q4": 0,
      "annual": 15
    }
  },
  {
    "id": "21",
    "name": "Area of French beans insured (Ha)",
    "targets": {
      "q1": 0,
      "q2": 6,
      "q3": 4,
      "q4": 0,
      "annual": 10
    }
  },
  {
    "id": "22",
    "name": "Number of cows inseminated",
    "targets": {
      "q1": 1000,
      "q2": 1000,
      "q3": 1000,
      "q4": 581,
      "annual": 3581
    }
  },
  {
    "id": "23",
    "name": "Number of AI born calves recorded",
    "targets": {
      "q1": 300,
      "q2": 250,
      "q3": 250,
      "q4": 400,
      "annual": 1200
    }
  },
  {
    "id": "24",
    "name": "Number of cows vaccinated against disease",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "bq": "24a",
      "lsd": "25",
      "rvf": "26",
      "brucellosis": "27",
      "rabies": "28"
    }
  },
  {
    "id": "24a",
    "name": "Number of cows vaccinated against Black quarter (BQ)",
    "targets": {
      "q1": 0,
      "q2": 34000,
      "q3": 0,
      "q4": 0,
      "annual": 34000
    }
  },
  {
    "id": "25",
    "name": "Number of cows vaccinated against LSD",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 34000,
      "q4": 0,
      "annual": 34000
    }
  },
  {
    "id": "26",
    "name": "Number of cows vaccinated against RVF",
    "targets": {
      "q1": 34000,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 34000
    }
  },
  {
    "id": "27",
    "name": "Number of cows vaccinated against Brucellosis",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 2300,
      "q4": 0,
      "annual": 2300
    }
  },
  {
    "id": "28",
    "name": "Number of cows vaccinated against Rabies",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 300,
      "q4": 0,
      "annual": 300
    }
  },
  {
    "id": "29",
    "name": "Number of small livestock vaccinated against RVF",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "sheep": "30",
      "goats": "30a"
    }
  },
  {
    "id": "30",
    "name": "Number of Sheep vaccinated against RVF",
    "targets": {
      "q1": 2300,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 2300
    }
  },
  {
    "id": "30a",
    "name": "Number of Goats vaccinated against RVF",
    "targets": {
      "q1": 64600,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 64600
    }
  },
  {
    "id": "31",
    "name": "Number of livestock insured",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "pig": "32",
      "chicken": "33"
    }
  },
  {
    "id": "32",
    "name": "Number of pigs insured",
    "targets": {
      "q1": 50,
      "q2": 200,
      "q3": 100,
      "q4": 150,
      "annual": 500
    }
  },
  {
    "id": "33",
    "name": "Number of poultry insured",
    "targets": {
      "q1": 0,
      "q2": 1000,
      "q3": 7000,
      "q4": 3000,
      "annual": 11000
    }
  },
  {
    "id": "34",
    "name": "Quantity of Fish produced (MT)",
    "targets": {
      "q1": 70,
      "q2": 100,
      "q3": 100,
      "q4": 30,
      "annual": 300
    }
  },
  {
    "id": "35",
    "name": "Quantity of Full washed Coffee produced(MT)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 500,
      "annual": 500
    }
  },
  {
    "id": "36",
    "name": "Area of vegetables planted (Ha)",
    "targets": {
      "q1": 200,
      "q2": 80,
      "q3": 60,
      "q4": 120,
      "annual": 460
    }
  },
  {
    "id": "37",
    "name": "Number of productive jobs created",
    "targets": {
      "q1": 840,
      "q2": 840,
      "q3": 1820,
      "q4": 1000,
      "annual": 4500
    }
  },
  {
    "id": "38",
    "name": "Number of workplace learning beneficiaries (Interns/Apprenticeships)",
    "targets": {
      "q1": 21,
      "q2": 32,
      "q3": 53,
      "q4": 8,
      "annual": 114
    }
  },
  {
    "id": "39",
    "name": "Number of Start-up existing and new MSMEs coached to access finance",
    "targets": {
      "q1": 30,
      "q2": 70,
      "q3": 80,
      "q4": 54,
      "annual": 234
    }
  },
  {
    "id": "40",
    "name": "Number of Productive Uses connected",
    "targets": {
      "q1": 3,
      "q2": 3,
      "q3": 3,
      "q4": 11,
      "annual": 20
    }
  },
  {
    "id": "41",
    "name": "Number of new households connected to electricity",
    "targets": {
      "q1": 50,
      "q2": 50,
      "q3": 500,
      "q4": 4400,
      "annual": 5000
    }
  },
  {
    "id": "42",
    "name": "Number of new households connected to off-grid electricity",
    "targets": {
      "q1": 100,
      "q2": 100,
      "q3": 100,
      "q4": 200,
      "annual": 500
    }
  },
  {
    "id": "43",
    "name": "Percentage of works for 9 km of Nyuruvumu Gahushyi-Gituku feeder road rehabilitated",
    "targets": {
      "q1": "62%",
      "q2": "65%",
      "q3": "70%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "44",
    "name": "Number of Ha of detailed physical plan elaborated",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 25,
      "annual": 25
    }
  },
  {
    "id": "45",
    "name": "Level of compliance of developed land use plan",
    "targets": {
      "q1": "50%",
      "q2": "-",
      "q3": "-",
      "q4": "-",
      "annual": "50%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "46",
    "name": "Percentage of expropriated land parcels successfully registered in land information system(LAIS)",
    "targets": {
      "q1": 0,
      "q2": "30%",
      "q3": "40%",
      "q4": "50%",
      "annual": "50%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "47",
    "name": "Area of degraded forest rehabilitated (Ha)",
    "targets": {
      "q1": 0,
      "q2": 150,
      "q3": 0,
      "q4": 0,
      "annual": 150
    }
  },
  {
    "id": "48",
    "name": "Area of consolidated land under agroforestry (Ha)",
    "targets": {
      "q1": 0,
      "q2": 1615,
      "q3": "-",
      "q4": "-",
      "annual": 1615
    }
  },
  {
    "id": "49",
    "name": "Number of agroforestry trees planted in non-consolidated land",
    "targets": {
      "q1": 0,
      "q2": 819364,
      "q3": "-",
      "q4": "-",
      "annual": 819364
    }
  },
  {
    "id": "50",
    "name": "Number of fruit trees planted",
    "targets": {
      "q1": 0,
      "q2": 42500,
      "q3": 0,
      "q4": 0,
      "annual": 42500
    }
  },
  {
    "id": "51",
    "name": "Number of tree nurseries established and managed",
    "targets": {
      "q1": 4,
      "q2": "-",
      "q3": 0,
      "q4": 0,
      "annual": 4
    }
  },
  {
    "id": "52",
    "name": "Number of eligible HH beneficiaries for VUP/PW (HBECD)",
    "targets": {
      "q1": 1666,
      "q2": 1666,
      "q3": 1666,
      "q4": 1666,
      "annual": 1666
    }
  },
  {
    "id": "53",
    "name": "Percentage of timely payments made to VUP / ePW-HBECD beneficiaries (within 15 days after the end of working period)",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "54",
    "name": "Number of targeted graduation participants receiving a graduation package (Example :Safety net, Livelihood, Financial Inclusion, Coaching..)",
    "targets": {
      "q1": "0%",
      "q2": "0%",
      "q3": 4000,
      "q4": 4670,
      "annual": 8670
    }
  },
  {
    "id": "55",
    "name": "Number of eligible/poor families received cows through Girinka program",
    "targets": {
      "q1": 158,
      "q2": 175,
      "q3": 192,
      "q4": 104,
      "annual": 629
    }
  },
  {
    "id": "56",
    "name": "Number of extremely poor HHs supported with small livestock (i.e. pigs, goats or poultry)",
    "targets": {
      "q1": "-",
      "q2": 150,
      "q3": 150,
      "q4": 200,
      "annual": 500
    }
  },
  {
    "id": "57",
    "name": "Number of graduation participants provided with productive Assets Transfer (toolkits)",
    "targets": {
      "q1": "-",
      "q2": "-",
      "q3": "-",
      "q4": 288,
      "annual": 288
    }
  },
  {
    "id": "58",
    "name": "Number of People from extremely poor HHs supported to access technical/ vocational skills",
    "targets": {
      "q1": "-",
      "q2": "-",
      "q3": 198,
      "q4": "-",
      "annual": 198
    }
  },
  {
    "id": "59",
    "name": "Percentage of timely payment of eligible HHs benefiting from VUP Direct Support transfers",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "60",
    "name": "Loans advanced to eligible beneficiaries under VUP/Financial services to support their Income Generating Activities",
    "targets": {
      "q1": 50,
      "q2": 150,
      "q3": 200,
      "q4": 311,
      "annual": 711
    }
  },
  {
    "id": "61",
    "name": "percentage of loans provided through VUP financial service third scheme loans recovered",
    "targets": {
      "q1": "80%",
      "q2": "80%",
      "q3": "80%",
      "q4": "80%",
      "annual": "80%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "62",
    "name": "Number of genocide survivors supported with shelter",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 6,
      "annual": 6
    }
  },
  {
    "id": "63",
    "name": "Percentage of eligible population covered by CBHI",
    "targets": {
      "q1": "85%",
      "q2": "90%",
      "q3": "95%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "64",
    "name": "Percentage of Needy genocide survivors provided Ordinary Direct Support and Special Direct Support within 10 days following the end of the month",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "65",
    "name": "Number of needy Genocide survivors provided support for Income Generating Activities",
    "targets": {
      "q1": 0,
      "q2": 30,
      "q3": 0,
      "q4": 35,
      "annual": 65
    }
  },
  {
    "id": "66",
    "name": "Number of cooperatives of People with Disabilities (PwDs) supported",
    "targets": {
      "q1": "-",
      "q2": 1,
      "q3": 3,
      "q4": 0,
      "annual": 4
    }
  },
  {
    "id": "67",
    "name": "Number of vulnerable PwDs supported with assistive devices",
    "targets": {
      "q1": 30,
      "q2": 50,
      "q3": 40,
      "q4": 30,
      "annual": 150
    }
  },
  {
    "id": "68",
    "name": "Percentage of eligible People (Aged 35 and above for women; and 40 years and above for Men) who received at least one NCDs community check up within last 12 months",
    "targets": {
      "q1": "20%",
      "q2": "40%",
      "q3": "80%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "69",
    "name": "Percentage of people screened positive to Hypertension and Diabetes enrolled into care and treatment",
    "targets": {
      "q1": "20%",
      "q2": "40%",
      "q3": "60%",
      "q4": "80%",
      "annual": "80%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "70",
    "name": "Percentage of pregnant women attending at least four ANC visits.",
    "targets": {
      "q1": "15%",
      "q2": "40%",
      "q3": "60%",
      "q4": "72%",
      "annual": "72%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "71",
    "name": "Percentage of women attending ANC 1 in first Trimester",
    "targets": {
      "q1": "15%",
      "q2": "40%",
      "q3": "60%",
      "q4": "62%",
      "annual": "62%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "72",
    "name": "Prevalence (%) of modern contraceptive use (FP methods)",
    "targets": {
      "q1": "15%",
      "q2": "35%",
      "q3": "45%",
      "q4": "65%",
      "annual": "65%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "73",
    "name": "Percentage of Births deliveries in health facilities (HC+DH)",
    "targets": {
      "q1": "20%",
      "q2": "60%",
      "q3": "80%",
      "q4": "95%",
      "annual": "95%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "74",
    "name": "Percentage of works of RUBONA hospitalization bloc,laundry,public toilet and fence constructed",
    "targets": {
      "q1": "0%",
      "q2": "0%",
      "q3": "50%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "75",
    "name": "Percentage of existing health posts operationalized",
    "targets": {
      "q1": "95%",
      "q2": "95%",
      "q3": "95%",
      "q4": "95%",
      "annual": "95%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "76",
    "name": "Percentage of under 5 years Children screened (MUAC and weight per age)",
    "targets": {
      "q1": "0",
      "q2": "45%",
      "q3": "75%",
      "q4": "95%",
      "annual": "95%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "77",
    "name": "Percentage children aged 3,6,9,12,15 and 18 months screened using length mat for stunting visualization",
    "targets": {
      "q1": "0",
      "q2": "45%",
      "q3": "75%",
      "q4": "95%",
      "annual": "95%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "78",
    "name": "Percentage health facilities complying with storage standards of nutrition commodities (FBF, milk and Ongera)",
    "targets": {
      "q1": "10%",
      "q2": "40%",
      "q3": "60%",
      "q4": "95%",
      "annual": "95%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "79",
    "name": "Percentage of stunting among children under 2 years (Routine growth monitoring on monthly basis data from MCH week)",
    "targets": {
      "q1": "0%",
      "q2": "0%",
      "q3": "0%",
      "q4": "11%",
      "annual": "11%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "80",
    "name": "Proportion of ECD facilities that consistently and correctly record children information through ECD book each month",
    "targets": {
      "q1": "40%",
      "q2": "65%",
      "q3": "85%",
      "q4": "85%",
      "annual": "85%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "81",
    "name": "Number of new community based ECD settings established (one per sector).",
    "targets": {
      "q1": 0,
      "q2": 5,
      "q3": 5,
      "q4": 4,
      "annual": 14
    }
  },
  {
    "id": "82",
    "name": "percentage of ECD settings meeting the minimum quality standards for accreditation",
    "targets": {
      "q1": "0%",
      "q2": "40%",
      "q3": "70%",
      "q4": "80%",
      "annual": "80%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "83",
    "name": "percentage of works of ECD construction in RURENGE, RUKIRA",
    "targets": {
      "q1": "80%",
      "q2": "100%",
      "q3": "0",
      "q4": "0",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "84",
    "name": "Percentage of parents with children aged 0-35 months benefiting from early child stimulation and positive parenting services through home visitations by CHWs",
    "targets": {
      "q1": "40%",
      "q2": "60%",
      "q3": "75%",
      "q4": "85%",
      "annual": "85%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "85",
    "name": "Number of ECD Days and Social Behaviour Change Campaigns (SBCC) on nutrition and child Protection conducted",
    "targets": {
      "q1": 0,
      "q2": 1,
      "q3": 0,
      "q4": 1,
      "annual": 2
    }
  },
  {
    "id": "86",
    "name": "Percentage of children 3-6 years per Village attending ECD facilities/settings (home, community, center based)",
    "targets": {
      "q1": "65%",
      "q2": "70%",
      "q3": "80%",
      "q4": "95%",
      "annual": "95%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "87",
    "name": "Percentage of works progress for constructions of 15 classrooms and 24 toilets",
    "targets": {
      "q1": "0",
      "q2": "0",
      "q3": "60%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "88",
    "name": "Percentage of works progress for 24 toilets constructed",
    "targets": {
      "q1": "0",
      "q2": "-",
      "q3": "60%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "89",
    "name": "Completion of 4 retaining walls",
    "targets": {
      "q1": "80%",
      "q2": "100%",
      "q3": "0",
      "q4": "0",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "90",
    "name": "Repetition rate in Primary school decreased",
    "targets": {
      "q1": "27%",
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": "27%"
    },
    "measurementType": "decreasing"
  },
  {
    "id": "91",
    "name": "Percentage of Dropout rate decrease in primary",
    "targets": {
      "q1": "4.9%",
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": "4.9%"
    },
    "measurementType": "decreasing"
  },
  {
    "id": "92",
    "name": "Number of non-literate adults trained",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 1500,
      "annual": 1500
    }
  },
  {
    "id": "93",
    "name": "Percentage of students fed at school (primary)",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "94",
    "name": "Percentage of students fed at school (secondary)",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "95",
    "name": "Number of Classrooms constructed",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 10,
      "annual": 10
    }
  },
  {
    "id": "96",
    "name": "Number of students enrolled in pre-primary schools",
    "targets": {
      "q1": 0,
      "q2": 16273,
      "q3": "-",
      "q4": 0,
      "annual": 16273
    }
  },
  {
    "id": "97",
    "name": "Percentage of payments for Teachers’ salaries made on time. (Submission of payment requests not later than 15th of every Month)",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "98",
    "name": "Payments for Capitation grant made on time",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "99",
    "name": "Percentage of Education information recorded into the SDMS system with accuracy",
    "targets": {
      "q1": "-",
      "q2": "70%",
      "q3": "80%",
      "q4": "85%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "100",
    "name": "Comprehensive Assessment and Inspection data recorded (Comprehensive Assessment Management Information System (CAMIS)",
    "targets": {
      "q1": "-",
      "q2": "100%",
      "q3": "-",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "101",
    "name": "Percentage of students attending school (Primary, Secondary and TVETs)",
    "targets": {
      "q1": "98%",
      "q2": "98%",
      "q3": "98%",
      "q4": "98%",
      "annual": "98%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "102",
    "name": "Percentage of Students passing comprehensive assessment: Primary",
    "targets": {
      "q1": 0,
      "q2": "80%",
      "q3": "80%",
      "q4": "80%",
      "annual": "80%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "103",
    "name": "Percentage of Students passing comprehensive assessment: Secondary",
    "targets": {
      "q1": 0,
      "q2": "80%",
      "q3": "80%",
      "q4": "80%",
      "annual": "80%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "104",
    "name": "Percentage of Students in TVET L3 to L5 pass comprehensive assessment",
    "targets": {
      "q1": 0,
      "q2": "80%",
      "q3": "80%",
      "q4": "80%",
      "annual": "80%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "105",
    "name": "Number of citizens (15 years old and above) trained in basic digital literacy (Cumulative)",
    "targets": {
      "q1": 11400,
      "q2": 11400,
      "q3": 11400,
      "q4": 11400,
      "annual": 45600
    }
  },
  {
    "id": "106",
    "name": "Number of New households connected to safe/drinking water (into their dwellings/premises)",
    "targets": {
      "q1": 80,
      "q2": 102,
      "q3": 102,
      "q4": 166,
      "annual": 450
    }
  },
  {
    "id": "107",
    "name": "Percentage of operational public water taps on functional Water Supply Systems",
    "targets": {
      "q1": "98%",
      "q2": "98%",
      "q3": "98%",
      "q4": "98%",
      "annual": "98%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "108",
    "name": "Public institutions and socio-economic use areas connected to clean water",
    "targets": {
      "q1": 1,
      "q2": 1,
      "q3": 1,
      "q4": 2,
      "annual": 5
    }
  },
  {
    "id": "109",
    "name": "Percentage of public places (schools, hospitals, markets, car parks, administrative offices, churches, bars and restaurant) with hygiene and sanitation facilities (toilets, handwashing facilities, dustbins)",
    "targets": {
      "q1": "10%",
      "q2": "40%",
      "q3": "25%",
      "q4": "25%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "110",
    "name": "Number of graduation participants provided with houses (shelters)",
    "targets": {
      "q1": 0,
      "q2": 9,
      "q3": 51,
      "q4": 100,
      "annual": 160
    }
  },
  {
    "id": "111",
    "name": "Number of houses in poor conditions rehabilitated for graduation participants",
    "targets": {
      "q1": 0,
      "q2": 7,
      "q3": 200,
      "q4": 241,
      "annual": 448
    }
  },
  {
    "id": "112",
    "name": "Number of graduation participants provided with adequate toilets",
    "targets": {
      "q1": 0,
      "q2": 15,
      "q3": 70,
      "q4": 100,
      "annual": 185
    }
  },
  {
    "id": "113",
    "name": "Number of toilets in poor conditions rehabilitated for eligible graduation participants",
    "targets": {
      "q1": 0,
      "q2": 90,
      "q3": 392,
      "q4": 385,
      "annual": 867
    }
  },
  {
    "id": "114",
    "name": "Percentage of villages in the district with operational Umugoroba w'Imiryango",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "115",
    "name": "Percentage of identified GBV and child abuse victims reached Isange One Stop Center received reintegrated services/ support",
    "targets": {
      "q1": "10%",
      "q2": "20%",
      "q3": "60%",
      "q4": "90%",
      "annual": "90%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "116",
    "name": "Percentage of identified street children reunified with families",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "117",
    "name": "Percentage graduates from rehabilitation Centers reintegrated in the community (continued education, self-employed or employed)",
    "targets": {
      "q1": "0%",
      "q2": 0,
      "q3": 0,
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "118",
    "name": "Percentage of delinquents benefitted preliminary rehabilitation program in transit center",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "119",
    "name": "Number of Children in child care institutions reintegrated into families/Detentions",
    "targets": {
      "q1": 2,
      "q2": 3,
      "q3": 3,
      "q4": 2,
      "annual": 10
    }
  },
  {
    "id": "120",
    "name": "Level of operationalization of Child Labor Elimination and Prevention Committee at District, Sector, Cell and Village level",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "121",
    "name": "Proportion of teenage mothers who reintegrated to school",
    "targets": {
      "q1": 0,
      "q2": "45%",
      "q3": 0,
      "q4": 0,
      "annual": "45%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "122",
    "name": "percentage of villages in which community-based rehabilitation is effectively operational",
    "targets": {
      "q1": "0%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "123",
    "name": "Percentage of identified child protection cases from July 2025 to June 2026 handled by District (Cases from IZU, 711 hotline and other channels)",
    "targets": {
      "q1": "90%",
      "q2": "90%",
      "q3": "90%",
      "q4": "90%",
      "annual": "90%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "124",
    "name": "Teenage Pregnancy Rate",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 20,
      "annual": 20
    }
  },
  {
    "id": "125",
    "name": "Percentage of Citizens' demands/complaints received and timely resolved by Local Government",
    "targets": {
      "q1": "97%",
      "q2": "97%",
      "q3": "97%",
      "q4": "97%",
      "annual": "97%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "126",
    "name": "Percentage of Irembo services delivered by Local Government within the set timeframe",
    "targets": {
      "q1": "99%",
      "q2": "99%",
      "q3": "99%",
      "q4": "99%",
      "annual": "99%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "127",
    "name": "Percentage of self application of services delivered by LG via Irembo",
    "targets": {
      "q1": "9%",
      "q2": "9%",
      "q3": "9%",
      "q4": "9%",
      "annual": "9%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "128",
    "name": "Percentage of birth events occurring at health facilities timely recorded in NCI-CRVS",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "129",
    "name": "Percentage of death events occurring at health facilities timely recorded in NCI-CRVS",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "130",
    "name": "Percentage of births events occurring at community timely registered in the NCI-CRVS system",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "131",
    "name": "Percentage of deaths events occurring at community timely registered in the NCI-CRVS system",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "132",
    "name": "Percentage of marriage and divorce events timely recorded in NCI-CRVS",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "133",
    "name": "Number of biometric data capture sessions organized and executed at sector level per month (at least 4 sessions per month with at least 100 citizens’ biometric collected per month)",
    "targets": {
      "q1": 96,
      "q2": 96,
      "q3": 96,
      "q4": 96,
      "annual": 384
    }
  },
  {
    "id": "134",
    "name": "Number of assessments hierarchically conducted on sub District entities performance in transformational imihigo",
    "targets": {
      "q1": 1,
      "q2": 1,
      "q3": 1,
      "q4": 1,
      "annual": 4
    }
  },
  {
    "id": "135",
    "name": "Percentage of Local new recruited Government staff benefited from capacity development interventions (disaggregated by Sector, Cell and Village)",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "136",
    "name": "Number of cell offices rehabilitated",
    "targets": {
      "q1": 0,
      "q2": 1,
      "q3": 0,
      "q4": 0,
      "annual": 1
    }
  },
  {
    "id": "137",
    "name": "Percentage of disputes handled by Abunzi Committees",
    "targets": {
      "q1": "98%",
      "q2": "98%",
      "q3": "98%",
      "q4": "100%",
      "annual": "99.6%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "138",
    "name": "Percentage of cases executed by end march 2026",
    "targets": {
      "q1": "20%",
      "q2": "40%",
      "q3": "65%",
      "q4": "85%",
      "annual": "85%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "139",
    "name": "Percentage of government funds recovered from recoverable won case (85%)",
    "targets": {
      "q1": "-",
      "q2": "20%",
      "q3": "50%",
      "q4": "85%",
      "annual": "85%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "140",
    "name": "Percentage of Villages with effectively operational Itorero structures",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "141",
    "name": "Percentage of schools with effectively operational Itorero structures",
    "targets": {
      "q1": "100%",
      "q2": "100%",
      "q3": "100%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "142",
    "name": "Proportion of youth ( S.6 finalist) enrolled in Voluntary National Service (Urugerero)",
    "targets": {
      "q1": "0%",
      "q2": "0%",
      "q3": "80%",
      "q4": "0%",
      "annual": "80%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "143",
    "name": "Number of Ndi Umunyarwanda sessions conducted",
    "targets": {
      "q1": 0,
      "q2": 1,
      "q3": 0,
      "q4": 0,
      "annual": 1
    }
  },
  {
    "id": "144",
    "name": "Number dialogues conducted during Unity and resilience month",
    "targets": {
      "q1": 0,
      "q2": 1,
      "q3": 0,
      "q4": 1,
      "annual": 1
    }
  },
  {
    "id": "145",
    "name": "Amount of own revenues generated (Frw)",
    "targets": {
      "q1": "331,650,284",
      "q2": "411,212,592",
      "q3": "575,515,706",
      "q4": "366,852,181",
      "annual": "1,685,230,763"
    }
  },
  {
    "id": "146",
    "name": "Percentage of Auditor general's recommendations implemented",
    "targets": {
      "q1": "25%",
      "q2": "50%",
      "q3": "65%",
      "q4": "70%",
      "annual": "70%"
    },
    "isDual": true,
    "measurementType": "percentage"
  },
  {
    "id": "147",
    "name": "Number of risk-based Areas audited",
    "targets": {
      "q1": 0,
      "q2": 2,
      "q3": 4,
      "q4": 4,
      "annual": 10
    }
  },
  {
    "id": "148",
    "name": "Percentage of District NBAs assessed using peer review - peer learning approach",
    "targets": {
      "q1": "20%",
      "q2": "50%",
      "q3": "75%",
      "q4": "100%",
      "annual": "100%"
    },
    "isDual": true,
    "measurementType": "percentage"
  }
];

export const QUARTERS = [
  { id: 'q1', name: 'Quarter 1', months: ['July', 'August', 'September'] },
  { id: 'q2', name: 'Quarter 2', months: ['October', 'November', 'December'] },
  { id: 'q3', name: 'Quarter 3', months: ['January', 'February', 'March'] },
  { id: 'q4', name: 'Quarter 4', months: ['April', 'May', 'June'] }
];

export const PILLARS = [
  {
    id: "economic",
    name: "Economic Transformation Pillar",
    outputs: [
      {
        id: "economic-output-1",
        name: "Economic Development Indicators",
        indicators: INDICATORS.filter(indicator =>
          ['1', '2', '3', '8', '10', '15', '16', '22', '23', '24', '29', '31', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51'].includes(indicator.id)
        )
      }
    ]
  },
  {
    id: "social",
    name: "Social Transformation Pillar",
    outputs: [
      {
        id: "social-output-1",
        name: "Social Development Indicators",
        indicators: INDICATORS.filter(indicator =>
          ['52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '118', '119', '120', '121', '122', '123', '124'].includes(indicator.id)
        )
      }
    ]
  },
  {
    id: "governance",
    name: "Transformational Governance Pillar",
    outputs: [
      {
        id: "governance-output-1",
        name: "Governance Indicators",
        indicators: INDICATORS.filter(indicator =>
          ['125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148'].includes(indicator.id)
        )
      }
    ]
  }
];
