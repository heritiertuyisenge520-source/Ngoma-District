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
  baseline?: number;
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
    "name": "Area under land use consolidation for Soya(Ha)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "8",
    "name": "Metric tons of consolidated priority crops (Maize)",
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
      "soya": "8b"
    }
  },
  {
    "id": "8a",
    "name": "Maize yield (Metric tons)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "8b",
    "name": "Soya yield (Metric tons)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "10",
    "name": "Number of farmers with land use consolidation",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "15",
    "name": "Number of TVS supported",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "16",
    "name": "Number of TVS trained",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "22",
    "name": "Number of farmers trained in postharvest handling and storage",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "23",
    "name": "Number of farmers with improved postharvest handling and storage",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "24",
    "name": "Number of postharvest handling and storage technologies",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "29",
    "name": "Number of farmers with access to irrigation",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "31",
    "name": "Number of livestock farmers supported",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "isDual": true,
    "subIndicatorIds": {
      "chicken": "31a",
      "cattle": "31b",
      "pig": "31c",
      "goat": "31d"
    }
  },
  {
    "id": "31a",
    "name": "Number of poultry farmers supported",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "31b",
    "name": "Number of cattle farmers supported",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "31c",
    "name": "Number of pig farmers supported",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "31d",
    "name": "Number of goat farmers supported",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "34",
    "name": "Number of farmers practicing climate smart agriculture",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "35",
    "name": "Ha under climate smart agriculture",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "36",
    "name": "Number of farmers with access to credit",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "37",
    "name": "Amount of credit accessed (Frw)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "38",
    "name": "Number of farmers linked to markets",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "39",
    "name": "Value of agricultural produce sold (Frw)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "40",
    "name": "Number of farmers with agricultural insurance",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "41",
    "name": "Number of jobs created in agriculture",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "42",
    "name": "Number of youth employed in agriculture",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "43",
    "name": "Number of women employed in agriculture",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "44",
    "name": "Agricultural GDP growth rate (%)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "measurementType": "percentage"
  },
  {
    "id": "45",
    "name": "Agricultural productivity index",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "46",
    "name": "Export value of agricultural products (Frw)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "47",
    "name": "Import value of agricultural inputs (Frw)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "48",
    "name": "Food self-sufficiency rate (%)",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    },
    "measurementType": "percentage"
  },
  {
    "id": "49",
    "name": "Number of agricultural cooperatives",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "50",
    "name": "Number of farmers in cooperatives",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  },
  {
    "id": "51",
    "name": "Number of agricultural processing facilities",
    "targets": {
      "q1": 0,
      "q2": 0,
      "q3": 0,
      "q4": 0,
      "annual": 0
    }
  }
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
