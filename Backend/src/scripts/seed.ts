
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PillarModel } from '../models';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PILLARS_DATA = [
    {
        id: 'economic',
        name: 'Economic Transformation Pillar',
        outputs: [
                {
                    id: 'ec_out_1',
                    name: 'Agricultural land management and production models improved',
                    indicators: [
                        { id: '1', name: '1. Ha of land meeting FOBASI operationalization criteria with agronomic KPIs', targets: { q1: 0, q2: 0, q3: 0, q4: 18713, annual: 18713 } },
                        { id: '2', name: '2. Ha of Land meeting FOBASI Operationalization criteria with Agronomic and Managerial KPIs', targets: { q1: 0, q2: 0, q3: 0, q4: 1740, annual: 1740 } },
                        { id: '3', name: '3. Ha of land use consolidation for priority crops', isDual: true, targets: { q1: 3340, q2: 17568, q3: 335, q4: 0, annual: 21243 } },
                        { id: '4', name: '4. Area under land use consolidation for Cassava(Ha)', targets: { q1: 250, q2: 1250, q3: 0, q4: 0, annual: 1500 } },
                        { id: '5', name: '5. Area under land use consolidation for Rice(Ha)', targets: { q1: 1049, q2: 141, q3: 1190, q4: 0, annual: 2380 } },
                        { id: '6', name: '6. Area under land use consolidation for Beans(Ha)', targets: { q1: 3048, q2: 17999, q3: 20026, q4: 1430, annual: 42503 } },
                        { id: '7', name: '7. Area under land use consolidation for Soya bean(Ha)', targets: { q1: 50, q2: 91, q3: 109, q4: 0, annual: 250 } }
                    ]
                },
                {
                    id: 'ec_out_2',
                    name: 'Access to improved seeds & mineral fertilizers',
                    indicators: [
                        { id: '8', name: '8. Quantity of improved seed', isDual: true, targets: { q1: 25122, q2: 167762, q3: 6040, q4: 0, annual: 198924 } },
                        { id: '9', name: '9. Quantity of improved Soybeans seeds used (Kg)', targets: { q1: 2350, q2: 5900, q3: 6578, q4: 0, annual: 14828 } },
                        { id: '10', name: '10. Quantity of mineral fertilizer used', isDual: true, targets: { q1: 92900, q2: 406826, q3: 110274, q4: 0, annual: 610000 } },
                        { id: '11', name: '11. Quantity of UREA used (Kg)', targets: { q1: 76000, q2: 423997, q3: 152673, q4: 8000, annual: 660670 } },
                        { id: '12', name: '12. Quantity of NPK used (Kg)', targets: { q1: 141495, q2: 112225, q3: 196410, q4: 0, annual: 450130 } },
                        { id: '13', name: '13. Quantity of Blended fertilizers used (Kg)', targets: { q1: 2000, q2: 13250, q3: 7750, q4: 27000, annual: 50000 } },
                        { id: '14', name: '14. Quantity of lime used (Kg)', targets: { q1: 181500, q2: 311750, q3: 306750, q4: 0, annual: 800000 } }
                    ]
                },
                {
                    id: 'ec_out_3',
                    name: 'Climate Resilience & Crop Insurance',
                    indicators: [
                        { id: '15', name: '15. Area under progressive terraces developed (Ha)', targets: { q1: 50, q2: 20, q3: 80, q4: 0, annual: 150 } },
                        { id: '16', name: '16. Area of crops insured(Ha)', isDual: true, targets: { q1: 0, q2: 205, q3: 5, q4: 0, annual: 210 } },
                        { id: '17', name: '17. Area of Rice insured (Ha)', targets: { q1: 818, q2: 232, q3: 825, q4: 75, annual: 1950 } },
                        { id: '18', name: '18. Area of Beans insured (Ha)', targets: { q1: 0, q2: 9, q3: 6, q4: 0, annual: 15 } },
                        { id: '19', name: '19. Area of Chilli insured (Ha)', targets: { q1: 0, q2: 3, q3: 7, q4: 0, annual: 10 } },
                        { id: '20', name: '20. Area of soybeans insured (Ha)', targets: { q1: 0, q2: 9, q3: 6, q4: 0, annual: 15 } },
                        { id: '21', name: '21. Area of French beans insured (Ha)', targets: { q1: 0, q2: 6, q3: 4, q4: 0, annual: 10 } }
                    ]
                },
                {
                    id: 'ec_out_4',
                    name: 'Animal breeding and Health systems',
                    indicators: [
                        { id: '22', name: '22. Number of cows inseminated', targets: { q1: 1000, q2: 1000, q3: 1000, q4: 581, annual: 3581 } },
                        { id: '23', name: '23. Number of AI born calves recorded', targets: { q1: 300, q2: 250, q3: 250, q4: 400, annual: 1200 } },
                        { id: '24', name: '24. Number of cows vaccinated against disease', isDual: true, targets: { q1: 0, q2: 0, q3: 34000, q4: 0, annual: 34000 } },
                        { id: '25', name: '25. Number of cows vaccinated against LSD', targets: { q1: 0, q2: 0, q3: 34000, q4: 0, annual: 34000 } },
                        { id: '26', name: '26. Number of cows vaccinated against RVF', targets: { q1: 34000, q2: 0, q3: 0, q4: 0, annual: 34000 } },
                        { id: '27', name: '27. Number of cows vaccinated against Brucellosis', targets: { q1: 0, q2: 0, q3: 2300, q4: 0, annual: 2300 } },
                        { id: '28', name: '28. Number of cows vaccinated against Rabies', targets: { q1: 0, q2: 0, q3: 300, q4: 0, annual: 300 } },
                        { id: '29', name: '29. Number of small livestock vaccinated against RVF', isDual: true, targets: { q1: 64600, q2: 0, q3: 0, q4: 0, annual: 64600 } },
                        { id: '30', name: '30. Number of Sheep vaccinated against RVF', targets: { q1: 2300, q2: 0, q3: 0, q4: 0, annual: 2300 } }
                    ]
                },
                {
                    id: 'ec_out_5',
                    name: 'Livestock and Fisheries',
                    indicators: [
                        { id: '31', name: '31. Number of livestock insured', isDual: true, targets: { q1: 150, q2: 200, q3: 450, q4: 230, annual: 1030 } },
                        { id: '32', name: '32. Number of pigs insured', targets: { q1: 50, q2: 200, q3: 100, q4: 150, annual: 500 } },
                        { id: '33', name: '33. Number of poultry insured', targets: { q1: 0, q2: 1000, q3: 7000, q4: 3000, annual: 11000 } },
                        { id: '34', name: '34. Quantity of Fish produced (MT)', targets: { q1: 70, q2: 100, q3: 100, q4: 30, annual: 300 } },
                        { id: '35', name: '35. Quantity of Full washed Coffee produced(MT)', targets: { q1: 0, q2: 0, q3: 0, q4: 500, annual: 500 } },
                        { id: '36', name: '36. Area of vegetables planted (Ha)', targets: { q1: 200, q2: 80, q3: 60, q4: 120, annual: 460 } }
                    ]
                },
            {
                id: 'ec_out_6',
                name: 'Infrastructure and Job Creation',
                indicators: [
                    { id: '37', name: '37. Number of  productive jobs created', targets: { q1: 840, q2: 840, q3: 1820, q4: 1000, annual: 4500 } },
                    { id: '38', name: '38. Number of workplace learning beneficiaries (Interns/Apprenticeships)', targets: { q1: 21, q2: 32, q3: 53, q4: 8, annual: 114 } },
                    { id: '39', name: '39. Number of Start0up existing  and new MSMEs coached to access finance', targets: { q1: 30, q2: 70, q3: 80, q4: 54, annual: 234 } },
                    { id: '40', name: '40. Number of Productive Uses connected', targets: { q1: 3, q2: 3, q3: 3, q4: 11, annual: 20 } },
                    { id: '41', name: '41. Number of new households  connected to electricity', targets: { q1: 50, q2: 50, q3: 500, q4: 4400, annual: 5000 } },
                    { id: '42', name: '42. Number of new households connected to off0grid electricity', targets: { q1: 100, q2: 100, q3: 100, q4: 200, annual: 500 } },
                    { id: '43', name: '43. Percentage of works for 9 km of Nyuruvumu Gahushyi0Gituku feeder road rehabilitated', isDual: true, targets: { q1: "62%", q2: "65%", q3: "70%", q4: "100%", annual: "100%" } }
                ]
            },
            {
                id: 'ec_out_7',
                name: 'Land Use and Forest Management',
                indicators: [
                    { id: '44', name: '44. Number of Ha of detailed physical plan elaborated', targets: { q1: 0, q2: 0, q3: 0, q4: 25, annual: 25 } },
                    { id: '45', name: '45. Level of compliance of developed land use plan', isDual: true, targets: { q1: "50%", q2: "-", q3: "-", q4: "-", annual: "50%" } },
                    { id: '46', name: '46. Percentage of expropriated land parcels successfully registered in land information system(LAIS)', isDual: true, targets: { q1: 0, q2: "30%", q3: "40%", q4: "50%", annual: "50%" } },
                    { id: '47', name: '47. Area of degraded forest rehabilitated (Ha)', targets: { q1: 0, q2: 150, q3: 0, q4: 0, annual: 150 } },
                    { id: '48', name: '48. Area of consolidated land under agroforestry (Ha)', targets: { q1: 0, q2: 1615, q3: "-", q4: "-", annual: 1615 } },
                    { id: '49', name: '49. Number of agroforestry trees planted in non0consolidated land', targets: { q1: 0, q2: 819364, q3: "-", q4: "-", annual: 819364 } },
                    { id: '50', name: '50. Number of fruit trees planted', targets: { q1: 0, q2: 42500, q3: 0, q4: 0, annual: 42500 } },
                    { id: '51', name: '51. Number of tree nurseries established and managed', targets: { q1: 4, q2: "-", q3: 0, q4: 0, annual: 4 } }
                ]
            }
        ]
    },
    {
        id: 'social',
        name: 'Social Transformation Pillar',
        outputs: [
            {
                id: 'so_out_1',
                name: 'VUP and Graduation Support',
                indicators: [
                    { id: '52', name: '52. Number of eligible HH beneficiaries for VUP/PW (HBECD)', targets: { q1: 1666, q2: 1666, q3: 1666, q4: 1666, annual: 1666 } },
                    { id: '53', name: '53. Percentage of timely payments made to VUP / ePW0HBECD beneficiaries (within 15 days after the end of working period)', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '54', name: '54. Number of targeted graduation participants receiving a graduation package (Example :Safety net, Livelihood, Financial Inclusion, Coaching..)', targets: { q1: "0%", q2: "0%", q3: 4000, q4: 4670, annual: 8670 } },
                    { id: '55', name: '55. Number of eligible/poor families received cows through Girinka program', targets: { q1: 158, q2: 175, q3: 192, q4: 104, annual: 629 } },
                    { id: '56', name: '56. Number of extremely poor HHs supported with small livestock (i.e. pigs, goats or poultry)', targets: { q1: "-", q2: 150, q3: 150, q4: 200, annual: 500 } },
                    { id: '57', name: '57. Number of graduation participants provided with productive Assets Transfer (toolkits)', targets: { q1: "-", q2: "-", q3: "-", q4: 288, annual: 288 } },
                    { id: '58', name: '58. Number of People from extremely poor HHs  supported to access technical/ vocational skills', targets: { q1: "-", q2: "-", q3: 198, q4: "-", annual: 198 } },
                    { id: '59', name: '59. Percentage of timely payment of eligible HHs  benefiting from VUP Direct Support transfers', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '60', name: '60. Loans advanced to eligible beneficiaries under VUP/Financial services to support their Income Generating Activities', targets: { q1: 50, q2: 150, q3: 200, q4: 311, annual: 711 } },
                    { id: '61', name: '61. percentage of loans provided through VUP financial service third scheme loans recovered', isDual: true, targets: { q1: "80%", q2: "80%", q3: "80%", q4: "80%", annual: "80%" } }
                ]
            },
            {
                id: 'so_out_2',
                name: 'Vulnerable Groups Support',
                indicators: [
                    { id: '62', name: '62. Number of genocide survivors supported with shelter', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 6 } },
                    { id: '63', name: '63. Percentage of eligible population covered by CBHI', isDual: true, targets: { q1: "85%", q2: "90%", q3: "95%", q4: "100%", annual: "100%" } },
                    { id: '64', name: '64. Percentage of Needy genocide survivors provided Ordinary Direct Support and Special Direct Support  within 10 days following the end of the month', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '65', name: '65. Number of  needy Genocide survivors provided support for Income Generating Activities', targets: { q1: 0, q2: 30, q3: 0, q4: 35, annual: 65 } },
                    { id: '66', name: '66. Number of cooperatives of People with Disabilities (PwDs) supported', targets: { q1: "-", q2: 1, q3: 3, q4: 0, annual: 4 } },
                    { id: '67', name: '67. Number of  vulnerable PwDs supported with assistive devices', targets: { q1: 30, q2: 50, q3: 40, q4: 30, annual: 150 } }
                ]
            },
            {
                id: 'so_out_3',
                name: 'Health and Maternal Care',
                indicators: [
                    { id: '68', name: '68. Percentage of eligible People (Aged 35 and above for women; and 40 years and above for Men) who received at least one NCDs community check up within last 12 months', isDual: true, targets: { q1: "20%", q2: "40%", q3: "80%", q4: "100%", annual: "100%" } },
                    { id: '69', name: '69. Percentage of people screened positive to Hypertension and Diabetes enrolled into care and treatment', isDual: true, targets: { q1: "20%", q2: "40%", q3: "60%", q4: "80%", annual: "80%" } },
                    { id: '70', name: '70. Percentage of pregnant women attending at least four ANC visits.', isDual: true, targets: { q1: "15%", q2: "40%", q3: "60%", q4: "72%", annual: "72%" } },
                    { id: '71', name: '71. Percentage of women attending ANC 1 in first Trimester', isDual: true, targets: { q1: "15%", q2: "40%", q3: "60%", q4: "62%", annual: "62%" } },
                    { id: '72', name: '72. Prevalence (%) of modern contraceptive use (FP methods)', isDual: true, targets: { q1: "15%", q2: "35%", q3: "45%", q4: "65%", annual: "65%" } },
                    { id: '73', name: '73. Percentage  of Births deliveries in health facilities (HC+DH)', isDual: true, targets: { q1: "20%", q2: "60%", q3: "80%", q4: "95%", annual: "95%" } },
                    { id: '74', name: '74. Percentage of works of  RUBONA hospitalization bloc,laundry,public toilet and fence     constructed', isDual: true, targets: { q1: "0%", q2: "0%", q3: "50%", q4: "100%", annual: "100%" } },
                    { id: '75', name: '75. Percentage of existing health posts operationalized', isDual: true, targets: { q1: "95%", q2: "95%", q3: "95%", q4: "95%", annual: "95%" } }
                ]
            },
            {
                id: 'so_out_4',
                name: 'Nutrition and Stunting Reduction',
                indicators: [
                    { id: '76', name: '76. Percentage of under 5 years Children screened (MUAC and weight per age)', isDual: true, targets: { q1: "0", q2: "45%", q3: "75%", q4: "95%", annual: "95%" } },
                    { id: '77', name: '77. Percentage  children aged 3,6,9,12,15 and 18  months screened using length mat for stunting visualization', isDual: true, targets: { q1: "0", q2: "45%", q3: "75%", q4: "95%", annual: "95%" } },
                    { id: '78', name: '78. Percentage health facilities  complying with storage standards of nutrition commodities (FBF, milk and Ongera)', isDual: true, targets: { q1: "10%", q2: "40%", q3: "60%", q4: "95%", annual: "95%" } },
                    { id: '79', name: '79. Percentage of stunting among children under 2 years (Routine  growth monitoring on monthly basis data from MCH week)', isDual: true, targets: { q1: "0%", q2: "0%", q3: "0%", q4: "11%", annual: "11%" } }
                ]
            },
            {
                id: 'so_out_5',
                name: 'Early Childhood Development (ECD)',
                indicators: [
                    { id: '80', name: '80. Proportion of ECD  facilities that consistently and correctly record children information through ECD book each month', isDual: true, targets: { q1: "40%", q2: "65%", q3: "85%", q4: "85%", annual: "85%" } },
                    { id: '81', name: '81. Number of new community based ECD settings established  (one per sector).', targets: { q1: 0, q2: 5, q3: 5, q4: 4, annual: 14 } },
                    { id: '82', name: '82. percentage of ECD settings meeting the minimum quality standards for accreditation', isDual: true, targets: { q1: "0%", q2: "40%", q3: "70%", q4: "80%", annual: "80%" } },
                    { id: '83', name: '83. percentage of works of ECD construction  in RURENGE,  RUKIRA', isDual: true, targets: { q1: "80%", q2: "100%", q3: "0", q4: "0", annual: "100%" } },
                    { id: '84', name: '84. Percentage of parents with children aged 0035 months benefiting from early child stimulation and positive parenting services through home visitations by CHWs', isDual: true, targets: { q1: "40%", q2: "60%", q3: "75%", q4: "85%", annual: "85%" } },
                    { id: '85', name: '85. Number of ECD Days and Social Behaviour Change Campaigns (SBCC) on nutrition and child Protection conducted', targets: { q1: 0, q2: 1, q3: 0, q4: 1, annual: 2 } },
                    { id: '86', name: '86. Percentage of children 306 years per Village attending ECD facilities/settings (home, community, center based)', isDual: true, targets: { q1: "65%", q2: "70%", q3: "80%", q4: "95%", annual: "95%" } }
                ]
            },
                {
                    id: 'so_out_6',
                    name: 'Education Infrastructure and Quality',
                    indicators: [
                        { id: '87', name: '87. Percentage of works progress for constructions of 15 classrooms and 24 toilets', isDual: true, targets: { q1: "0", q2: "0", q3: "60%", q4: "100%", annual: "100%" } },
                        { id: '88', name: '88. Percentage of works progress for 24 toilets constructed', isDual: true, targets: { q1: "0", q2: "-", q3: "60%", q4: "100%", annual: "100%" } },
                    { id: '89', name: '89. Completion of 4 retaining  walls', isDual: true, targets: { q1: "80%", q2: "100%", q3: "0", q4: "0", annual: "100%" } },
                    { id: '90', name: '90. Repetition rate in Primary school decreased', targets: { q1: "27%", q2: 0, q3: 0, q4: 0, annual: "27%" } },
                    { id: '91', name: '91. Percentage of Dropout rate decrease in primary', targets: { q1: "4.9%", q2: 0, q3: 0, q4: 0, annual: "4.9%" } },
                    { id: '92', name: '92. Number of non0literate adults trained', targets: { q1: 0, q2: 0, q3: 0, q4: 1500, annual: 1500 } },
                    { id: '93', name: '93. Percentage of students fed at school (primary)', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '94', name: '94. Percentage of students fed at school (secondary)', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '95', name: '95. Number of  Classrooms constructed', targets: { q1: 0, q2: 0, q3: 0, q4: 10, annual: 10 } },
                    { id: '96', name: '96. Number of students enrolled in pre0primary schools', targets: { q1: 0, q2: 16273, q3: "-", q4: 0, annual: 16273 } }
                ]
            },
            {
                id: 'so_out_7',
                name: 'Education Data and Management',
                indicators: [
                    { id: '97', name: '97. Percentage of payments for Teachers’ salaries made on time. (Submission of payment requests not later than 15th of every Month)', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '98', name: '98. Payments for Capitation grant   made on time', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '99', name: '99. Percentage of Education information recorded into the SDMS system with accuracy', isDual: true, targets: { q1: "-", q2: "70%", q3: "80%", q4: "85%", annual: "100%" } },
                    { id: '100', name: '100. Comprehensive Assessment and Inspection data recorded (Comprehensive Assessment Management Information System (CAMIS)', isDual: true, targets: { q1: "-", q2: "100%", q3: "-", q4: "100%", annual: "100%" } },
                    { id: '101', name: '101. Percentage of students attending school  (Primary, Secondary and TVETs)', isDual: true, targets: { q1: "98%", q2: "98%", q3: "98%", q4: "98%", annual: "98%" } },
                    { id: '102', name: '102. Percentage of Students passing comprehensive assessment: Primary', isDual: true, targets: { q1: 0, q2: "80%", q3: "80%", q4: "80%", annual: "80%" } }
                ]
            }
        ]
    },
    {
        id: 'governance',
        name: 'Transformational Governance Pillar',
        outputs: [
            {
                id: 'gv_out_1',
                name: 'Education Assessment and Digital Literacy',
                indicators: [
                    { id: '103', name: '103. Percentage of Students passing comprehensive assessment: Secondary', isDual: true, targets: { q1: 0, q2: "80%", q3: "80%", q4: "80%", annual: "80%" } },
                    { id: '104', name: '104. Percentage of Students   in TVET  L3 to L5  pass   comprehensive assessment', isDual: true, targets: { q1: 0, q2: "80%", q3: "80%", q4: "80%", annual: "80%" } },
                    { id: '105', name: '105. Number of citizens (15 years old and above) trained in basic digital literacy (Cumulative)', targets: { q1: 11400, q2: 11400, q3: 11400, q4: 11400, annual: 45600 } }
                ]
            },
            {
                id: 'gv_out_2',
                name: 'Water and Sanitation',
                indicators: [
                    { id: '106', name: '106. Number of New households connected to safe/drinking water (into their dwellings/premises)', targets: { q1: 80, q2: 102, q3: 102, q4: 166, annual: 450 } },
                    { id: '107', name: '107. Percentage of operational public water taps on functional Water Supply Systems', isDual: true, targets: { q1: "98%", q2: "98%", q3: "98%", q4: "98%", annual: "98%" } },
                    { id: '108', name: '108. Public institutions and socio0economic use areas connected to clean water', targets: { q1: 1, q2: 1, q3: 1, q4: 2, annual: 5 } },
                    { id: '109', name: '109. Percentage of public places (schools, hospitals, markets, car parks, administrative offices, churches, bars and restaurant) with hygiene and sanitation facilities (toilets, handwashing facilities, dustbins)', isDual: true, targets: { q1: "10%", q2: "40%", q3: "25%", q4: "25%", annual: "100%" } }
                ]
            },
            {
                id: 'gv_out_3',
                name: 'Social Welfare and Shelter',
                indicators: [
                    { id: '110', name: '110. Number of graduation participants provided with houses (shelters)', targets: { q1: 0, q2: 9, q3: 51, q4: 100, annual: 160 } },
                    { id: '111', name: '111. Number of houses in poor conditions rehabilitated for graduation participants', targets: { q1: 0, q2: 7, q3: 200, q4: 241, annual: 448 } },
                    { id: '112', name: '112. Number of graduation participants provided with adequate toilets', targets: { q1: 0, q2: 15, q3: 70, q4: 100, annual: 185 } },
                    { id: '113', name: '113. Number of toilets in poor conditions rehabilitated for eligible graduation participants', targets: { q1: 0, q2: 90, q3: 392, q4: 385, annual: 867 } },
                    { id: '114', name: '114. Percentage of villages in the district with operational Umugoroba w\'Imiryango', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '115', name: '115. Percentage of  identified GBV and child abuse victims reached Isange One Stop Center received reintegrated services/ support', isDual: true, targets: { q1: "10%", q2: "20%", q3: "60%", q4: "90%", annual: "90%" } },
                    { id: '116', name: '116. Percentage of identified street children reunified with families', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '117', name: '117. Percentage graduates  from rehabilitation Centers reintegrated in the community (continued education, self0employed or employed)', isDual: true, targets: { q1: "0%", q2: 0, q3: 0, q4: "100%", annual: "100%" } },
                    { id: '118', name: '118. Percentage of  delinquents  benefitted  preliminary rehabilitation program in transit center', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '119', name: '119. Number of Children in child care institutions  reintegrated into families/Detentions', targets: { q1: 2, q2: 3, q3: 3, q4: 2, annual: 10 } },
                    { id: '120', name: '120. Level of operationalization of Child Labor Elimination and Prevention Committee at District, Sector, Cell and Village level', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '121', name: '121. Proportion of teenage mothers who reintegrated to school', targets: { q1: 0, q2: "45%", q3: 0, q4: 0, annual: "45%" } },
                    { id: '122', name: '122. percentage of villages in which community0based rehabilitation is effectively operational', isDual: true, targets: { q1: "0%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '123', name: '123. Percentage of identified child  protection cases  handled by District', isDual: true, targets: { q1: "90%", q2: "90%", q3: "90%", q4: "90%", annual: "90%" } },
                    { id: '124', name: '124. Teenage Pregnancy Rate', targets: { q1: 0, q2: 0, q3: 0, q4: 20, annual: 20 } }
                ]
            },
            {
                id: 'gv_out_4',
                name: 'Administrative and Legal Governance',
                indicators: [
                    { id: '125', name: '125. Percentage of Citizens\' demands/complaints received and timely resolved by Local Government', isDual: true, targets: { q1: "97%", q2: "97%", q3: "97%", q4: "97%", annual: "97%" } },
                    { id: '126', name: '126. Percentage of Irembo services delivered by Local Government within the set timeframe', isDual: true, targets: { q1: "99%", q2: "99%", q3: "99%", q4: "99%", annual: "99%" } },
                    { id: '127', name: '127. Percentage of self application of  services delivered by LG via Irembo', isDual: true, targets: { q1: "9%", q2: "9%", q3: "9%", q4: "9%", annual: "9%" } },
                    { id: '128', name: '128. Percentage of  birth events occurring at health facilities timely recorded in NCI0CRVS', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '129', name: '129. Percentage of  death events occurring at health facilities timely recorded in NCI0CRVS', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '130', name: '130. Percentage of births events occurring at community timely registered in the NCI0CRVS system', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '131', name: '131. Percentage of  deaths events occurring at community timely registered in the NCI0CRVS system', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '132', name: '132. Percentage of  marriage and divorce events timely recorded in NCI0CRVS', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '133', name: '133. Number of biometric data capture sessions organized and executed at sector level per month', targets: { q1: 96, q2: 96, q3: 96, q4: 96, annual: 384 } },
                    { id: '134', name: '134. Number of assessments hierarchically conducted on sub District entities performance in transformational  imihigo', targets: { q1: 1, q2: 1, q3: 1, q4: 1, annual: 4 } },
                    { id: '135', name: '135. Percentage of Local new recruited Government staff benefited from capacity development interventions', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '136', name: '136. Number of cell offices rehabilitated', targets: { q1: 0, q2: 1, q3: 0, q4: 0, annual: 1 } },
                    { id: '137', name: '137. Percentage of disputes handled by Abunzi Committees', isDual: true, targets: { q1: "98%", q2: "98%", q3: "98%", q4: "100%", annual: "99.6%" } },
                    { id: '138', name: '138. Percentage of cases executed by end march 2026', isDual: true, targets: { q1: "20%", q2: "40%", q3: "65%", q4: "85%", annual: "85%" } },
                    { id: '139', name: '139. Percentage of government funds recovered from recoverable won case (85%)', isDual: true, targets: { q1: "-", q2: "20%", q3: "50%", q4: "85%", annual: "85%" } }
                ]
            },
            {
                id: 'gv_out_5',
                name: 'Unity and Financial Management',
                indicators: [
                    { id: '140', name: '140. Percentage of Villages with effectively operational Itorero structures', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '141', name: '141. Percentage of schools with effectively operational Itorero structures', isDual: true, targets: { q1: "100%", q2: "100%", q3: "100%", q4: "100%", annual: "100%" } },
                    { id: '142', name: '142. Proportion of youth ( S.6 finalist) enrolled in Voluntary National Service (Urugerero)', isDual: true, targets: { q1: "0%", q2: "0%", q3: "80%", q4: "0%", annual: "80%" } },
                    { id: '143', name: '143. Number of Ndi Umunyarwanda sessions conducted', targets: { q1: 0, q2: 1, q3: 0, q4: 0, annual: 1 } },
                    { id: '144', name: '144. Number dialogues conducted during Unity and resilience month', targets: { q1: 0, q2: 1, q3: 0, q4: 1, annual: 1 } },
                    { id: '145', name: '145.  Amount of own revenues generated (Frw)', targets: { q1: "331,650,284", q2: "411,212,592", q3: "575,515,706", q4: "366,852,181", annual: "1,685,230,763" } },
                    { id: '146', name: '146. Percentage of Auditor general\'s recommendations implemented', isDual: true, targets: { q1: "25%", q2: "50%", q3: "65%", q4: "70%", annual: "70%" } },
                    { id: '147', name: '147. Number of risk0based Areas audited', targets: { q1: 0, q2: 2, q3: 4, q4: 4, annual: 10 } },
                    { id: '148', name: '148. Percentage of District  NBAs assessed using peer review 0 peer learning approach', isDual: true, targets: { q1: "20%", q2: "50%", q3: "75%", q4: "100%", annual: "100%" } }
                ]
            }
        ]
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/imihigo_monitoring');
        console.log('Connected to DB for Seeding...');

        // Clear existing metadata
        await PillarModel.deleteMany({});
        console.log('Cleared existing pillars.');

        // Insert new data
        await PillarModel.insertMany(PILLARS_DATA);
        console.log('Seeded Pillars successfully.');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
