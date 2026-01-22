import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PillarModel, FlatIndicatorModel } from '../models';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Helper function to determine measurement type
const getMeasurementType = (targets: any): 'cumulative' | 'percentage' => {
    // Check if any target value is a percentage string
    const values = Object.values(targets);
    const hasPercentage = values.some(val => 
        typeof val === 'string' && val.includes('%')
    );
    return hasPercentage ? 'percentage' : 'cumulative';
};

// List of individual subindicator IDs that should be skipped
const SUBINDICATOR_IDS = [
    '4', '5', '6', '7', // Subindicators of indicator 3 (land use consolidation)
    '9', // Subindicator of indicator 8 (improved seed)
    '11', '12', '13', '14', // Subindicators of indicator 10 (fertilizer)
    '17', '18', '19', '20', '21', // Subindicators of indicator 16 (crop insurance)
    '25', '26', '27', '28', // Subindicators of indicator 24 (cow vaccination)
    '30', // Subindicator of indicator 29 (small livestock vaccination)
    '32', '33' // Subindicators of indicator 31 (livestock insurance)
];

// Standalone dual indicators that should be kept as dual but have no subindicators
const STANDALONE_DUAL_INDICATORS = ['43', '45', '46', '53', '59', '61', '63', '64'];

// Mapping for dual indicators based on your example data
const getSubIndicators = (indicatorId: string, indicatorName: string) => {
    const dualMappings: { [key: string]: any[] } = {
        '3': [ // Ha of land use consolidation for priority crops
            { key: 'maize', name: 'Area under land use consolidation for Maize(Ha)', targets: { q1: 3340, q2: 17568, q3: 335, q4: 0, annual: 21243 } },
            { key: 'cassava', name: 'Area under land use consolidation for Cassava(Ha)', targets: { q1: 250, q2: 1250, q3: 0, q4: 0, annual: 1500 } },
            { key: 'rice', name: 'Area under land use consolidation for Rice(Ha)', targets: { q1: 1049, q2: 5245, q3: 0, q4: 0, annual: 6294 } },
            { key: 'beans', name: 'Area under land use consolidation for Beans(Ha)', targets: { q1: 3048, q2: 15240, q3: 0, q4: 0, annual: 18288 } },
            { key: 'soya', name: 'Area under land use consolidation for Soya bean(Ha)', targets: { q1: 50, q2: 250, q3: 0, q4: 0, annual: 300 } }
        ],
        '8': [ // Quantity of improved seed
            { key: 'maize', name: 'Quantity of improved Maize seeds used (Kg)', targets: { q1: 25122, q2: 125610, q3: 2400, q4: 0, annual: 153132 } },
            { key: 'soya', name: 'Quantity of improved Soybeans seeds used (Kg)', targets: { q1: 2350, q2: 11750, q3: 0, q4: 0, annual: 14100 } }
        ],
        '10': [ // Quantity of mineral fertilizer used
            { key: 'dap', name: 'Quantity of DAP used (Kg)', targets: { q1: 92900, q2: 464500, q3: 0, q4: 0, annual: 557400 } },
            { key: 'urea', name: 'Quantity of UREA used (Kg)', targets: { q1: 76000, q2: 380000, q3: 0, q4: 0, annual: 456000 } },
            { key: 'npk', name: 'Quantity of NPK used (Kg)', targets: { q1: 141495, q2: 707475, q3: 0, q4: 0, annual: 848970 } },
            { key: 'blended', name: 'Quantity of Blended fertilizers used (Kg)', targets: { q1: 2000, q2: 10000, q3: 0, q4: 0, annual: 12000 } },
            { key: 'lime', name: 'Quantity of lime used (Kg)', targets: { q1: 181500, q2: 907500, q3: 0, q4: 0, annual: 1089000 } }
        ],
        '16': [ // Area of crops insured
            { key: 'maize', name: 'Area of Maize insured (Ha)', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
            { key: 'rice', name: 'Area of Rice insured (Ha)', targets: { q1: 818, q2: 818, q3: 818, q4: 818, annual: 3272 } },
            { key: 'beans', name: 'Area of Beans insured (Ha)', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
            { key: 'chilli', name: 'Area of Chilli insured (Ha)', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
            { key: 'soybeans', name: 'Area of soybeans insured (Ha)', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } },
            { key: 'french_beans', name: 'Area of French beans insured (Ha)', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } }
        ],
        '24': [ // Number of cows vaccinated against disease
            { key: 'lsd', name: 'Number of cows vaccinated against LSD', targets: { q1: 0, q2: 0, q3: 34000, q4: 0, annual: 34000 } },
            { key: 'rvf', name: 'Number of cows vaccinated against RVF', targets: { q1: 34000, q2: 0, q3: 0, q4: 0, annual: 34000 } },
            { key: 'brucellosis', name: 'Number of cows vaccinated against Brucellosis', targets: { q1: 0, q2: 0, q3: 2300, q4: 0, annual: 2300 } },
            { key: 'rabies', name: 'Number of cows vaccinated against Rabies', targets: { q1: 0, q2: 0, q3: 300, q4: 0, annual: 300 } },
            { key: 'blackquarter', name: 'Number of cows vaccinated against Blackquarter', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } }
        ],
        '29': [ // Number of small livestock vaccinated against RVF
            { key: 'sheep', name: 'Number of Sheep vaccinated against RVF', targets: { q1: 2300, q2: 0, q3: 0, q4: 0, annual: 2300 } },
            { key: 'goats', name: 'Number of Goats vaccinated against RVF', targets: { q1: 0, q2: 0, q3: 0, q4: 0, annual: 0 } }
        ],
        '31': [ // Number of livestock insured
            { key: 'pigs', name: 'Number of pigs insured', targets: { q1: 50, q2: 200, q3: 100, q4: 150, annual: 500 } },
            { key: 'poultry', name: 'Number of poultry insured', targets: { q1: 0, q2: 1000, q3: 7000, q4: 3000, annual: 11000 } }
        ]
        // Add more mappings as needed based on your data
    };

    return dualMappings[indicatorId] || null;
};

const migrateIndicators = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || '');
        console.log('Connected to MongoDB for migration...');

        // Clear existing flat indicators
        await FlatIndicatorModel.deleteMany({});
        console.log('Cleared existing flat indicators.');

        // Get all pillars
        const pillars = await PillarModel.find({});
        console.log(`Found ${pillars.length} pillars to migrate...`);

        let orderCounter = 1;
        const flatIndicators: any[] = [];

        pillars.forEach(pillar => {
            pillar.outputs.forEach((output: any) => {
                output.indicators.forEach((indicator: any) => {
                    // Skip individual subindicators - they will be handled as part of dual indicators
                    if (SUBINDICATOR_IDS.includes(indicator.id)) {
                        return;
                    }

                    const flatIndicator: any = {
                        id: indicator.id,
                        name: indicator.name.replace(/^\d+\.\s*/, ''), // Remove numbering like "1. ", "2. " etc.
                        pillarId: pillar.id,
                        order: orderCounter++,
                        createdAt: new Date('2024-01-15T10:30:00.000Z'),
                        updatedAt: new Date('2024-01-15T10:30:00.000Z')
                    };

                    // Check if this is a dual indicator and has sub-indicators mapping
                    const subIndicators = getSubIndicators(indicator.id, indicator.name);
                    if (subIndicators) {
                        flatIndicator.isDual = true;
                        flatIndicator.subIndicators = subIndicators;
                        // Parent indicators with subindicators should NOT have targets or measurementType
                    } else if (indicator.isDual || STANDALONE_DUAL_INDICATORS.includes(indicator.id)) {
                        // For dual indicators without specific mapping or standalone dual indicators, keep isDual flag
                        flatIndicator.isDual = true;
                        flatIndicator.measurementType = getMeasurementType(indicator.targets);
                        flatIndicator.targets = indicator.targets;
                    } else {
                        // Only standalone indicators get targets and measurementType
                        flatIndicator.measurementType = getMeasurementType(indicator.targets);
                        flatIndicator.targets = indicator.targets;
                    }

                    flatIndicators.push(flatIndicator);
                });
            });
        });

        // Insert all flat indicators
        await FlatIndicatorModel.insertMany(flatIndicators);
        console.log(`Successfully migrated ${flatIndicators.length} indicators to flat structure.`);

        // Show sample of migrated data
        const sample = await FlatIndicatorModel.find({}).limit(5);
        console.log('\nSample migrated indicators:');
        sample.forEach((ind: any) => {
            console.log(`- ${ind.id}: ${ind.name} (${ind.pillarId})`);
            if (ind.isDual) {
                console.log(`  Dual indicator with ${ind.subIndicators?.length || 0} sub-indicators`);
            }
        });

        process.exit(0);
    } catch (error: any) {
        console.error('Migration error:', error.message);
        process.exit(1);
    }
};

migrateIndicators();
